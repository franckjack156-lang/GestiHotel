importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ✅ CORRECTION 1: Utiliser les vrais credentials au lieu des variables
// Ces valeurs doivent être remplacées par vos vraies credentials Firebase
// Ou mieux : utiliser Firebase Hosting avec auto-configuration

const firebaseConfig = {
  apiKey: "AIzaSyCozSTau1BTAanAwsCQZ5tiMGqkVIcmxLI",           // À remplacer
  authDomain: "gestihotel-ec24f.firebaseapp.com",   // À remplacer
  projectId: "gestihotel-ec24f",     // À remplacer
  storageBucket: "gestihotel-ec24f.firebasestorage.app", // À remplacer
  messagingSenderId: "850075116529",  // À remplacer
  appId: "1:850075116529:web:1fad6d1423dd529d6d9a50"              // À remplacer
};

// Initialiser Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialisé dans le Service Worker');
} catch (error) {
  console.error('❌ Erreur initialisation Firebase:', error);
}

// Récupérer l'instance messaging
const messaging = firebase.messaging();

// ✅ CORRECTION 2: Meilleure gestion des notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Message reçu en arrière-plan:', payload);
  
  // ✅ Validation du payload
  if (!payload.notification) {
    console.warn('[SW] Payload sans notification, ignoré');
    return;
  }
  
  const notificationTitle = payload.notification.title || 'GestiHôtel';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: payload.notification.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: payload.data || {},
    tag: payload.data?.interventionId || 'gestihotel-notification',
    requireInteraction: payload.data?.priority === 'urgent', // Notification persistante si urgent
    vibrate: payload.data?.priority === 'urgent' ? [200, 100, 200] : [100],
    actions: [
      {
        action: 'view',
        title: 'Voir',
        icon: '/icons/view.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icons/close.png'
      }
    ]
  };

  // ✅ Afficher la notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ CORRECTION 3: Meilleure gestion du clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event.notification.data);
  
  event.notification.close();
  
  // Gestion des actions
  if (event.action === 'close') {
    return;
  }
  
  // Construire l'URL de destination
  let urlToOpen = '/';
  
  if (event.notification.data?.interventionId) {
    urlToOpen = `/?intervention=${event.notification.data.interventionId}`;
  } else if (event.notification.data?.url) {
    urlToOpen = event.notification.data.url;
  }
  
  // ✅ Ouvrir ou focus la fenêtre existante
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher si une fenêtre est déjà ouverte
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(client => {
              // ✅ Naviguer vers l'intervention
              if (client.navigate) {
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
});

// ✅ CORRECTION 4: Gestion de la fermeture de notification
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée:', event.notification.data);
  
  // Analytics ou tracking ici si nécessaire
});

// ✅ CORRECTION 5: Message au client quand le SW est prêt
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activé');
  
  // Nettoyer les anciens caches si nécessaire
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Garder seulement les caches récents
            return cacheName.startsWith('gestihotel-') && 
                   !cacheName.includes(self.registration.scope);
          })
          .map((cacheName) => {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

console.log('[SW] Firebase Messaging Service Worker chargé');
