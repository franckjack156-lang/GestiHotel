// src/hooks/useBlockedRooms.js
// ✨ NOUVEAU : Hook dédié à la gestion des chambres bloquées
// Extrait toute la logique de App.jsx

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
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { getDb } from '../config/firebase';
import { toast } from '../utils/toast';

export const useBlockedRooms = (user) => {
  const [blockedRooms, setBlockedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Écoute temps réel des chambres bloquées
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('🔄 useBlockedRooms: Démarrage écoute Firebase');

    const setupListener = async () => {
      const db = await getDb();
      const q = query(
        collection(db, 'blockedRooms'),
        where('blocked', '==', true),
        orderBy('blockedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rooms = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          blockedAt: doc.data().blockedAt?.toDate?.() || new Date(),
          unblockedAt: doc.data().unblockedAt?.toDate?.() || null
        }));
        
        console.log('📥 useBlockedRooms: Chambres bloquées:', rooms.length);
        setBlockedRooms(rooms);
        setLoading(false);
      },
      (err) => {
        console.error('❌ useBlockedRooms: Erreur Firestore:', err);
        setError(err.message);
        setLoading(false);
        toast.error('Erreur chargement chambres bloquées');
      }
    );

      return unsubscribe;
    };

    const unsubscribePromise = setupListener();

    return () => {
      console.log('🛑 useBlockedRooms: Arrêt écoute Firebase');
      unsubscribePromise.then(unsub => {
        if (unsub) unsub();
      });
    };
  }, [user]);

  /**
   * Bloquer une chambre
   */
  const blockRoom = async (roomNumber, reason, interventionId = null) => {
    try {
      console.log('🔒 Blocage chambre:', { roomNumber, reason, interventionId });

      const db = await getDb();
      const newBlock = {
        room: roomNumber,
        reason: reason || 'Aucune raison spécifiée',
        blocked: true,
        blockedAt: serverTimestamp(),
        blockedBy: user.uid,
        blockedByName: user.name || user.email,
        interventionId: interventionId || null
      };

      const docRef = await addDoc(collection(db, 'blockedRooms'), newBlock);

      console.log('✅ Chambre bloquée:', docRef.id);
      toast.success(`Chambre ${roomNumber} bloquée`);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erreur blocage chambre:', error);
      toast.error('Erreur lors du blocage');
      return { success: false, error: error.message };
    }
  };

  /**
   * Débloquer une chambre
   */
  const unblockRoom = async (roomNumber) => {
    try {
      console.log('🔓 Déblocage chambre:', roomNumber);

      const db = await getDb();
      // Trouver le document de blocage actif
      const q = query(
        collection(db, 'blockedRooms'),
        where('room', '==', roomNumber),
        where('blocked', '==', true)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.warn('⚠️ Aucun blocage trouvé pour la chambre:', roomNumber);
        toast.error('Chambre non bloquée');
        return { success: false, error: 'Chambre non bloquée' };
      }

      // Débloquer le premier document trouvé (devrait être unique)
      const blockDoc = snapshot.docs[0];
      
      await updateDoc(doc(db, 'blockedRooms', blockDoc.id), {
        blocked: false,
        unblockedAt: serverTimestamp(),
        unblockedBy: user.uid,
        unblockedByName: user.name || user.email
      });

      console.log('✅ Chambre débloquée:', blockDoc.id);
      toast.success(`Chambre ${roomNumber} débloquée`);

      return { success: true, id: blockDoc.id };
    } catch (error) {
      console.error('❌ Erreur déblocage chambre:', error);
      toast.error('Erreur lors du déblocage');
      return { success: false, error: error.message };
    }
  };

  /**
   * Toggle bloquer/débloquer
   */
  const toggleRoomBlock = async (roomNumber, reason = null) => {
    const existingBlock = blockedRooms.find(
      br => br.room === roomNumber && br.blocked === true
    );

    if (existingBlock) {
      return await unblockRoom(roomNumber);
    } else {
      return await blockRoom(roomNumber, reason);
    }
  };

  /**
   * Vérifier si une chambre est bloquée
   */
  const isRoomBlocked = (roomNumber) => {
    return blockedRooms.some(
      br => br.room === roomNumber && br.blocked === true
    );
  };

  /**
   * Obtenir les infos de blocage d'une chambre
   */
  const getRoomBlockInfo = (roomNumber) => {
    return blockedRooms.find(
      br => br.room === roomNumber && br.blocked === true
    ) || null;
  };

  /**
   * Obtenir toutes les chambres bloquées (numéros uniquement)
   */
  const getBlockedRoomNumbers = () => {
    return blockedRooms
      .filter(br => br.blocked === true)
      .map(br => br.room);
  };

  return {
    blockedRooms,
    loading,
    error,
    blockRoom,
    unblockRoom,
    toggleRoomBlock,
    isRoomBlocked,
    getRoomBlockInfo,
    getBlockedRoomNumbers
  };
};

export default useBlockedRooms;