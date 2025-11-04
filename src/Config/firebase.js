// src/Config/firebase.js - FIREBASE 12 COMPATIBLE
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// ✅ Import différent pour Firebase 12
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('🔥 Initialisation Firebase 12...');

// Initialiser l'app
const app = initializeApp(firebaseConfig);
console.log('✅ App initialisée');

// Auth
const auth = getAuth(app);
console.log('✅ Auth initialisée');

// Storage
const storage = getStorage(app);
console.log('✅ Storage initialisée');

// Functions
const functions = getFunctions(app);
console.log('✅ Functions initialisées');

// ✅ FIRESTORE: Import dynamique avec fallback
let db = null;

const initFirestore = async () => {
  try {
    // Essayer avec la nouvelle API
    const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } = 
      await import('firebase/firestore');
    
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    console.log('✅ Firestore initialisée (avec cache)');
    return db;
  } catch (error) {
    console.warn('⚠️ Erreur init avec cache:', error.message);
    
    // Fallback: sans cache
    try {
      const { getFirestore } = await import('firebase/firestore');
      db = getFirestore(app);
      console.log('✅ Firestore initialisée (sans cache)');
      return db;
    } catch (fallbackError) {
      console.error('❌ Erreur Firestore complète:', fallbackError);
      throw new Error('Impossible d\'initialiser Firestore: ' + fallbackError.message);
    }
  }
};

// Initialiser Firestore de manière asynchrone
initFirestore().catch(err => {
  console.error('❌ Init Firestore échouée:', err);
});

// ✅ Getter pour db (attend que l'init soit terminée)
const getDb = () => {
  if (!db) {
    throw new Error('Firestore n\'est pas encore initialisée. Utilisez await initFirestore() d\'abord.');
  }
  return db;
};

// Export
export { app, auth, storage, functions, getDb, initFirestore };
export { db }; // Pour compatibilité, mais préférer getDb()

// ===================================
// 📱 FCM
// ===================================
let messaging = null;
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || null;

export const initializeMessaging = async () => {
  if (typeof window === 'undefined') return null;

  try {
    const { getMessaging, isSupported } = await import('firebase/messaging');
    const supported = await isSupported();
    if (!supported) {
      console.warn('⚠️ FCM non supporté');
      return null;
    }
    if (!vapidKey) {
      console.warn('⚠️ VAPID Key manquante');
      return null;
    }
    messaging = getMessaging(app);
    console.log('✅ FCM initialisé');
    return messaging;
  } catch (error) {
    console.warn('⚠️ Erreur FCM:', error.message);
    return null;
  }
};

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
// 📊 Analytics
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
        console.warn('⚠️ Analytics:', error.message);
      }
    })
    .catch(() => {});
}

export { analytics };

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
  if (window.__firebaseAnalytics?.setUserId && analytics) {
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
    logAnalyticsEvent('login', { method: 'email', user_role: role });
  },
  userCreated: (role) => {
    logAnalyticsEvent('user_created', { user_role: role });
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
// 🔍 Performance
// ===================================
let performance = null;

if (typeof window !== 'undefined' && import.meta.env.PROD) {
  import('firebase/performance')
    .then(({ getPerformance }) => {
      try {
        performance = getPerformance(app);
        console.log('✅ Performance monitoring initialisé');
      } catch (error) {
        console.warn('⚠️ Performance:', error.message);
      }
    })
    .catch(() => {});
}

export { performance };

console.log('');
console.log('📦 Firebase 12 - Configuration chargée');
console.log('');

export default app;