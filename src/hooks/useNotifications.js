// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/Toast';

/**
 * Hook pour gérer les notifications push (FCM)
 * ✅ RENOMMÉ en useNotificationsPush pour éviter conflit avec NotificationContext
 */
export const useNotificationsPush = () => {
  const { user } = useAuth();
  const toastHook = useToast();
  
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [token, setToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ CORRECTION : Ajouter isSupported
  const [isSupported] = useState(() => {
    return 'Notification' in window && 'serviceWorker' in navigator;
  });

  /**
   * Initialiser les notifications pour l'utilisateur connecté
   */
  const initNotifications = useCallback(async () => {
    if (!user || isInitializing || !isSupported) return;

    setIsInitializing(true);
    setError(null);

    try {
      // Si permission déjà accordée, récupérer le token
      if (permission === 'granted') {
        const fcmToken = await notificationService.getToken();
        
        if (fcmToken) {
          setToken(fcmToken);
          await notificationService.saveTokenToUser(user.uid, fcmToken);
          
          console.log('✅ Notifications initialisées');
        }
      }

      // Écouter les messages en temps réel
      const unsubscribe = notificationService.onMessage((payload) => {
        // Afficher un toast dans l'app
        if (toastHook?.addToast) {
          toastHook.addToast({
            type: 'info',
            message: payload.notification?.title || 'Nouvelle notification',
            description: payload.notification?.body,
            duration: 8000,
            action: payload.data?.interventionId ? {
              label: 'Voir',
              onClick: () => {
                window.location.href = `/interventions/${payload.data.interventionId}`;
              }
            } : null
          });
        }
      });

      return unsubscribe;
    } catch (err) {
      console.error('Erreur initialisation notifications:', err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  }, [user, permission, toastHook, isInitializing, isSupported]);

  /**
   * Demander la permission de notifications
   */
  const requestPermission = useCallback(async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      return false;
    }

    if (!isSupported) {
      setError('Notifications non supportées par ce navigateur');
      return false;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const fcmToken = await notificationService.requestPermission();
      
      if (fcmToken) {
        setToken(fcmToken);
        setPermission('granted');
        await notificationService.saveTokenToUser(user.uid, fcmToken);
        
        if (toastHook?.success) {
          toastHook.success('Notifications activées', {
            description: 'Vous recevrez désormais les alertes importantes'
          });
        }

        // Initialiser l'écoute des messages
        await initNotifications();
        
        return true;
      } else {
        setPermission(Notification.permission);
        
        if (Notification.permission === 'denied') {
          if (toastHook?.warning) {
            toastHook.warning('Notifications bloquées', {
              description: 'Vous pouvez les réactiver dans les paramètres du navigateur'
            });
          }
        }
        
        return false;
      }
    } catch (err) {
      console.error('Erreur demande permission:', err);
      setError(err.message);
      
      if (toastHook?.error) {
        toastHook.error('Erreur', {
          description: 'Impossible d\'activer les notifications'
        });
      }
      
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [user, toastHook, initNotifications, isSupported]);

  /**
   * Désactiver les notifications
   */
  const disableNotifications = useCallback(async () => {
    if (!user) return;

    try {
      await notificationService.removeToken(user.uid);
      setToken(null);
      
      if (toastHook?.info) {
        toastHook.info('Notifications désactivées', {
          description: 'Vous ne recevrez plus d\'alertes'
        });
      }
      
      return true;
    } catch (err) {
      console.error('Erreur désactivation notifications:', err);
      setError(err.message);
      return false;
    }
  }, [user, toastHook]);

  /**
   * Envoyer une notification de test
   */
  const sendTestNotification = useCallback(async () => {
    if (!user) return;

    try {
      await notificationService.sendNotification(
        user.uid,
        '🧪 Notification test',
        'Si vous voyez ceci, les notifications fonctionnent parfaitement !',
        { priority: 'high' }
      );
      
      if (toastHook?.success) {
        toastHook.success('Notification test envoyée');
      }
      
      return true;
    } catch (err) {
      console.error('Erreur envoi notification test:', err);
      setError(err.message);
      
      if (toastHook?.error) {
        toastHook.error('Erreur envoi notification test');
      }
      
      return false;
    }
  }, [user, toastHook]);

  /**
   * Initialiser automatiquement au montage
   */
  useEffect(() => {
    if (user && permission === 'granted') {
      initNotifications();
    }
  }, [user, permission, initNotifications]);

  return {
    permission,
    token,
    isInitializing,
    error,
    isSupported, // ✅ AJOUTÉ
    requestPermission,
    disableNotifications,
    sendTestNotification,
    initNotifications
  };
};

// ✅ Export par défaut pour compatibilité
export default useNotificationsPush;