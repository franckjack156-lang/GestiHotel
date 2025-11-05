import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/index';

export const useSync = (user, interventions, addToast) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const syncData = useCallback(async () => {
    if (!user || !isOnline) {
      setSyncError('Hors ligne - synchronisation impossible');
      return false;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const result = await syncService.syncAllData(user.uid, interventions);

      setLastSync(new Date());
      addToast?.({
        type: 'success',
        title: 'Synchronisation réussie',
        message: 'Données synchronisées avec le cloud'
      });

      return true;
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      setSyncError(error.message);
      addToast?.({
        type: 'error',
        title: 'Erreur synchronisation',
        message: 'Impossible de synchroniser les données'
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, isOnline, interventions, addToast]);

  const autoSync = useCallback(async () => {
    if (!user || !isOnline || isSyncing) return;

    try {
      await syncData();
    } catch (error) {
      console.error('Erreur synchronisation automatique:', error);
    }
  }, [user, isOnline, isSyncing, syncData]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Synchroniser automatiquement quand on revient en ligne
      if (user) {
        autoSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Synchroniser au chargement si en ligne
    if (user && isOnline) {
      autoSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, isOnline, autoSync]);

  const forceSync = async () => {
    return await syncData();
  };

  return {
    isOnline,
    isSyncing,
    lastSync,
    syncError,
    syncData: forceSync
  };
};