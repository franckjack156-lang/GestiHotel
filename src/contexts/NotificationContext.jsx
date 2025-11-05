// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { getDb } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Bell } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Écouter les notifications en temps réel
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const setupNotifications = async () => {
      const db = await getDb();
      const notifQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const notifs = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        notifs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        });

        if (!data.read) {
          unread++;
        }
      });

      setNotifications(notifs);
      setUnreadCount(unread);
      setLoading(false);

      // 🔔 Notification sonore si nouvelle notification
      if (unread > unreadCount && unreadCount > 0) {
        playNotificationSound();
      }
    });

      return unsubscribe;
    };

    const unsubscribePromise = setupNotifications();

    return () => {
      unsubscribePromise.then(unsub => {
        if (unsub) unsub();
      });
    };
  }, [user?.uid]);

  // ✅ Créer une notification
  const createNotification = async (notificationData) => {
    try {
      const db = await getDb();
      const notification = {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erreur création notification:', error);
      return { success: false, error: error.message };
    }
  };

  // ✅ Marquer comme lue
  const markAsRead = async (notificationId) => {
    try {
      const db = await getDb();
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      return { success: false, error: error.message };
    }
  };

  // ✅ Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      const db = await getDb();
      const unreadNotifs = notifications.filter(n => !n.read);

      await Promise.all(
        unreadNotifs.map(notif =>
          updateDoc(doc(db, 'notifications', notif.id), {
            read: true,
            readAt: serverTimestamp()
          })
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
      return { success: false, error: error.message };
    }
  };

  // ✅ Son de notification
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        console.log('Son notification bloqué par le navigateur');
      });
    } catch (error) {
      console.error('Erreur lecture son:', error);
    }
  };

  // ✅ Obtenir l'icône selon le type
  const getNotificationIcon = (type) => {
    const icons = {
      intervention_new: '📋',
      intervention_assigned: '👷',
      intervention_completed: '✅',
      intervention_updated: '🔄',
      message_new: '💬',
      room_blocked: '🚫',
      user_mention: '👤',
      system: '⚙️'
    };
    return icons[type] || '🔔';
  };

  // ✅ Obtenir la couleur selon le type
  const getNotificationColor = (type) => {
    const colors = {
      intervention_new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      intervention_assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      intervention_completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      intervention_updated: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      message_new: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      room_blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      user_mention: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      system: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return colors[type] || colors.system;
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    isOpen,
    setIsOpen,
    createNotification,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    getNotificationColor
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};