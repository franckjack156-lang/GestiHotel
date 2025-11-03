// src/Config/firebase.js - VERSION CORRIGÉE POUR FIREBASE 12 + VITE
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// ✅ IMPORTANT: Importer TOUS les modules Firestore nécessaires AVANT getFirestore
import { 
  getFirestore,
  enableIndexedDbPersistence,
  connectFirestoreEmulator 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('🔥 Initialisation Firebase...');

// ✅ ÉTAPE 1: Initialiser l'app
const app = initializeApp(firebaseConfig);
console.log('✅ App initialisée');

// ✅ ÉTAPE 2: Initialiser Auth
const auth = getAuth(app);
console.log('✅ Auth initialisée');

// ✅ ÉTAPE 3: Initialiser Firestore (avec gestion d'erreur)
let db;
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialisée');
  
  // Optionnel: Activer la persistance offline
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Persistance: Plusieurs onglets ouverts');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Persistance: Navigateur non supporté');
      }
    });
  }
} catch (error) {
  console.error('❌ ERREUR Firestore:', error);
  throw new Error('Impossible d\'initialiser Firestore: ' + error.message);
}

// ✅ ÉTAPE 4: Initialiser Storage
const storage = getStorage(app);
console.log('✅ Storage initialisée');

// ✅ ÉTAPE 5: Initialiser Functions
const functions = getFunctions(app);
console.log('✅ Functions initialisées');

// Export des services principaux
export { app, auth, db, storage, functions };

// ===================================
// 📱 FIREBASE CLOUD MESSAGING
// ===================================

let messaging = null;
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || null;

export const initializeMessaging = async () => {
  if (typeof window === 'undefined') {
    console.log('⚪ FCM: Mode serveur détecté');
    return null;
  }

  try {
    const { getMessaging, isSupported } = await import('firebase/messaging');
    
    const supported = await isSupported();
    if (!supported) {
      console.warn('⚠️ FCM non supporté par ce navigateur');
      return null;
    }

    if (!vapidKey) {
      console.warn('⚠️ VAPID Key manquante - Ajoutez VITE_FIREBASE_VAPID_KEY dans .env');
      return null;
    }

    messaging = getMessaging(app);
    console.log('✅ FCM initialisé avec succès');
    return messaging;
    
  } catch (error) {
    console.warn('⚠️ Erreur initialisation FCM:', error.message);
    return null;
  }
};

// Auto-initialisation de FCM après chargement
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      initializeMessaging().then(msg => {
        if (msg) messaging = msg;
      });
    }, 1000);
  });
}

export { messaging, vapidKey };

// ===================================
// 📊 ANALYTICS
// ===================================

let analytics = null;

if (typeof window !== 'undefined' && import.meta.env.PROD && firebaseConfig.measurementId) {
  import('firebase/analytics')
    .then(({ getAnalytics, logEvent, setUserId, setUserProperties }) => {
      try {
        analytics = getAnalytics(app);
        console.log('✅ Analytics initialisée');
        
        window.__firebaseAnalytics = {
          logEvent,
          setUserId,
          setUserProperties,
          instance: analytics
        };
      } catch (error) {
        console.warn('⚠️ Analytics non disponible:', error.message);
      }
    })
    .catch(err => {
      console.warn('⚠️ Erreur chargement Analytics:', err.message);
    });
}

export { analytics };

// ===================================
// 📊 ANALYTICS HELPERS
// ===================================

export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  if (window.__firebaseAnalytics?.logEvent && analytics) {
    try {
      window.__firebaseAnalytics.logEvent(analytics, eventName, {
        ...eventParams,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('⚠️ Erreur log analytics:', error.message);
    }
  }
};

export const setAnalyticsUser = (userId, userProperties = {}) => {
  if (window.__firebaseAnalytics?.setUserId && window.__firebaseAnalytics?.setUserProperties && analytics) {
    try {
      window.__firebaseAnalytics.setUserId(analytics, userId);
      window.__firebaseAnalytics.setUserProperties(analytics, userProperties);
    } catch (error) {
      console.warn('⚠️ Erreur set analytics user:', error.message);
    }
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
      page_path: typeof window !== 'undefined' ? window.location.pathname : ''
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

// ===================================
// 🔍 PERFORMANCE MONITORING
// ===================================

let performance = null;

if (typeof window !== 'undefined' && import.meta.env.PROD) {
  import('firebase/performance')
    .then(({ getPerformance }) => {
      try {
        performance = getPerformance(app);
        console.log('✅ Performance monitoring initialisé');
      } catch (error) {
        console.warn('⚠️ Performance monitoring non disponible:', error.message);
      }
    })
    .catch(() => {
      // Silent fail
    });
}

export { performance };

console.log('');
console.log('📦 Firebase - Configuration chargée:');
console.log('   ✅ App');
console.log('   ✅ Auth');
console.log('   ✅ Firestore');
console.log('   ✅ Storage');
console.log('   ✅ Functions');
console.log('   ⏳ Messaging (chargement différé)');
console.log('   ⚪ Analytics (prod uniquement)');
console.log('   ⚪ Performance (prod uniquement)');
console.log('');

export default app;