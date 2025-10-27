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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../Config/firebase';
import { useToast } from '../contexts/ToastContext';

export const useDynamicDropdowns = (user) => {
  const [dropdowns, setDropdowns] = useState({
    roomTypes: [],
    locations: [],
    missionTypes: [],
    creators: [],
    interventionTypes: [],
    priorities: [],
    departments: []
  });
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
  if (!user) {
    setLoading(false);
    return;
  }

  const categories = [
    'roomTypes', 'locations', 'missionTypes', 
    'creators', 'interventionTypes', 'priorities', 'departments'
  ];

  const unsubscribes = [];

  categories.forEach(category => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'dropdownOptions'), 
        where('category', '==', category),
        where('active', '==', true), // ✅ Filtre direct dans Firestore
        orderBy('name', 'asc')
      ),
      (snapshot) => {
        const categoryData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          // ✅ Assurer que 'active' existe
          active: doc.data().active !== false 
        }));
        
        setDropdowns(prev => ({ ...prev, [category]: categoryData }));
        
        if (category === categories[0]) {
          setLoading(false);
        }
      },
      (error) => {
        console.error(`❌ Erreur ${category}:`, error);
        if (category === categories[0]) {
          setLoading(false);
        }
      }
    );

    unsubscribes.push(unsubscribe);
  });

  return () => unsubscribes.forEach(unsub => unsub());
}, [user, addToast]);

  const addDropdownItem = async (category, itemData) => {
  if (!user) {
    addToast({ type: 'error', title: 'Non authentifié', message: 'Vous devez être connecté' });
    return { success: false, error: 'Non authentifié' };
  }

  try {
    if (!itemData.name || !itemData.name.trim()) {
      addToast({ type: 'error', title: 'Données invalides', message: 'Le nom est obligatoire' });
      return { success: false, error: 'Nom obligatoire' };
    }

    // ✅ VÉRIFICATION DES DOUBLONS
    const existingQuery = query(
      collection(db, 'dropdownOptions'),
      where('category', '==', category),
      where('name', '==', itemData.name.trim())
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      addToast({
        type: 'warning',
        title: 'Doublon détecté',
        message: `"${itemData.name}" existe déjà dans cette catégorie`
      });
      return { success: false, error: 'Élément déjà existant' };
    }

    // Ajouter l'élément
    const docRef = await addDoc(collection(db, 'dropdownOptions'), {
      name: itemData.name.trim(),
      value: itemData.value || itemData.name.toLowerCase().replace(/\s+/g, '-'),
      label: itemData.name.trim(),
      description: itemData.description || '',
      category: category,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      createdByName: user.name || user.email,
      active: true
    });
    
    addToast({ type: 'success', title: 'Ajout réussi', message: `${itemData.name} ajouté` });
    return { success: true, id: docRef.id };
    
  } catch (error) {
    console.error(`❌ Erreur ajout ${category}:`, error);
    addToast({ type: 'error', title: 'Erreur', message: error.message });
    return { success: false, error: error.message };
  }
};

  const updateDropdownItem = async (itemId, updates) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: user.name || user.email
      };

      // Nettoyer les champs undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(doc(db, 'dropdownOptions', itemId), updateData);
      
      addToast({
        type: 'success',
        title: 'Modification réussie',
        message: 'Élément mis à jour avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur mise à jour élément:', error);
      
      let errorMessage = 'Erreur lors de la mise à jour';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission refusée';
      } else if (error.code === 'not-found') {
        errorMessage = 'Élément non trouvé';
      }
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });
      
      return { success: false, error: error.message };
    }
  };

  const deleteDropdownItem = async (itemId) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    try {
      await deleteDoc(doc(db, 'dropdownOptions', itemId));
      
      addToast({
        type: 'success',
        title: 'Suppression réussie',
        message: 'Élément supprimé avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression élément:', error);
      
      let errorMessage = 'Erreur lors de la suppression';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission refusée';
      }
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });
      
      return { success: false, error: error.message };
    }
  };

  const toggleDropdownItemActive = async (itemId, currentActive) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    try {
      await updateDoc(doc(db, 'dropdownOptions', itemId), {
        active: !currentActive,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: user.name || user.email
      });
      
      addToast({
        type: 'success',
        title: 'Statut modifié',
        message: `Élément ${!currentActive ? 'activé' : 'désactivé'} avec succès`
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur changement statut élément:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du changement de statut'
      });
      
      return { success: false, error: error.message };
    }
  };

  return {
    dropdowns,
    loading,
    addDropdownItem,
    updateDropdownItem,
    deleteDropdownItem,
    toggleDropdownItemActive
  };
};