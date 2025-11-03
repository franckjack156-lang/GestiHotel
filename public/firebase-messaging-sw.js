// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuration Firebase (remplacer par vos valeurs)
firebase.initializeApp({
  apiKey: "VITE_FIREBASE_API_KEY ",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN ",
  projectId: "VITE_FIREBASE_PROJECT_ID ",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET ",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "VITE_FIREBASE_APP_ID "
});

const messaging = firebase.messaging();

// Gérer les notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('Message reçu en arrière-plan:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Rediriger vers l'intervention si un ID est fourni
  if (event.notification.data?.interventionId) {
    event.waitUntil(
      clients.openWindow(`/?intervention=${event.notification.data.interventionId}`)
    );
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});