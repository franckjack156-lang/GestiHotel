// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/Toast';

/**
 * Hook pour gérer les notifications push
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [token, setToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialiser les notifications pour l'utilisateur connecté
   */
  const initNotifications = useCallback(async () => {
    if (!user || isInitializing) return;

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
        addToast({
          type: 'info',
          message: payload.notification.title,
          description: payload.notification.body,
          duration: 8000,
          action: payload.data?.interventionId ? {
            label: 'Voir',
            onClick: () => {
              window.location.href = `/interventions/${payload.data.interventionId}`;
            }
          } : null
        });
      });

      return unsubscribe;
    } catch (err) {
      console.error('Erreur initialisation notifications:', err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  }, [user, permission, addToast, isInitializing]);

  /**
   * Demander la permission de notifications
   */
  const requestPermission = useCallback(async () => {
    if (!user) {
      setError('Utilisateur non connecté');
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
        
        addToast({
          type: 'success',
          message: 'Notifications activées',
          description: 'Vous recevrez désormais les alertes importantes'
        });

        // Initialiser l'écoute des messages
        await initNotifications();
        
        return true;
      } else {
        setPermission(Notification.permission);
        
        if (Notification.permission === 'denied') {
          addToast({
            type: 'warning',
            message: 'Notifications bloquées',
            description: 'Vous pouvez les réactiver dans les paramètres du navigateur'
          });
        }
        
        return false;
      }
    } catch (err) {
      console.error('Erreur demande permission:', err);
      setError(err.message);
      
      addToast({
        type: 'error',
        message: 'Erreur',
        description: 'Impossible d\'activer les notifications'
      });
      
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [user, addToast, initNotifications]);

  /**
   * Désactiver les notifications
   */
  const disableNotifications = useCallback(async () => {
    if (!user) return;

    try {
      await notificationService.removeToken(user.uid);
      setToken(null);
      
      addToast({
        type: 'info',
        message: 'Notifications désactivées',
        description: 'Vous ne recevrez plus d\'alertes'
      });
      
      return true;
    } catch (err) {
      console.error('Erreur désactivation notifications:', err);
      setError(err.message);
      return false;
    }
  }, [user, addToast]);

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
        { type: 'test' }
      );

      addToast({
        type: 'success',
        message: 'Notification test envoyée',
        description: 'Vous devriez la recevoir dans quelques secondes'
      });

      return true;
    } catch (err) {
      console.error('Erreur envoi notification test:', err);
      
      addToast({
        type: 'error',
        message: 'Erreur',
        description: 'Impossible d\'envoyer la notification test'
      });
      
      return false;
    }
  }, [user, addToast]);

  // Initialiser automatiquement si permission déjà accordée
  useEffect(() => {
    if (user && permission === 'granted' && !token) {
      initNotifications();
    }
  }, [user, permission, token, initNotifications]);

  // Nettoyer à la déconnexion
  useEffect(() => {
    return () => {
      if (!user && token) {
        // L'utilisateur s'est déconnecté
        setToken(null);
        setPermission('default');
      }
    };
  }, [user, token]);

  return {
    // États
    permission,
    token,
    isEnabled: permission === 'granted' && !!token,
    isInitializing,
    error,
    
    // Méthodes
    requestPermission,
    disableNotifications,
    sendTestNotification,
    
    // Informations
    isSupported: 'Notification' in window,
    canRequest: permission === 'default'
  };
};

export default useNotifications;