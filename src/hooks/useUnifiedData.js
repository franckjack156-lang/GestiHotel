import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from '../utils/toast'; // ✨ NOUVEAU

export const useUnifiedData = (user) => {
  const [data, setData] = useState({
    roomTypes: [],
    locations: [],
    missionTypes: [],
    interventionTypes: [],
    priorities: [],
    departments: [],
    creators: [],
    technicians: [],
    suppliers: [],
    equipment: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const CATEGORIES = {
    DROPDOWNS: [
      'roomTypes', 'locations', 'missionTypes', 'interventionTypes',
      'priorities', 'departments', 'creators'
    ],
    ADMIN_DATA: ['technicians', 'suppliers', 'equipment']
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribes = [];

    // Dropdowns
    CATEGORIES.DROPDOWNS.forEach(category => {
      const q = query(
        collection(db, 'dropdownOptions'),
        where('category', '==', category),
        orderBy('name', 'asc')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setData(prev => ({ ...prev, [category]: items }));
      });

      unsubscribes.push(unsub);
    });

    // Admin Data
    CATEGORIES.ADMIN_DATA.forEach(category => {
      const q = query(
        collection(db, 'adminData'),
        where('category', '==', category),
        orderBy('name', 'asc')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setData(prev => ({ ...prev, [category]: items }));
      });

      unsubscribes.push(unsub);
    });

    setLoading(false);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user]);

  const addItem = async (category, itemData) => {
    try {
      const isDropdown = CATEGORIES.DROPDOWNS.includes(category);
      const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';

      const newItem = {
        ...itemData,
        category,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email
      };

      await addDoc(collection(db, collectionName), newItem);
      
      toast.success('Élément ajouté avec succès');
      return { success: true };
    } catch (error) {
      console.error('Erreur ajout:', error);
      toast.error('Erreur lors de l\'ajout', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateItem = async (category, itemId, updates) => {
    try {
      const isDropdown = CATEGORIES.DROPDOWNS.includes(category);
      const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';

      await updateDoc(doc(db, collectionName, itemId), {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });

      toast.success('Élément mis à jour');
      return { success: true };
    } catch (error) {
      console.error('Erreur update:', error);
      toast.error('Erreur lors de la mise à jour', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const deleteItem = async (category, itemId) => {
    try {
      const isDropdown = CATEGORIES.DROPDOWNS.includes(category);
      const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';

      await deleteDoc(doc(db, collectionName, itemId));
      
      toast.success('Élément supprimé');
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const toggleActive = async (category, itemId, currentState) => {
    try {
      const isDropdown = CATEGORIES.DROPDOWNS.includes(category);
      const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';

      await updateDoc(doc(db, collectionName, itemId), {
        active: !currentState,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });

      toast.success(!currentState ? 'Activé' : 'Désactivé');
      return { success: true };
    } catch (error) {
      console.error('Erreur toggle:', error);
      toast.error('Erreur lors du changement', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const getActiveItems = (category) => {
    return data[category]?.filter(item => item.active !== false) || [];
  };

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    toggleActive,
    getActiveItems
  };
};