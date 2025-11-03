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
      
      // Écouter les messages en premier plan
      onMessage(this.messaging, (payload) => {
        this.handleForegroundMessage(payload);
      });
    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
    }
  }

  /**
   * Demander la permission et obtenir le token
   */
  async requestPermission(userId) {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: VAPID_KEY
        });
        
        if (token) {
          this.currentToken = token;
          await this.saveTokenToFirestore(userId, token);
          return { success: true, token };
        }
      } else {
        return { success: false, error: 'Permission refusée' };
      }
    } catch (error) {
      console.error('Erreur demande permission:', error);
      return { success: false, error: error.message };
    }
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
      } else {
        // Mettre à jour lastUsed
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, 'fcmTokens', docId), {
          lastUsed: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Erreur sauvegarde token:', error);
    }
  }

  /**
   * Supprimer le token FCM
   */
  async removeToken(userId) {
    try {
      if (!this.currentToken) return;
      
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
    } catch (error) {
      console.error('Erreur suppression token:', error);
    }
  }

  /**
   * Gérer les messages en premier plan
   */
  handleForegroundMessage(payload) {
    const { notification, data } = payload;
    
    // Créer une notification système
    if (notification) {
      const notificationTitle = notification.title || 'GestiHôtel';
      const notificationOptions = {
        body: notification.body,
        icon: notification.icon || '/pwa-192x192.png',
        badge: '/favicon.ico',
        tag: data?.interventionId || 'default',
        data: data,
        requireInteraction: data?.priority === 'high',
        actions: this.getNotificationActions(data?.type)
      };

      // Vérifier si le document est visible
      if (document.hidden) {
        new Notification(notificationTitle, notificationOptions);
      } else {
        // Afficher un toast dans l'app
        this.showInAppNotification({
          title: notificationTitle,
          message: notification.body,
          type: this.getNotificationType(data?.type),
          data
        });
      }
    }
    
    // Sauvegarder dans Firestore
    if (data?.userId) {
      this.saveNotificationToFirestore(data.userId, {
        title: notification?.title,
        message: notification?.body,
        type: data.type || 'system',
        relatedId: data.interventionId,
        data
      });
    }
  }

  /**
   * Obtenir les actions de notification selon le type
   */
  getNotificationActions(type) {
    const actions = {
      intervention_assigned: [
        { action: 'view', title: 'Voir', icon: '/icons/view.png' },
        { action: 'accept', title: 'Accepter', icon: '/icons/check.png' }
      ],
      message_received: [
        { action: 'reply', title: 'Répondre', icon: '/icons/reply.png' },
        { action: 'view', title: 'Voir', icon: '/icons/view.png' }
      ],
      due_date_approaching: [
        { action: 'view', title: 'Voir', icon: '/icons/view.png' },
        { action: 'dismiss', title: 'Ignorer', icon: '/icons/dismiss.png' }
      ]
    };
    
    return actions[type] || [];
  }

  /**
   * Convertir le type de notification pour l'UI
   */
  getNotificationType(type) {
    const typeMap = {
      intervention_assigned: 'info',
      intervention_completed: 'success',
      message_received: 'info',
      due_date_approaching: 'warning',
      system: 'info'
    };
    
    return typeMap[type] || 'info';
  }

  /**
   * Afficher une notification in-app (via le système de Toast)
   */
  showInAppNotification(notification) {
    // Cette fonction sera appelée par le composant qui utilise ce service
    // Elle déclenchera l'affichage d'un toast
    if (window.showToast) {
      window.showToast({
        type: notification.type,
        message: notification.title,
        description: notification.message,
        action: notification.data?.actionUrl ? {
          label: 'Voir',
          onClick: () => {
            window.location.href = notification.data.actionUrl;
          }
        } : undefined
      });
    }
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
   * Sauvegarder une notification reçue
   */
  async saveNotificationToFirestore(userId, notificationData) {
    return await this.createNotification(userId, notificationData);
  }

  /**
   * Obtenir les notifications d'un utilisateur
   */
  async getUserNotifications(userId, options = {}) {
    const {
      limitCount = 50,
      unreadOnly = false
    } = options;

    try {
      let q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (unreadOnly) {
        q = query(q, where('read', '==', false));
      }

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      return notifications;
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(docSnap => {
        batch.update(doc(db, 'notifications', docSnap.id), {
          read: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();
      return { success: true, count: snapshot.docs.length };
    } catch (error) {
      console.error('Erreur marquage notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer toutes les notifications d'un utilisateur
   */
  async deleteAllNotifications(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(docSnap => {
        batch.delete(doc(db, 'notifications', docSnap.id));
      });

      await batch.commit();
      return { success: true, count: snapshot.docs.length };
    } catch (error) {
      console.error('Erreur suppression notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer une notification à un utilisateur spécifique
   * (Nécessite Cloud Function côté serveur pour l'envoi push réel)
   */
  async sendNotification(userId, notification) {
    try {
      // 1. Créer la notification dans Firestore
      await this.createNotification(userId, notification);

      // 2. Si l'utilisateur a des préférences push activées, 
      //    déclencher une Cloud Function pour l'envoi push
      // (La Cloud Function lira la notification et utilisera l'API FCM)
      
      return { success: true };
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer une notification à plusieurs utilisateurs
   */
  async sendBulkNotifications(userIds, notification) {
    try {
      const promises = userIds.map(userId => 
        this.sendNotification(userId, notification)
      );
      
      await Promise.all(promises);
      return { success: true, count: userIds.length };
    } catch (error) {
      console.error('Erreur envoi notifications groupées:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notifier l'équipe d'une nouvelle intervention
   */
  async notifyNewIntervention(intervention, assignedUsers = []) {
    const notification = {
      type: 'intervention_assigned',
      title: 'Nouvelle intervention',
      message: `${intervention.missionSummary} - ${intervention.rooms?.join(', ')}`,
      priority: intervention.priority === 'urgent' ? 'high' : 'normal',
      relatedId: intervention.id,
      actionUrl: `/interventions/${intervention.id}`,
      icon: '🔧',
      data: {
        interventionId: intervention.id,
        priority: intervention.priority
      }
    };

    if (assignedUsers.length > 0) {
      return await this.sendBulkNotifications(assignedUsers, notification);
    }
  }

  /**
   * Notifier de l'approche d'une deadline
   */
  async notifyDueDateApproaching(intervention, userId) {
    const notification = {
      type: 'due_date_approaching',
      title: '⏰ Échéance proche',
      message: `L'intervention "${intervention.missionSummary}" arrive à échéance`,
      priority: 'high',
      relatedId: intervention.id,
      actionUrl: `/interventions/${intervention.id}`,
      data: {
        interventionId: intervention.id,
        dueDate: intervention.dueDate
      }
    };

    return await this.sendNotification(userId, notification);
  }

  /**
   * Notifier d'un nouveau message
   */
  async notifyNewMessage(interventionId, message, recipientIds) {
    const notification = {
      type: 'message_received',
      title: `💬 ${message.senderName}`,
      message: message.text.substring(0, 100),
      priority: 'normal',
      relatedId: interventionId,
      actionUrl: `/interventions/${interventionId}`,
      data: {
        interventionId,
        messageId: message.id,
        senderId: message.senderId
      }
    };

    return await this.sendBulkNotifications(recipientIds, notification);
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