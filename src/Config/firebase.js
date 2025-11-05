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

if (import.meta.env.DEV) {
  console.log('🔥 Initialisation Firebase 12...');
}

// Initialiser l'app
const app = initializeApp(firebaseConfig);

if (import.meta.env.DEV) {
  console.log('✅ App initialisée');
}

// Auth
const auth = getAuth(app);

if (import.meta.env.DEV) {
  console.log('✅ Auth initialisée');
}

// Storage
const storage = getStorage(app);

if (import.meta.env.DEV) {
  console.log('✅ Storage initialisée');
}

// Functions
const functions = getFunctions(app);

if (import.meta.env.DEV) {
  console.log('✅ Functions initialisées');
}

// ✅ FIRESTORE: Import dynamique avec fallback
let db = null;
let dbInitPromise = null;

const initFirestore = async () => {
  // Si déjà initialisé, retourner l'instance
  if (db) return db;

  // Si initialisation en cours, attendre la promesse existante
  if (dbInitPromise) return dbInitPromise;

  // Créer une nouvelle promesse d'initialisation
  dbInitPromise = (async () => {
    try {
      // Essayer avec la nouvelle API
      const { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } =
        await import('firebase/firestore');

      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });

      if (import.meta.env.DEV) {
        console.log('✅ Firestore initialisée (avec cache)');
      }
      return db;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Erreur init avec cache:', error.message);
      }

      // Fallback: sans cache
      try {
        const { getFirestore } = await import('firebase/firestore');
        db = getFirestore(app);

        if (import.meta.env.DEV) {
          console.log('✅ Firestore initialisée (sans cache)');
        }
        return db;
      } catch (fallbackError) {
        console.error('❌ Erreur Firestore complète:', fallbackError);
        throw new Error('Impossible d\'initialiser Firestore: ' + fallbackError.message);
      }
    }
  })();

  return dbInitPromise;
};

// Initialiser Firestore immédiatement
initFirestore().catch(err => {
  console.error('❌ Init Firestore échouée:', err);
});

// ✅ Getter pour db (attend que l'init soit terminée)
const getDb = async () => {
  if (!db) {
    await initFirestore();
  }
  return db;
};

// ✅ Getter synchrone pour compatibilité (lance une erreur si pas initialisé)
const getDbSync = () => {
  if (!db) {
    throw new Error('Firestore n\'est pas encore initialisée. Utilisez await getDb() ou await initFirestore().');
  }
  return db;
};

// Export
export { app, auth, storage, functions, getDb, getDbSync, initFirestore };
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
      if (import.meta.env.DEV) {
        console.warn('⚠️ FCM non supporté');
      }
      return null;
    }
    if (!vapidKey) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ VAPID Key manquante');
      }
      return null;
    }
    messaging = getMessaging(app);
    if (import.meta.env.DEV) {
      console.log('✅ FCM initialisé');
    }
    return messaging;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Erreur FCM:', error.message);
    }
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
        if (import.meta.env.DEV) {
          console.log('✅ Analytics initialisée');
        }
        window.__firebaseAnalytics = {
          logEvent,
          setUserId,
          setUserProperties,
          instance: analytics
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Analytics:', error.message);
        }
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
      if (import.meta.env.DEV) {
        console.warn('⚠️ Erreur log analytics:', error.message);
      }
    }
  }
};

export const setAnalyticsUser = (userId, userProperties = {}) => {
  if (window.__firebaseAnalytics?.setUserId && analytics) {
    try {
      window.__firebaseAnalytics.setUserId(analytics, userId);
      window.__firebaseAnalytics.setUserProperties(analytics, userProperties);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Erreur set analytics user:', error.message);
      }
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
        if (import.meta.env.DEV) {
          console.log('✅ Performance monitoring initialisé');
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Performance:', error.message);
        }
      }
    })
    .catch(() => {});
}

export { performance };

if (import.meta.env.DEV) {
  console.log('');
  console.log('📦 Firebase 12 - Configuration chargée');
  console.log('');
}

export default app;