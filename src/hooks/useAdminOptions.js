import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
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

export const useAdminOptions = (user) => {
  const [adminOptions, setAdminOptions] = useState({
    technicians: [],
    suppliers: [],
    equipment: []
  });
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // ========== CHARGEMENT DES DONNÉES ==========
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribes = [];

    // Écouter les techniciens
    const techQuery = query(
      collection(db, 'technicians'),
      orderBy('name', 'asc')
    );

    const unsubTech = onSnapshot(techQuery, 
      (snapshot) => {
        const techs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAdminOptions(prev => ({ ...prev, technicians: techs }));
      },
      (error) => {
        console.error('❌ Erreur technicians:', error);
      }
    );
    unsubscribes.push(unsubTech);

    // Écouter les fournisseurs
    const suppQuery = query(
      collection(db, 'suppliers'),
      orderBy('name', 'asc')
    );

    const unsubSupp = onSnapshot(suppQuery,
      (snapshot) => {
        const supps = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAdminOptions(prev => ({ ...prev, suppliers: supps }));
      },
      (error) => {
        console.error('❌ Erreur suppliers:', error);
      }
    );
    unsubscribes.push(unsubSupp);

    // Écouter les équipements
    const equipQuery = query(
      collection(db, 'equipment'),
      orderBy('name', 'asc')
    );

    const unsubEquip = onSnapshot(equipQuery,
      (snapshot) => {
        const equips = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAdminOptions(prev => ({ ...prev, equipment: equips }));
        setLoading(false);
      },
      (error) => {
        console.error('❌ Erreur equipment:', error);
        setLoading(false);
      }
    );
    unsubscribes.push(unsubEquip);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  // ========== TECHNICIENS ==========
  
  const addTechnician = async (technicianData) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    try {
      if (!technicianData.name || !technicianData.name.trim()) {
        addToast({
          type: 'error',
          title: 'Données invalides',
          message: 'Le nom du technicien est obligatoire'
        });
        return { success: false, error: 'Nom obligatoire' };
      }

      const docRef = await addDoc(collection(db, 'technicians'), {
        name: technicianData.name.trim(),
        specialty: technicianData.specialty || '',
        phone: technicianData.phone || '',
        email: technicianData.email || '',
        active: technicianData.active !== false,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email
      });
      
      addToast({
        type: 'success',
        title: 'Technicien ajouté',
        message: `${technicianData.name} a été ajouté avec succès`
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erreur ajout technicien:', error);
      
      let errorMessage = 'Erreur lors de l\'ajout';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission refusée. Seuls les managers peuvent ajouter des techniciens.';
      }
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });
      
      return { success: false, error: error.message };
    }
  };

  const updateTechnician = async (technicianId, updates) => {
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

      await updateDoc(doc(db, 'technicians', technicianId), updateData);
      
      addToast({
        type: 'success',
        title: 'Modification réussie',
        message: 'Technicien mis à jour avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur mise à jour technicien:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour'
      });
      
      return { success: false, error: error.message };
    }
  };

  const deleteTechnician = async (technicianId) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    try {
      await deleteDoc(doc(db, 'technicians', technicianId));
      
      addToast({
        type: 'success',
        title: 'Suppression réussie',
        message: 'Technicien supprimé avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression technicien:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression'
      });
      
      return { success: false, error: error.message };
    }
  };

  // ========== FOURNISSEURS ==========
  
  const addSupplier = async (supplierData) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    try {
      if (!supplierData.name || !supplierData.name.trim()) {
        addToast({
          type: 'error',
          title: 'Données invalides',
          message: 'Le nom du fournisseur est obligatoire'
        });
        return { success: false, error: 'Nom obligatoire' };
      }

      const docRef = await addDoc(collection(db, 'suppliers'), {
        name: supplierData.name.trim(),
        contact: supplierData.contact || '',
        phone: supplierData.phone || '',
        email: supplierData.email || '',
        address: supplierData.address || '',
        active: supplierData.active !== false,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email
      });
      
      addToast({
        type: 'success',
        title: 'Fournisseur ajouté',
        message: `${supplierData.name} a été ajouté avec succès`
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erreur ajout fournisseur:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'ajout'
      });
      
      return { success: false, error: error.message };
    }
  };

  const updateSupplier = async (supplierId, updates) => {
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

      await updateDoc(doc(db, 'suppliers', supplierId), updateData);
      
      addToast({
        type: 'success',
        title: 'Modification réussie',
        message: 'Fournisseur mis à jour avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur mise à jour fournisseur:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour'
      });
      
      return { success: false, error: error.message };
    }
  };

  const deleteSupplier = async (supplierId) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    try {
      await deleteDoc(doc(db, 'suppliers', supplierId));
      
      addToast({
        type: 'success',
        title: 'Suppression réussie',
        message: 'Fournisseur supprimé avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression fournisseur:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression'
      });
      
      return { success: false, error: error.message };
    }
  };

  // ========== ÉQUIPEMENTS ==========
  
  const addEquipment = async (equipmentData) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    try {
      if (!equipmentData.name || !equipmentData.name.trim()) {
        addToast({
          type: 'error',
          title: 'Données invalides',
          message: 'Le nom de l\'équipement est obligatoire'
        });
        return { success: false, error: 'Nom obligatoire' };
      }

      const docRef = await addDoc(collection(db, 'equipment'), {
        name: equipmentData.name.trim(),
        category: equipmentData.category || '',
        supplier: equipmentData.supplier || '',
        reference: equipmentData.reference || '',
        unitPrice: equipmentData.unitPrice || 0,
        active: equipmentData.active !== false,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email
      });
      
      addToast({
        type: 'success',
        title: 'Équipement ajouté',
        message: `${equipmentData.name} a été ajouté avec succès`
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erreur ajout équipement:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'ajout'
      });
      
      return { success: false, error: error.message };
    }
  };

  const updateEquipment = async (equipmentId, updates) => {
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

      await updateDoc(doc(db, 'equipment', equipmentId), updateData);
      
      addToast({
        type: 'success',
        title: 'Modification réussie',
        message: 'Équipement mis à jour avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur mise à jour équipement:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour'
      });
      
      return { success: false, error: error.message };
    }
  };

  const deleteEquipment = async (equipmentId) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    try {
      await deleteDoc(doc(db, 'equipment', equipmentId));
      
      addToast({
        type: 'success',
        title: 'Suppression réussie',
        message: 'Équipement supprimé avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression équipement:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression'
      });
      
      return { success: false, error: error.message };
    }
  };

  return {
    adminOptions,
    loading,
    // Techniciens
    addTechnician,
    updateTechnician,
    deleteTechnician,
    // Fournisseurs
    addSupplier,
    updateSupplier,
    deleteSupplier,
    // Équipements
    addEquipment,
    updateEquipment,
    deleteEquipment
  };
};