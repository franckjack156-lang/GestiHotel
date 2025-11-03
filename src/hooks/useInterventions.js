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
  doc,
  serverTimestamp,
  startAfter,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase.js';
import { toast } from '../utils/toast'; // ✨ NOUVEAU

export const useInterventions = (user, options = {}) => {
  const {
    pageSize = 50,
    enablePagination = true,
    autoRefresh = true
  } = options;

  const [interventions, setInterventions] = useState([]);
  const [blockedRooms, setBlockedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  // ✅ OPTIMISATION 1 : Pagination
  const loadMore = useCallback(async () => {
    if (!hasMore || !user) return;

    try {
      let q = query(
        collection(db, 'interventions'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (user.role === 'technician') {
        q = query(q, where('assignedTo', '==', user.uid));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const newInterventions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));

      setInterventions(prev => [...prev, ...newInterventions]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      
      if (snapshot.docs.length < pageSize) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Erreur pagination:', error);
      toast.error('Erreur chargement interventions');
    }
  }, [user, hasMore, lastDoc, pageSize]);

  // ✅ OPTIMISATION 2 : Debounced Real-time Updates
  useEffect(() => {
    if (!user || !autoRefresh) {
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'interventions'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (user.role === 'technician') {
      q = query(q, where('assignedTo', '==', user.uid));
    }

    // Debounce pour éviter trop d'updates
    let timeoutId;
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const interventionsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          }));
          
          setInterventions(interventionsData);
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
          setLoading(false);
        }, 300); // Attendre 300ms avant de mettre à jour
      },
      (error) => {
        console.error('Erreur snapshot:', error);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [user, autoRefresh, pageSize]);

  // ✅ OPTIMISATION 3 : Memoization des calculs coûteux
  const stats = useMemo(() => ({
    total: interventions.length,
    todo: interventions.filter(i => i.status === 'todo').length,
    inProgress: interventions.filter(i => i.status === 'inprogress').length,
    completed: interventions.filter(i => i.status === 'completed').length,
    urgent: interventions.filter(i => i.priority === 'urgent').length
  }), [interventions]);

  // ✅ OPTIMISATION 4 : Batch Writes
  const updateMultipleInterventions = useCallback(async (updates) => {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ id, data }) => {
        const ref = doc(db, 'interventions', id);
        batch.update(ref, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      
      toast.success(`${updates.length} interventions mises à jour`);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur batch update:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // ✅ OPTIMISATION 5 : Upload optimisé avec compression
  const uploadPhoto = useCallback(async (file, interventionId) => {
    try {
      // Compression image avant upload
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8
      });

      const storageRef = ref(
        storage, 
        `interventions/${interventionId}/${Date.now()}_${file.name}`
      );
      
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { success: true, url: downloadURL };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  return {
    interventions,
    blockedRooms,
    loading,
    stats,
    hasMore,
    loadMore,
    updateMultipleInterventions,
    uploadPhoto
  };
};

// ✅ Helper : Compression d'image
async function compressImage(file, options) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > options.maxWidth) {
          height *= options.maxWidth / width;
          width = options.maxWidth;
        }

        if (height > options.maxHeight) {
          width *= options.maxHeight / height;
          height = options.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          options.quality
        );
      };
      
      img.onerror = reject;
    };
    
    reader.onerror = reject;
  });
}