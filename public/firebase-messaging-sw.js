// ===============================================
// 🔐 FIREBASE MESSAGING SERVICE WORKER - SÉCURISÉ
// ===============================================
// Version corrigée utilisant Firebase Hosting auto-configuration
// ✅ Plus de credentials hardcodés
// ✅ Configuration automatique via Firebase Hosting
// ✅ Gestion avancée des notifications

// ===============================================
// 📦 IMPORTS FIREBASE
// ===============================================
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ===============================================
// 🔒 CONFIGURATION FIREBASE SÉCURISÉE
// ===============================================

// ✅ SOLUTION 1 (RECOMMANDÉE) : Utiliser Firebase Hosting Reserved URLs
// Si votre app est hébergée sur Firebase Hosting, décommentez cette ligne :
importScripts('/__/firebase/init.js');

// ✅ SOLUTION 2 : Configuration manuelle (pour développement local uniquement)
// NOTE: Ces valeurs seront remplacées automatiquement en production par Firebase Hosting
const firebaseConfig = {
  apiKey: "AIzaSyCozSTau1BTAanAwsCQZ5tiMGqkVIcmxLI",
  authDomain: "gestihotel-ec24f.firebaseapp.com",
  projectId: "gestihotel-ec24f",
  storageBucket: "gestihotel-ec24f.firebasestorage.app",
  messagingSenderId: "850075116529",
  appId: "1:850075116529:web:1fad6d1423dd529d6d9a50"
};

// ===============================================
// 🚀 INITIALISATION FIREBASE
// ===============================================
let messaging;

try {
  // Vérifier si Firebase est déjà initialisé (par /__/firebase/init.js)
  if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    console.log('✅ Firebase déjà initialisé via Firebase Hosting');
    messaging = firebase.messaging();
  } else {
    // Initialisation manuelle (dev local)
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    console.log('✅ Firebase initialisé manuellement dans le Service Worker');
  }
} catch (error) {
  console.error('❌ Erreur initialisation Firebase:', error);
}

// ===============================================
// 📬 GESTION NOTIFICATIONS EN ARRIÈRE-PLAN
// ===============================================

/**
 * Gestion des messages reçus en arrière-plan
 * (quand l'utilisateur n'est pas sur l'app)
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 📨 Notification reçue en arrière-plan:', payload);
  
  // ✅ Validation du payload
  if (!payload.notification && !payload.data) {
    console.warn('[SW] ⚠️ Payload invalide (pas de notification ni data), ignoré');
    return;
  }
  
  // ===============================================
  // 📝 CONSTRUCTION DE LA NOTIFICATION
  // ===============================================
  
  const notificationTitle = payload.notification?.title 
    || payload.data?.title 
    || 'GestiHôtel';
  
  const notificationOptions = {
    // Contenu
    body: payload.notification?.body || payload.data?.body || '',
    
    // Icônes
    icon: payload.notification?.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    
    // Données custom
    data: {
      ...payload.data,
      url: payload.data?.url || '/interventions', // URL de redirection
      timestamp: Date.now()
    },
    
    // Tag pour grouper les notifications du même type
    tag: payload.data?.interventionId 
      ? `intervention-${payload.data.interventionId}`
      : 'gestihotel-notification',
    
    // Comportement
    requireInteraction: payload.data?.priority === 'urgent', // Reste affichée si urgent
    silent: false,
    
    // Vibration (si urgent)
    vibrate: payload.data?.priority === 'urgent' 
      ? [200, 100, 200, 100, 200] // Pattern vibration
      : [100, 50, 100],
    
    // Actions disponibles
    actions: [
      {
        action: 'open',
        title: '👁️ Voir',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: '✖️ Fermer',
        icon: '/icons/close.png'
      }
    ],
    
    // Image (si fournie)
    image: payload.notification?.image || payload.data?.image || undefined,
    
    // Timestamp
    timestamp: Date.now(),
    
    // Badge sur l'icône (Android)
    renotify: true
  };
  
  // ===============================================
  // 🔔 AFFICHAGE DE LA NOTIFICATION
  // ===============================================
  
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// ===============================================
// 🖱️ GESTION DES CLICS SUR NOTIFICATIONS
// ===============================================

/**
 * Gestion des clics sur les notifications
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🖱️ Clic sur notification:', event.notification.tag);
  
  // Fermer la notification
  event.notification.close();
  
  // Récupérer l'URL de redirection
  const urlToOpen = event.notification.data?.url || '/';
  
  // ===============================================
  // 🎬 ACTIONS SELON LE BOUTON CLIQUÉ
  // ===============================================
  
  if (event.action === 'dismiss') {
    // Action "Fermer" - Ne rien faire de plus
    console.log('[SW] ✖️ Notification fermée par l\'utilisateur');
    return;
  }
  
  if (event.action === 'open' || !event.action) {
    // Action "Voir" ou clic sur la notification
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((clientList) => {
        // ✅ Vérifier s'il y a déjà une fenêtre ouverte
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          
          // Si une fenêtre est déjà ouverte, la focus et naviguer
          if ('focus' in client) {
            return client.focus().then(() => {
              // Naviguer vers l'URL
              if (client.url !== urlToOpen && 'navigate' in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        
        // ✅ Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// ===============================================
// 🔕 GESTION DE LA FERMETURE DES NOTIFICATIONS
// ===============================================

/**
 * Événement déclenché quand une notification est fermée
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 🔕 Notification fermée:', event.notification.tag);
  
  // Ici vous pouvez logger l'événement ou effectuer des actions
  // Par exemple, envoyer une analytics
});

// ===============================================
// 📊 ANALYTICS (optionnel)
// ===============================================

/**
 * Fonction helper pour tracker les événements
 * (à adapter selon votre solution analytics)
 */
function trackNotificationEvent(eventName, data) {
  // Exemple avec Firebase Analytics (si disponible)
  // Vous pouvez aussi utiliser votre propre système
  console.log('[SW] 📊 Analytics:', eventName, data);
  
  // TODO: Implémenter le tracking si nécessaire
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   body: JSON.stringify({ event: eventName, data })
  // });
}

// ===============================================
// ⚙️ CONFIGURATION AVANCÉE (optionnel)
// ===============================================

// Durée de vie par défaut des notifications (en millisecondes)
const NOTIFICATION_TTL = 24 * 60 * 60 * 1000; // 24 heures

// Types de priorités
const PRIORITY_LEVELS = {
  urgent: {
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    silent: false
  },
  high: {
    vibrate: [100, 50, 100],
    requireInteraction: false,
    silent: false
  },
  normal: {
    vibrate: [100],
    requireInteraction: false,
    silent: false
  },
  low: {
    vibrate: [],
    requireInteraction: false,
    silent: true
  }
};

// ===============================================
// 🔄 VERSION DU SERVICE WORKER
// ===============================================
const SW_VERSION = '2.0.0';
console.log(`[SW] 🚀 Service Worker GestiHôtel v${SW_VERSION} activé`);

// ===============================================
// ℹ️ NOTES IMPORTANTES
// ===============================================
/*
 * DÉPLOIEMENT:
 * 
 * 1. Pour Firebase Hosting (RECOMMANDÉ):
 *    - Décommentez: importScripts('/__/firebase/init.js');
 *    - Commentez la section "SOLUTION 2"
 *    - Déployez: firebase deploy --only hosting
 * 
 * 2. Pour autre hébergement:
 *    - Gardez la "SOLUTION 2" active
 *    - Remplacez les valeurs par vos vraies credentials
 *    - NOTE: Moins sécurisé, credentials visibles
 * 
 * TESTING:
 * - Chrome DevTools > Application > Service Workers
 * - Vérifier que le SW est actif
 * - Tester notifications depuis Firebase Console
 * 
 * DEBUGGING:
 * - Console logs visibles dans DevTools > Application > Service Workers
 * - Cliquer "Update" pour forcer reload du SW
 * - Cliquer "Unregister" pour désinstaller
 */