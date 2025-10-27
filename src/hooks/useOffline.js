import { useEffect, useState } from 'react';
import { useNetworkState } from 'react-use';

export const useOfflineSync = () => {
  const networkState = useNetworkState();
  const [pendingSync, setPendingSync] = useState([]);

  useEffect(() => {
    if (networkState.online) {
      // Synchroniser automatiquement
      syncPendingActions();
    }
  }, [networkState.online]);

  return { isOnline: networkState.online, pendingSync };
};