// src/Config/firebase.js - VERSION MINIMALISTE GARANTIE
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// ⚠️ NE PAS importer getMessaging ici - ça cause des conflits avec Firestore
// Il sera importé dynamiquement plus tard

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

// ✅ 1. Initialiser l'app
const app = initializeApp(firebaseConfig);
console.log('✅ App initialisée');

// ✅ 2. Initialiser Auth
const auth = getAuth(app);
console.log('✅ Auth initialisée');

// ✅ 3. Initialiser Firestore AVEC LA NOUVELLE API
// 🔑 IMPORTANT: Utiliser initializeFirestore au lieu de getFirestore
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
console.log('✅ Firestore initialisée');

// ✅ 4. Initialiser Storage
const storage = getStorage(app);
console.log('✅ Storage initialisée');

// ✅ 5. Initialiser Functions
const functions = getFunctions(app);
console.log('✅ Functions initialisées');

// ✅ Exports principaux
export { app, auth, db, storage, functions };

// ===================================
// 📱 FIREBASE CLOUD MESSAGING
// ===================================
// ⚠️ Importé APRÈS Firestore pour éviter les conflits

let messaging = null;
let vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || null;

// Fonction pour initialiser FCM (appelée après le chargement complet)
export const initializeMessaging = async () => {
  if (typeof window === 'undefined') {
    console.log('⚪ FCM: Mode serveur, skip');
    return null;
  }

  try {
    // Import dynamique pour éviter les conflits
    const { getMessaging, isSupported } = await import('firebase/messaging');
    
    const supported = await isSupported();
    if (!supported) {
      console.warn('⚠️ FCM non supporté par ce navigateur');
      return null;
    }

    if (!vapidKey) {
      console.warn('⚠️ VAPID Key manquante dans .env');
      return null;
    }

    messaging = getMessaging(app);
    console.log('✅ FCM initialisé');
    return messaging;
    
  } catch (error) {
    console.warn('⚠️ Erreur initialisation FCM:', error.message);
    return null;
  }
};

// Initialiser FCM après un délai
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initializeMessaging().then(msg => {
      if (msg) {
        messaging = msg;
      }
    });
  }, 500); // Délai de 500ms pour laisser Firestore se charger
}

export { messaging, vapidKey };

// ===================================
// 📊 ANALYTICS
// ===================================

let analytics = null;

// Import dynamique d'analytics
if (typeof window !== 'undefined' && import.meta.env.PROD && firebaseConfig.measurementId) {
  import('firebase/analytics').then(({ getAnalytics, logEvent: logEventFn, setUserId: setUserIdFn, setUserProperties: setUserPropertiesFn }) => {
    try {
      analytics = getAnalytics(app);
      console.log('✅ Analytics initialisée');
      
      // Exporter les fonctions analytics
      window._logEvent = logEventFn;
      window._setUserId = setUserIdFn;
      window._setUserProperties = setUserPropertiesFn;
    } catch (error) {
      console.warn('⚠️ Analytics non disponible:', error.message);
    }
  }).catch(err => {
    console.warn('⚠️ Erreur chargement Analytics:', err);
  });
}

export { analytics };

// ===================================
// 📊 ANALYTICS HELPERS
// ===================================

export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  if (analytics && window._logEvent) {
    try {
      window._logEvent(analytics, eventName, {
        ...eventParams,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('⚠️ Erreur log analytics:', error);
    }
  }
};

export const setAnalyticsUser = (userId, userProperties = {}) => {
  if (analytics && window._setUserId && window._setUserProperties) {
    try {
      window._setUserId(analytics, userId);
      window._setUserProperties(analytics, userProperties);
    } catch (error) {
      console.warn('⚠️ Erreur set analytics user:', error);
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
// 🔍 PERFORMANCE (optionnel)
// ===================================

let performance = null;

if (typeof window !== 'undefined' && import.meta.env.PROD) {
  import('firebase/performance').then(({ getPerformance }) => {
    try {
      performance = getPerformance(app);
      console.log('✅ Performance monitoring initialisé');
    } catch (error) {
      console.warn('⚠️ Performance monitoring non disponible');
    }
  }).catch(() => {
    // Silencieux
  });
}

export { performance };

// ===================================
// ✅ RÉSUMÉ
// ===================================

console.log('');
console.log('📦 Firebase - Services chargés:');
console.log('   ✅ App');
console.log('   ✅ Auth');
console.log('   ✅ Firestore');
console.log('   ✅ Storage');
console.log('   ✅ Functions');
console.log('   ⏳ Messaging (chargement...)');
console.log('   ⚪ Analytics (prod only)');
console.log('   ⚪ Performance (prod only)');
console.log('');

export default app;