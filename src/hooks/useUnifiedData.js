// src/hooks/useUnifiedData.js
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
import { useToast } from '../contexts/ToastContext';

/**
 * Hook unifié pour gérer TOUTES les données de référence
 * - Listes déroulantes (types, priorités, localisations...)
 * - Données admin (techniciens, fournisseurs, équipements)
 */
export const useUnifiedData = (user) => {
  const [data, setData] = useState({
    // Listes déroulantes simples
    roomTypes: [],
    locations: [],
    missionTypes: [],
    interventionTypes: [],
    priorities: [],
    departments: [],
    creators: [],
    
    // Données admin complexes
    technicians: [],
    suppliers: [],
    equipment: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  // Configuration des catégories
  const CATEGORIES = {
    // Listes déroulantes -> Collection 'dropdownOptions'
    DROPDOWNS: [
      'roomTypes',
      'locations',
      'missionTypes', 
      'interventionTypes',
      'priorities',
      'departments',
      'creators'
    ],
    
    // Données admin -> Collection 'adminData'
    ADMIN_DATA: [
      'technicians',
      'suppliers',
      'equipment'
    ]
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribers = [];
    let loadedCount = 0;
    const totalToLoad = CATEGORIES.DROPDOWNS.length + CATEGORIES.ADMIN_DATA.length;

    // ========== CHARGER LES LISTES DÉROULANTES ==========
    CATEGORIES.DROPDOWNS.forEach(category => {
      const q = query(
        collection(db, 'dropdownOptions'),
        where('category', '==', category),
        orderBy('name', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          
          setData(prev => ({ ...prev, [category]: items }));
          
          loadedCount++;
          if (loadedCount === totalToLoad) {
            setLoading(false);
          }
        },
        (err) => {
          console.error(`❌ Erreur chargement ${category}:`, err);
          setError(err.message);
          loadedCount++;
          if (loadedCount === totalToLoad) {
            setLoading(false);
          }
        }
      );

      unsubscribers.push(unsubscribe);
    });

    // ========== CHARGER LES DONNÉES ADMIN ==========
    CATEGORIES.ADMIN_DATA.forEach(category => {
      const q = query(
        collection(db, 'adminData'),
        where('type', '==', category),
        orderBy('name', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          
          setData(prev => ({ ...prev, [category]: items }));
          
          loadedCount++;
          if (loadedCount === totalToLoad) {
            setLoading(false);
          }
        },
        (err) => {
          console.error(`❌ Erreur chargement ${category}:`, err);
          setError(err.message);
          loadedCount++;
          if (loadedCount === totalToLoad) {
            setLoading(false);
          }
        }
      );

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]);

  // ========== AJOUTER UN ÉLÉMENT ==========
  const addItem = async (category, itemData) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    // Vérifier les permissions
    if (user.role !== 'superadmin' && user.role !== 'manager') {
      addToast({
        type: 'error',
        title: 'Permission refusée',
        message: 'Seuls les admins peuvent ajouter des éléments'
      });
      return { success: false, error: 'Permission refusée' };
    }

    try {
      // Validation
      if (!itemData.name || !itemData.name.trim()) {
        addToast({
          type: 'error',
          title: 'Données invalides',
          message: 'Le nom est obligatoire'
        });
        return { success: false, error: 'Nom obligatoire' };
      }

      // Déterminer la collection
      const isDropdown = CATEGORIES.DROPDOWNS.includes(category);
      const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';

      // Préparer les données
      const baseData = {
        name: itemData.name.trim(),
        active: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email
      };

      let finalData;

      if (isDropdown) {
        // Pour les listes déroulantes
        finalData = {
          ...baseData,
          category: category,
          value: itemData.value || itemData.name.toLowerCase().replace(/\s+/g, '-'),
          label: itemData.name.trim(),
          description: itemData.description || '',
          order: itemData.order || 999
        };
      } else {
        // Pour les données admin
        finalData = {
          ...baseData,
          type: category,
          ...itemData // Inclure tous les champs spécifiques (phone, email, etc.)
        };
      }

      // Vérifier les doublons pour les localisations
      if (category === 'locations') {
        const isDuplicate = await checkDuplicate(category, itemData.name.trim());
        if (isDuplicate) {
          addToast({
            type: 'warning',
            title: 'Doublon détecté',
            message: `La chambre "${itemData.name}" existe déjà`
          });
          return { success: false, error: 'Doublon' };
        }
      }

      const docRef = await addDoc(collection(db, collectionName), finalData);
      
      addToast({
        type: 'success',
        title: 'Ajout réussi',
        message: `${itemData.name} ajouté avec succès`
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error(`❌ Erreur ajout ${category}:`, error);
      
      let errorMessage = 'Erreur lors de l\'ajout';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission refusée. Seuls les admins peuvent ajouter des éléments.';
      }
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });
      
      return { success: false, error: error.message };
    }
  };

  // ========== MODIFIER UN ÉLÉMENT ==========
  const updateItem = async (category, itemId, updates) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    if (user.role !== 'superadmin' && user.role !== 'manager') {
      addToast({
        type: 'error',
        title: 'Permission refusée',
        message: 'Seuls les admins peuvent modifier des éléments'
      });
      return { success: false, error: 'Permission refusée' };
    }

    try {
      const isDropdown = CATEGORIES.DROPDOWNS.includes(category);
      const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';

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

      await updateDoc(doc(db, collectionName, itemId), updateData);
      
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

  // ========== SUPPRIMER UN ÉLÉMENT ==========
  const deleteItem = async (category, itemId) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    if (user.role !== 'superadmin') {
      addToast({
        type: 'error',
        title: 'Permission refusée',
        message: 'Seuls les Super Admins peuvent supprimer des éléments'
      });
      return { success: false, error: 'Permission refusée' };
    }

    try {
      // Vérifier si l'élément est utilisé
      const isUsed = await checkIfUsed(category, itemId);
      
      if (isUsed) {
        // Désactiver au lieu de supprimer
        const isDropdown = CATEGORIES.DROPDOWNS.includes(category);
        const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';
        
        await updateDoc(doc(db, collectionName, itemId), {
          active: false,
          deletedAt: serverTimestamp(),
          deletedBy: user.uid,
          deletedByName: user.name || user.email
        });
        
        addToast({
          type: 'warning',
          title: 'Élément désactivé',
          message: 'Élément utilisé dans des interventions, il a été désactivé au lieu d\'être supprimé'
        });
        
        return { success: true, disabled: true };
      }

      // Supprimer définitivement si non utilisé
      const isDropdown = CATEGORIES.DROPDOWNS.includes(category);
      const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';
      
      await deleteDoc(doc(db, collectionName, itemId));
      
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

  // ========== ACTIVER/DÉSACTIVER ==========
  const toggleActive = async (category, itemId, currentActive) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    if (user.role !== 'superadmin' && user.role !== 'manager') {
      addToast({
        type: 'error',
        title: 'Permission refusée',
        message: 'Seuls les admins peuvent modifier le statut'
      });
      return { success: false, error: 'Permission refusée' };
    }

    try {
      const isDropdown = CATEGORIES.DROPDOWNS.includes(category);
      const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';

      await updateDoc(doc(db, collectionName, itemId), {
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

  // ========== VÉRIFIER LES DOUBLONS ==========
  const checkDuplicate = async (category, name) => {
    try {
      const isDropdown = CATEGORIES.DROPDOWNS.includes(category);
      const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';
      
      const q = isDropdown
        ? query(
            collection(db, collectionName),
            where('category', '==', category),
            where('name', '==', name.trim())
          )
        : query(
            collection(db, collectionName),
            where('type', '==', category),
            where('name', '==', name.trim())
          );

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Erreur vérification doublon:', error);
      return false;
    }
  };

  // ========== VÉRIFIER SI UTILISÉ ==========
  const checkIfUsed = async (category, itemId) => {
    try {
      // Vérifier dans les interventions
      const interventionsQuery = query(
        collection(db, 'interventions'),
        where('active', '!=', false)
      );
      
      const snapshot = await getDocs(interventionsQuery);
      
      // Logique de vérification selon le type
      let isUsed = false;
      
      snapshot.forEach(doc => {
        const intervention = doc.data();
        
        // Vérifier selon le type de catégorie
        if (category === 'technicians' && intervention.assignedTo === itemId) {
          isUsed = true;
        } else if (category === 'locations' && intervention.location === itemId) {
          isUsed = true;
        } else if (category === 'missionTypes' && intervention.missionType === itemId) {
          isUsed = true;
        }
        // Ajouter d'autres vérifications selon besoin
      });
      
      return isUsed;
    } catch (error) {
      console.error('Erreur vérification utilisation:', error);
      return false; // En cas d'erreur, autoriser la suppression
    }
  };

  // ========== OBTENIR LES ÉLÉMENTS ACTIFS UNIQUEMENT ==========
  const getActiveItems = (category) => {
    return (data[category] || []).filter(item => item.active !== false);
  };

  // ========== RECHERCHER DES ÉLÉMENTS ==========
  const searchItems = (category, searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return getActiveItems(category);
    }

    const term = searchTerm.toLowerCase().trim();
    return (data[category] || []).filter(item => {
      if (item.active === false) return false;
      
      return (
        item.name?.toLowerCase().includes(term) ||
        item.value?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.specialty?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term)
      );
    });
  };

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    toggleActive,
    getActiveItems,
    searchItems,
    checkDuplicate
  };
};