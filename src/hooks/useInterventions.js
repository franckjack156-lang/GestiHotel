// src/hooks/useInterventions.js
// ✅ VERSION COMPLÈTE AVEC MULTI-ÉTABLISSEMENTS
// Toutes les fonctions CRUD + pagination + filtrage par établissement

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  startAfter,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { toast } from '../utils/toast';

export const useInterventions = (user, options = {}) => {
  const {
    pageSize = 50,
    enablePagination = false,
    autoRefresh = true
  } = options;

  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  // ===================================
  // CHARGEMENT INITIAL & TEMPS RÉEL
  // ===================================

  useEffect(() => {
    if (!user || !autoRefresh) {
      setLoading(false);
      return;
    }

    console.log('🔄 useInterventions: Démarrage écoute Firebase');

    let q;

    // MODIFIÉ: Filtrage par établissement
    if (user.role === 'superadmin') {
      // SuperAdmin: voir tous les établissements ou filtrer si un établissement est sélectionné
      if (user.currentEstablishmentId) {
        q = query(
          collection(db, 'interventions'),
          where('establishmentId', '==', user.currentEstablishmentId),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      } else {
        // Voir toutes les interventions de tous les établissements
        q = query(
          collection(db, 'interventions'),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }
    } else if (user.role === 'technician') {
      // Technicien: ses interventions assignées dans son établissement
      q = query(
        collection(db, 'interventions'),
        where('establishmentId', '==', user.establishmentId),
        where('assignedTo', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    } else {
      // Autres rôles: toutes les interventions de leur établissement
      if (!user.establishmentId) {
        console.warn('⚠️ Utilisateur sans établissement assigné');
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
          updatedAt: doc.data().updatedAt?.toDate?.() || null,
          startedAt: doc.data().startedAt?.toDate?.() || null,
          completedAt: doc.data().completedAt?.toDate?.() || null
        }));

        console.log('📥 useInterventions: Interventions chargées:', interventionsData.length);
        setInterventions(interventionsData);
        setLoading(false);

        // Mettre à jour lastDoc pour pagination
        if (snapshot.docs.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }
        
        setHasMore(snapshot.docs.length >= pageSize);
      },
      (err) => {
        console.error('❌ useInterventions: Erreur Firestore:', err);
        
        // Gestion des erreurs spécifiques
        if (err.code === 'permission-denied') {
          setError('Permissions insuffisantes pour accéder aux interventions');
          toast.error('Erreur de permissions', {
            description: 'Vérifiez que votre établissement est correctement configuré'
          });
        } else {
          setError(err.message);
          toast.error('Erreur chargement interventions');
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log('🛑 useInterventions: Arrêt écoute Firebase');
      unsubscribe();
    };
  }, [user, autoRefresh, pageSize, user?.currentEstablishmentId, user?.establishmentId]);

  // ===================================
  // PAGINATION
  // ===================================

  const loadMore = useCallback(async () => {
    if (!hasMore || !user || !lastDoc) return;

    console.log('📄 useInterventions: Chargement page suivante');

    try {
      let q;

      // MODIFIÉ: Appliquer le même filtrage que pour le chargement initial
      if (user.role === 'superadmin') {
        if (user.currentEstablishmentId) {
          q = query(
            collection(db, 'interventions'),
            where('establishmentId', '==', user.currentEstablishmentId),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(pageSize)
          );
        } else {
          q = query(
            collection(db, 'interventions'),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(pageSize)
          );
        }
      } else if (user.role === 'technician') {
        q = query(
          collection(db, 'interventions'),
          where('establishmentId', '==', user.establishmentId),
          where('assignedTo', '==', user.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, 'interventions'),
          where('establishmentId', '==', user.establishmentId),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHasMore(false);
        console.log('✅ Plus d\'interventions à charger');
        return;
      }

      const newInterventions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || null,
        startedAt: doc.data().startedAt?.toDate?.() || null,
        completedAt: doc.data().completedAt?.toDate?.() || null
      }));

      setInterventions(prev => [...prev, ...newInterventions]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length >= pageSize);

      console.log('✅ Page chargée:', newInterventions.length, 'interventions');
    } catch (error) {
      console.error('❌ Erreur pagination:', error);
      toast.error('Erreur chargement page');
    }
  }, [hasMore, lastDoc, pageSize, user]);

  // ===================================
  // STATISTIQUES
  // ===================================

  const stats = useMemo(() => {
    const total = interventions.length;
    const todo = interventions.filter(i => i.status === 'todo').length;
    const inProgress = interventions.filter(i => i.status === 'inprogress').length;
    const completed = interventions.filter(i => i.status === 'completed').length;
    const cancelled = interventions.filter(i => i.status === 'cancelled').length;

    const completionRate = total > 0 
      ? Math.round((completed / total) * 100) 
      : 0;

    // Calculer temps moyen de résolution (en minutes)
    const completedWithTime = interventions.filter(i => 
      i.status === 'completed' && i.startedAt && i.completedAt
    );

    const averageTime = completedWithTime.length > 0
      ? Math.round(
          completedWithTime.reduce((sum, i) => {
            const duration = (i.completedAt - i.startedAt) / 1000 / 60; // en minutes
            return sum + duration;
          }, 0) / completedWithTime.length
        )
      : 0;

    return {
      total,
      todo,
      inProgress,
      completed,
      cancelled,
      completionRate,
      averageTime
    };
  }, [interventions]);

  // ===================================
  // CRÉER INTERVENTION
  // ===================================

  const addIntervention = async (interventionData, photos = []) => {
    try {
      console.log('➕ Création intervention:', interventionData);

      // MODIFIÉ: Vérifier et ajouter establishmentId
      const establishmentId = interventionData.establishmentId || user.establishmentId || user.currentEstablishmentId;
      
      if (!establishmentId && user.role !== 'superadmin') {
        toast.error('Établissement requis', {
          description: 'Impossible de créer une intervention sans établissement'
        });
        return { success: false, error: 'Établissement requis' };
      }

      // Upload photos si présentes
      let photoUrls = [];
      if (photos.length > 0) {
        console.log('📸 Upload', photos.length, 'photo(s)');
        
        photoUrls = await Promise.all(
          photos.map(async (photo) => {
            const timestamp = Date.now();
            const fileName = `${timestamp}_${photo.name}`;
            const storageRef = ref(storage, `interventions/${fileName}`);
            
            await uploadBytes(storageRef, photo);
            const url = await getDownloadURL(storageRef);
            
            return {
              url,
              fileName: photo.name,
              uploadedAt: new Date().toISOString(),
              uploadedBy: user.uid,
              uploadedByName: user.name || user.email
            };
          })
        );
      }

      // Créer le document intervention
      const newIntervention = {
        ...interventionData,
        establishmentId, // NOUVEAU
        photos: photoUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email,
        history: [
          {
            id: `history_${Date.now()}`,
            status: 'todo',
            date: new Date().toISOString(),
            by: user.uid,
            byName: user.name || user.email,
            comment: 'Intervention créée'
          }
        ],
        messages: []
      };

      const docRef = await addDoc(collection(db, 'interventions'), newIntervention);

      console.log('✅ Intervention créée:', docRef.id);
      toast.success('Intervention créée avec succès');

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erreur création intervention:', error);
      
      if (error.code === 'permission-denied') {
        toast.error('Permission refusée', { 
          description: 'Vérifiez vos droits d\'accès' 
        });
      } else {
        toast.error('Erreur lors de la création', { description: error.message });
      }
      
      return { success: false, error: error.message };
    }
  };

  // ===================================
  // METTRE À JOUR INTERVENTION
  // ===================================

  const updateIntervention = async (interventionId, updates) => {
    try {
      console.log('📝 Mise à jour intervention:', interventionId, updates);

      const intervention = interventions.find(i => i.id === interventionId);
      if (!intervention) {
        throw new Error('Intervention non trouvée');
      }

      // MODIFIÉ: Vérifier que l'utilisateur peut modifier cette intervention
      if (user.role !== 'superadmin' && 
          intervention.establishmentId !== user.establishmentId) {
        throw new Error('Permission refusée: intervention d\'un autre établissement');
      }

      // Préparer les données de mise à jour
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // IMPORTANT: Ne JAMAIS permettre la modification de establishmentId
      delete updateData.establishmentId;

      // Ajouter à l'historique si changement de statut
      if (updates.status && updates.status !== intervention.status) {
        updateData.history = [
          ...(intervention.history || []),
          {
            id: `history_${Date.now()}`,
            status: updates.status,
            date: new Date().toISOString(),
            by: user.uid,
            byName: user.name || user.email,
            comment: updates.comment || `Statut changé en ${updates.status}`
          }
        ];

        // Ajouter timestamp de démarrage si passage en inprogress
        if (updates.status === 'inprogress' && !intervention.startedAt) {
          updateData.startedAt = serverTimestamp();
        }

        // Ajouter timestamp de complétion si passage en completed
        if (updates.status === 'completed' && !intervention.completedAt) {
          updateData.completedAt = serverTimestamp();
        }
      }

      await updateDoc(doc(db, 'interventions', interventionId), updateData);

      console.log('✅ Intervention mise à jour');
      toast.success('Intervention mise à jour');

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur mise à jour intervention:', error);
      
      if (error.code === 'permission-denied') {
        toast.error('Permission refusée', { 
          description: 'Vous ne pouvez pas modifier cette intervention' 
        });
      } else {
        toast.error('Erreur lors de la mise à jour', { description: error.message });
      }
      
      return { success: false, error: error.message };
    }
  };

  // ===================================
  // SUPPRIMER INTERVENTION
  // ===================================

  const deleteIntervention = async (interventionId) => {
    try {
      console.log('🗑️ Suppression intervention:', interventionId);

      // MODIFIÉ: Seul le superadmin peut supprimer
      if (user.role !== 'superadmin') {
        throw new Error('Seul un superadmin peut supprimer une intervention');
      }

      await deleteDoc(doc(db, 'interventions', interventionId));

      console.log('✅ Intervention supprimée');
      toast.success('Intervention supprimée');

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression intervention:', error);
      toast.error('Erreur lors de la suppression', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  // ===================================
  // AJOUTER MESSAGE
  // ===================================

  const addMessage = async (interventionId, messageText, photos = []) => {
    try {
      console.log('💬 Ajout message intervention:', interventionId);

      const intervention = interventions.find(i => i.id === interventionId);
      if (!intervention) {
        throw new Error('Intervention non trouvée');
      }

      // MODIFIÉ: Vérifier l'accès à l'établissement
      if (user.role !== 'superadmin' && 
          intervention.establishmentId !== user.establishmentId) {
        throw new Error('Permission refusée');
      }

      // Upload photos si présentes
      let photoUrls = [];
      if (photos.length > 0) {
        photoUrls = await Promise.all(
          photos.map(async (photo) => {
            const timestamp = Date.now();
            const fileName = `${timestamp}_${photo.name}`;
            const storageRef = ref(storage, `messages/${fileName}`);
            
            await uploadBytes(storageRef, photo);
            const url = await getDownloadURL(storageRef);
            
            return {
              url,
              fileName: photo.name,
              uploadedAt: new Date().toISOString()
            };
          })
        );
      }

      const newMessage = {
        id: `msg_${Date.now()}`,
        text: messageText,
        photos: photoUrls,
        sentBy: user.uid,
        sentByName: user.name || user.email,
        sentAt: new Date().toISOString()
      };

      const updatedMessages = [...(intervention.messages || []), newMessage];

      await updateDoc(doc(db, 'interventions', interventionId), {
        messages: updatedMessages,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Message ajouté');
      toast.success('Message envoyé');

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur ajout message:', error);
      toast.error('Erreur lors de l\'envoi du message');
      return { success: false, error: error.message };
    }
  };

  return {
    interventions,
    loading,
    error,
    stats,
    hasMore,
    loadMore,
    addIntervention,
    updateIntervention,
    deleteIntervention,
    addMessage
  };
};

export default useInterventions;