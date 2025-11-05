// src/hooks/useInterventions.js - VERSION CORRIGÉE MULTI-ÉTABLISSEMENTS
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getDb, storage } from '../config/firebase';

export const useInterventions = (user, options = {}) => {
  const {
    pageSize = 50,
    autoRefresh = true
  } = options;

  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chargement et écoute temps réel
  useEffect(() => {
    if (!user || !autoRefresh) {
      setLoading(false);
      return;
    }

    const setupListener = async () => {
      const db = await getDb();
      let q;

      // SuperAdmin: voir tous les établissements ou filtrer si un établissement est sélectionné
      if (user.role === 'superadmin') {
        if (user.currentEstablishmentId) {
          q = query(
            collection(db, 'interventions'),
            where('establishmentId', '==', user.currentEstablishmentId),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
          );
        } else {
          q = query(
            collection(db, 'interventions'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
          );
        }
      }
      // Technicien: ses interventions assignées dans son établissement
      else if (user.role === 'technician') {
        if (!user.establishmentId) {
          setInterventions([]);
          setLoading(false);
          return;
        }

        q = query(
          collection(db, 'interventions'),
          where('establishmentId', '==', user.establishmentId),
          where('assignedTo', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }
      // Autres rôles: toutes les interventions de leur établissement
      else {
        if (!user.establishmentId) {
          setInterventions([]);
          setLoading(false);
          return;
        }

        q = query(
          collection(db, 'interventions'),
          where('establishmentId', '==', user.establishmentId),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }

      const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const interventionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || null
        }));

        setInterventions(interventionsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Erreur chargement interventions:', err);
        setError(err.message);
        setLoading(false);
      }
    );

      return unsubscribe;
    };

    const unsubscribePromise = setupListener();

    return () => {
      unsubscribePromise.then(unsub => {
        if (unsub) unsub();
      });
    };
  }, [user, autoRefresh, pageSize, user?.currentEstablishmentId]);

  // Créer une intervention
  const createIntervention = useCallback(async (data) => {
    try {
      const db = await getDb();
      const intervention = {
        ...data,
        establishmentId: user.establishmentId || user.currentEstablishmentId,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email,
        status: data.status || 'todo',
        photos: [],
        messages: [],
        history: [{
          id: `history_${Date.now()}`,
          status: data.status || 'todo',
          date: new Date(),
          by: user.uid,
          byName: user.name || user.email,
          comment: 'Intervention créée',
          fields: []
        }]
      };

      const docRef = await addDoc(collection(db, 'interventions'), intervention);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erreur création intervention:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Mettre à jour une intervention
  const updateIntervention = useCallback(async (id, updates) => {
    try {
      const db = await getDb();
      const interventionRef = doc(db, 'interventions', id);
      
      await updateDoc(interventionRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: user.name || user.email
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour intervention:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Supprimer une intervention
  const deleteIntervention = useCallback(async (id) => {
    try {
      // Vérifier les permissions
      if (!['superadmin', 'manager'].includes(user.role)) {
        return { success: false, error: 'Permission refusée' };
      }

      const db = await getDb();
      await deleteDoc(doc(db, 'interventions', id));
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression intervention:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Ajouter un message
  const addMessage = useCallback(async (interventionId, message) => {
    try {
      const db = await getDb();
      const interventionRef = doc(db, 'interventions', interventionId);
      const interventionSnap = await getDoc(interventionRef);
      
      if (!interventionSnap.exists()) {
        throw new Error('Intervention non trouvée');
      }

      const currentData = interventionSnap.data();
      const currentMessages = currentData.messages || [];

      const newMessage = {
        id: `msg_${Date.now()}`,
        text: message,
        type: 'text',
        senderId: user.uid,
        senderName: user.name || user.email,
        timestamp: new Date(),
        read: false
      };

      await updateDoc(interventionRef, {
        messages: [...currentMessages, newMessage],
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur ajout message:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Uploader une photo
  const uploadPhoto = useCallback(async (interventionId, file) => {
    try {
      const storageRef = ref(storage, `interventions/${interventionId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const db = await getDb();
      const interventionRef = doc(db, 'interventions', interventionId);
      const interventionSnap = await getDoc(interventionRef);
      
      if (!interventionSnap.exists()) {
        throw new Error('Intervention non trouvée');
      }

      const currentData = interventionSnap.data();
      const currentPhotos = currentData.photos || [];

      const newPhoto = {
        id: `photo_${Date.now()}`,
        url,
        uploadedBy: user.uid,
        uploadedByName: user.name || user.email,
        timestamp: new Date()
      };

      await updateDoc(interventionRef, {
        photos: [...currentPhotos, newPhoto],
        updatedAt: serverTimestamp()
      });

      return { success: true, url };
    } catch (error) {
      console.error('Erreur upload photo:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Supprimer une photo
  const deletePhoto = useCallback(async (interventionId, photoId, photoUrl) => {
    try {
      const storageRef = ref(storage, photoUrl);
      await deleteObject(storageRef);

      const db = await getDb();
      const interventionRef = doc(db, 'interventions', interventionId);
      const interventionSnap = await getDoc(interventionRef);
      
      if (!interventionSnap.exists()) {
        throw new Error('Intervention non trouvée');
      }

      const currentData = interventionSnap.data();
      const updatedPhotos = (currentData.photos || []).filter(p => p.id !== photoId);

      await updateDoc(interventionRef, {
        photos: updatedPhotos,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur suppression photo:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    interventions,
    loading,
    error,
    createIntervention,
    updateIntervention,
    deleteIntervention,
    addMessage,
    uploadPhoto,
    deletePhoto
  };
};

export default useInterventions;