import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  getDocs 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook Firestore optimisé avec gestion du cache et des re-renders
 */
const useFirestore = (collectionName, options = {}) => {
  const {
    filters = [],
    orderByFields = [],
    queryLimit = null,
    realtime = false,
    transform = (item) => item
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mémoïser les filtres pour éviter les re-renders inutiles
  const memoizedFilters = useMemo(() => {
    return filters.map(f => ({
      field: f[0],
      operator: f[1],
      value: f[2]
    }));
  }, [JSON.stringify(filters)]);

  // Mémoïser les ordres pour éviter les re-renders inutiles
  const memoizedOrderBy = useMemo(() => {
    return orderByFields.map(o => ({
      field: o[0],
      direction: o[1]
    }));
  }, [JSON.stringify(orderByFields)]);

  useEffect(() => {
    if (!collectionName) {
      setError('Nom de collection requis');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Construire la requête
      let q = collection(db, collectionName);

      // Appliquer les filtres
      memoizedFilters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      // Appliquer les tris
      memoizedOrderBy.forEach(order => {
        q = query(q, orderBy(order.field, order.direction));
      });

      // Appliquer la limite
      if (queryLimit) {
        q = query(q, limit(queryLimit));
      }

      if (realtime) {
        // Écoute en temps réel
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map(doc => 
              transform({ id: doc.id, ...doc.data() })
            );
            setData(items);
            setLoading(false);
          },
          (err) => {
            console.error(`Erreur Firestore [${collectionName}]:`, err);
            setError(err.message);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } else {
        // Chargement unique
        getDocs(q)
          .then(snapshot => {
            const items = snapshot.docs.map(doc => 
              transform({ id: doc.id, ...doc.data() })
            );
            setData(items);
            setLoading(false);
          })
          .catch(err => {
            console.error(`Erreur Firestore [${collectionName}]:`, err);
            setError(err.message);
            setLoading(false);
          });
      }
    } catch (err) {
      console.error(`Erreur configuration requête [${collectionName}]:`, err);
      setError(err.message);
      setLoading(false);
    }
  }, [collectionName, memoizedFilters, memoizedOrderBy, queryLimit, realtime]);

  return { data, loading, error };
};

// ==========================================
// HOOKS SPÉCIALISÉS (basés sur useFirestore)
// ==========================================

/**
 * Hook pour les interventions
 */
export const useInterventions = (user) => {
  const filters = useMemo(() => {
    if (user?.role === 'technician') {
      return [['assignedTo', '==', user.uid]];
    }
    return [];
  }, [user?.role, user?.uid]);

  const { data, loading, error } = useFirestore('interventions', {
    filters,
    orderByFields: [['createdAt', 'desc']],
    realtime: true,
    transform: (item) => ({
      ...item,
      createdAt: item.createdAt?.toDate?.() || new Date(),
      updatedAt: item.updatedAt?.toDate?.() || null
    })
  });

  const stats = useMemo(() => ({
    total: data.length,
    todo: data.filter(i => i.status === 'todo').length,
    inProgress: data.filter(i => i.status === 'inprogress').length,
    completed: data.filter(i => i.status === 'completed').length,
    cancelled: data.filter(i => i.status === 'cancelled').length
  }), [data]);

  return {
    interventions: data,
    loading,
    error,
    stats
  };
};

/**
 * Hook pour les utilisateurs
 */
export const useUsers = (roleFilter = null) => {
  const filters = useMemo(() => {
    return roleFilter ? [['role', '==', roleFilter]] : [];
  }, [roleFilter]);

  return useFirestore('users', {
    filters,
    orderByFields: [['createdAt', 'desc']],
    realtime: true,
    transform: (user) => ({
      ...user,
      createdAt: user.createdAt?.toDate?.() || new Date(),
      lastLogin: user.lastLogin?.toDate?.() || null
    })
  });
};

/**
 * Hook pour les chambres bloquées
 */
export const useBlockedRooms = () => {
  return useFirestore('blockedRooms', {
    filters: [['blocked', '==', true]],
    orderByFields: [['blockedAt', 'desc']],
    realtime: true,
    transform: (room) => ({
      ...room,
      blockedAt: room.blockedAt?.toDate?.() || new Date(),
      unblockedAt: room.unblockedAt?.toDate?.() || null
    })
  });
};

/**
 * Hook pour les options dropdown
 */
export const useDropdownOptions = (category) => {
  const filters = useMemo(() => {
    return category ? [['category', '==', category]] : [];
  }, [category]);

  return useFirestore('dropdownOptions', {
    filters,
    orderByFields: [['name', 'asc']],
    realtime: true
  });
};

/**
 * Hook pour les données admin
 */
export const useAdminData = (type) => {
  const filters = useMemo(() => {
    return type ? [['type', '==', type]] : [];
  }, [type]);

  return useFirestore('adminData', {
    filters,
    orderByFields: [['name', 'asc']],
    realtime: true
  });
};

/**
 * Hook pour les notifications
 */
export const useNotifications = (userId) => {
  const filters = useMemo(() => {
    return userId ? [['userId', '==', userId]] : [];
  }, [userId]);

  return useFirestore('notifications', {
    filters,
    orderByFields: [['createdAt', 'desc']],
    queryLimit: 50,
    realtime: true,
    transform: (notif) => ({
      ...notif,
      createdAt: notif.createdAt?.toDate?.() || new Date()
    })
  });
};

// Export par défaut
export default useFirestore;