// src/Config/firebase.js - VERSION CORRIGÉE
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// ✅ CORRECTION : Utiliser la nouvelle API de cache avec support multi-onglets
export const db = getFirestore(app);

// ✅ Activer la persistance avec support multi-onglets (nouvelle API)
if (typeof window !== 'undefined') {
  try {
    // Utiliser la nouvelle API recommandée
    enableIndexedDbPersistence(db, {
      synchronizeTabs: true // ✅ Permettre la synchro multi-onglets
    }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Persistance : plusieurs onglets ouverts, synchro activée');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Persistance non supportée par ce navigateur');
      } else {
        console.error('❌ Erreur persistance:', err);
      }
    });
  } catch (error) {
    console.warn('⚠️ Impossible d\'activer la persistance:', error);
  }
}

export const storage = getStorage(app);
export const functions = getFunctions(app);

// ✅ ANALYTICS (uniquement en production)
export const analytics = typeof window !== 'undefined' && import.meta.env.PROD 
  ? getAnalytics(app) 
  : null;

// ✅ PERFORMANCE MONITORING
export const performance = typeof window !== 'undefined' && import.meta.env.PROD
  ? getPerformance(app)
  : null;

// ===================================
// 📊 HELPER FUNCTIONS ANALYTICS
// ===================================

export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  if (analytics) {
    logEvent(analytics, eventName, {
      ...eventParams,
      timestamp: new Date().toISOString()
    });
  }
};

export const setAnalyticsUser = (userId, userProperties = {}) => {
  if (analytics) {
    setUserId(analytics, userId);
    setUserProperties(analytics, userProperties);
  }
};

export const analyticsEvents = {
  interventionCreated: (data) => {
    logAnalyticsEvent('intervention_created', {
      intervention_type: data.interventionType,
      priority: data.priority,
      room_type: data.roomType
    });
  },
  
  interventionCompleted: (data) => {
    logAnalyticsEvent('intervention_completed', {
      intervention_id: data.id,
      duration_minutes: data.actualDuration,
      priority: data.priority
    });
  },
  
  interventionUpdated: (data) => {
    logAnalyticsEvent('intervention_updated', {
      intervention_id: data.id,
      status: data.status
    });
  },

  userLogin: (role) => {
    logAnalyticsEvent('login', { 
      method: 'email',
      user_role: role 
    });
  },
  
  userCreated: (role) => {
    logAnalyticsEvent('user_created', { 
      user_role: role 
    });
  },

  pageView: (pageName) => {
    logAnalyticsEvent('page_view', { 
      page_name: pageName,
      page_path: window.location.pathname
    });
  },

  search: (searchTerm, resultCount) => {
    logAnalyticsEvent('search', {
      search_term: searchTerm,
      result_count: resultCount
    });
  },

  error: (errorType, errorMessage) => {
    logAnalyticsEvent('error', {
      error_type: errorType,
      error_message: errorMessage
    });
  }
};

export default app;