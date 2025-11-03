// src/services/notificationService.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  serverTimestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, app } from '../config/firebase';

// Clé VAPID (à générer dans Firebase Console)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

class NotificationService {
  constructor() {
    this.messaging = null;
    this.currentToken = null;
    this.unsubscribe = null;
    this.init();
  }

  /**
   * Initialiser le service de messaging
   */
  async init() {
    try {
      if (!('Notification' in window)) {
        console.warn('Ce navigateur ne supporte pas les notifications');
        return;
      }

      this.messaging = getMessaging(app);
      console.log('✅ NotificationService initialisé');
      
    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
    }
  }

  /**
   * Obtenir le token FCM
   */
  async getToken() {
    try {
      if (!this.messaging) {
        await this.init();
      }

      if (!VAPID_KEY) {
        throw new Error('VAPID_KEY manquante dans les variables d\'environnement');
      }

      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY
      });

      if (token) {
        this.currentToken = token;
        console.log('✅ Token FCM obtenu');
        return token;
      }

      return null;
    } catch (error) {
      console.error('Erreur obtention token FCM:', error);
      throw error;
    }
  }

  /**
   * Demander la permission et obtenir le token
   */
  async requestPermission() {
    try {
      if (!this.isSupported()) {
        throw new Error('Notifications non supportées');
      }

      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        return null;
      }

      // Obtenir le token FCM
      const token = await this.getToken();
      return token;

    } catch (error) {
      console.error('Erreur demande permission:', error);
      throw error;
    }
  }

  /**
   * Sauvegarder le token pour un utilisateur
   */
  async saveTokenToUser(userId, token) {
    return await this.saveTokenToFirestore(userId, token);
  }

  /**
   * Sauvegarder le token FCM dans Firestore
   */
  async saveTokenToFirestore(userId, token) {
    try {
      const tokensRef = collection(db, 'fcmTokens');
      
      // Vérifier si le token existe déjà
      const q = query(tokensRef, where('token', '==', token));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await addDoc(tokensRef, {
          userId,
          token,
          device: this.getDeviceInfo(),
          createdAt: serverTimestamp(),
          lastUsed: serverTimestamp()
        });
        console.log('✅ Token sauvegardé dans Firestore');
      } else {
        // Mettre à jour lastUsed
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, 'fcmTokens', docId), {
          lastUsed: serverTimestamp()
        });
        console.log('✅ Token mis à jour dans Firestore');
      }
    } catch (error) {
      console.error('Erreur sauvegarde token:', error);
      throw error;
    }
  }

  /**
   * Supprimer le token FCM
   */
  async removeToken(userId) {
    try {
      if (!this.currentToken) return true;
      
      const tokensRef = collection(db, 'fcmTokens');
      const q = query(
        tokensRef, 
        where('userId', '==', userId),
        where('token', '==', this.currentToken)
      );
      
      const snapshot = await getDocs(q);
      
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'fcmTokens', docSnap.id));
      }
      
      this.currentToken = null;
      console.log('✅ Token supprimé');
      return true;
    } catch (error) {
      console.error('Erreur suppression token:', error);
      throw error;
    }
  }

  /**
   * Écouter les messages (wrapper pour onMessage)
   */
  onMessage(callback) {
    if (!this.messaging) {
      console.warn('⚠️ Messaging non initialisé');
      return () => {};
    }

    try {
      return onMessage(this.messaging, (payload) => {
        this.handleForegroundMessage(payload);
        callback(payload);
      });
    } catch (error) {
      console.error('Erreur onMessage:', error);
      return () => {};
    }
  }

  /**
   * Gérer les messages en premier plan
   */
  handleForegroundMessage(payload) {
    const { notification, data } = payload;
    
    // Créer une notification système si le document est caché
    if (notification && document.hidden) {
      const notificationTitle = notification.title || 'GestiHôtel';
      const notificationOptions = {
        body: notification.body,
        icon: notification.icon || '/pwa-192x192.png',
        badge: '/favicon.ico',
        tag: data?.interventionId || 'default',
        data: data,
        requireInteraction: data?.priority === 'high'
      };

      new Notification(notificationTitle, notificationOptions);
    }
  }

  /**
   * Envoyer une notification (via Firestore, puis Cloud Function)
   */
  async sendNotification(userId, title, body, data = {}) {
    const notification = {
      type: data.type || 'system',
      title,
      message: body,
      priority: 'normal',
      data
    };

    return await this.createNotification(userId, notification);
  }

  /**
   * Créer une notification dans Firestore
   */
  async createNotification(userId, notificationData) {
    try {
      const notification = {
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'system',
        priority: notificationData.priority || 'normal',
        read: false,
        createdAt: serverTimestamp(),
        actionUrl: notificationData.actionUrl,
        relatedId: notificationData.relatedId,
        icon: notificationData.icon,
        data: notificationData.data || {}
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erreur création notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les informations du device
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Vérifier si les notifications sont supportées
   */
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Obtenir le statut de permission actuel
   */
  getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }
}

// Export singleton
export const notificationService = new NotificationService();
export default notificationService;