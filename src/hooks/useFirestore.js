// src/hooks/useFirestore.js - HOOK GÉNÉRIQUE RÉUTILISABLE
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook générique pour gérer n'importe quelle collection Firestore
 * 
 * @param {string} collectionName - Nom de la collection
 * @param {object} options - Options de requête
 * @param {array} options.filters - Filtres where (ex: [['status', '==', 'active']])
 * @param {array} options.orderBy - Tri (ex: [['createdAt', 'desc']])
 * @param {number} options.limit - Limite de résultats
 * @param {boolean} options.realtime - Activer les updates en temps réel
 * @param {function} options.transform - Fonction de transformation des données
 */
export const useFirestore = (collectionName, options = {}) => {
  const {
    filters = [],
    orderByFields = [],
    limit: queryLimit,
    realtime = true,
    transform = (data) => data
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collectionName) {
      setLoading(false);
      return;
    }

    try {
      // Construire la requête
      let q = collection(db, collectionName);

      // Appliquer les filtres
      filters.forEach(([field, operator, value]) => {
        q = query(q, where(field, operator, value));
      });

      // Appliquer le tri
      orderByFields.forEach(([field, direction]) => {
        q = query(q, orderBy(field, direction));
      });

      // Appliquer la limite
      if (queryLimit) {
        q = query(q, limit(queryLimit));
      }

      // Écouter les changements en temps réel ou charger une fois
      if (realtime) {
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
        getDocs(q).then(snapshot => {
          const items = snapshot.docs.map(doc => 
            transform({ id: doc.id, ...doc.data() })
          );
          setData(items);
          setLoading(false);
        }).catch(err => {
          setError(err.message);
          setLoading(false);
        });
      }
    } catch (err) {
      console.error(`Erreur configuration requête [${collectionName}]:`, err);
      setError(err.message);
      setLoading(false);
    }
  }, [collectionName, JSON.stringify(filters), JSON.stringify(orderByFields), queryLimit, realtime]);

  return { data, loading, error };
};

// ==========================================
// HOOKS SPÉCIALISÉS (basés sur useFirestore)
// ==========================================

/**
 * Hook pour les interventions
 */
export const useInterventions = (user) => {
  const filters = user?.role === 'technician' 
    ? [['assignedTo', '==', user.uid]]
    : [];

  const { data, loading, error } = useFirestore('interventions', {
    filters,
    orderByFields: [['createdAt', 'desc']],
    realtime: true,
    transform: (item) => ({
      ...item,
      createdAt: item.createdAt?.toDate?.() || new Date()
    })
  });

  return {
    interventions: data,
    loading,
    error,
    stats: {
      total: data.length,
      todo: data.filter(i => i.status === 'todo').length,
      inProgress: data.filter(i => i.status === 'inprogress').length,
      completed: data.filter(i => i.status === 'completed').length
    }
  };
};

/**
 * Hook pour les utilisateurs
 */
export const useUsers = (roleFilter = null) => {
  const filters = roleFilter ? [['role', '==', roleFilter]] : [];

  return useFirestore('users', {
    filters,
    orderByFields: [['createdAt', 'desc']],
    realtime: true,
    transform: (user) => ({
      ...user,
      createdAt: user.createdAt?.toDate?.() || new Date()
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
    realtime: true
  });
};

/**
 * Hook pour les options dropdown/admin
 */
export const useDropdownOptions = (category) => {
  return useFirestore('dropdownOptions', {
    filters: [['category', '==', category]],
    orderByFields: [['name', 'asc']],
    realtime: true
  });
};

export const useAdminData = (type) => {
  return useFirestore('adminData', {
    filters: [['type', '==', type]],
    orderByFields: [['name', 'asc']],
    realtime: true
  });
};

// Export par défaut
export default useFirestore;