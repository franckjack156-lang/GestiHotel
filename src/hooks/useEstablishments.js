// src/hooks/useEstablishments.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useEstablishments = () => {
  const { user } = useAuth();
  const [establishments, setEstablishments] = useState([]);
  const [currentEstablishment, setCurrentEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger tous les établissements (pour superadmin)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Si pas superadmin, pas besoin de charger tous les établissements
    if (user.role !== 'superadmin') {
      setLoading(false);
      return;
    }

    console.log('🏢 useEstablishments: Chargement des établissements');

    const q = query(
      collection(db, 'establishments'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const establishmentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || null
        }));

        console.log('✅ Établissements chargés:', establishmentsData.length);
        setEstablishments(establishmentsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('❌ Erreur chargement établissements:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Charger l'établissement actuel de l'utilisateur
  useEffect(() => {
    if (!user || !user.establishmentId) {
      setCurrentEstablishment(null);
      return;
    }

    const loadCurrentEstablishment = async () => {
      try {
        console.log('🏢 Chargement établissement:', user.establishmentId);
        
        const estabDoc = await getDoc(doc(db, 'establishments', user.establishmentId));
        
        if (estabDoc.exists()) {
          setCurrentEstablishment({
            id: estabDoc.id,
            ...estabDoc.data()
          });
          console.log('✅ Établissement chargé:', estabDoc.data().name);
        } else {
          console.warn('⚠️ Établissement non trouvé:', user.establishmentId);
          setCurrentEstablishment(null);
        }
      } catch (err) {
        console.error('❌ Erreur chargement établissement:', err);
        setCurrentEstablishment(null);
      }
    };

    loadCurrentEstablishment();
  }, [user?.establishmentId]);

  return {
    establishments,
    currentEstablishment,
    loading,
    error
  };
};

export default useEstablishments;