// src/hooks/useMultiEstablishments.js
// Hook pour gérer les établissements multiples d'un utilisateur
import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useMultiEstablishments = (user) => {
  const [userEstablishments, setUserEstablishments] = useState([]);
  const [currentEstablishmentId, setCurrentEstablishmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les établissements de l'utilisateur
  useEffect(() => {
    if (!user) {
      setUserEstablishments([]);
      setCurrentEstablishmentId(null);
      setLoading(false);
      return;
    }

    const loadUserEstablishments = async () => {
      try {
        console.log('🏢 Chargement des établissements de l\'utilisateur:', user.email);
        
        // SuperAdmin voit tous les établissements
        if (user.role === 'superadmin') {
          const q = query(collection(db, 'establishments'));
          const snapshot = await getDocs(q);
          
          const establishments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('✅ SuperAdmin - Tous les établissements chargés:', establishments.length);
          setUserEstablishments(establishments);
          
          // Définir l'établissement actuel (le premier actif ou le premier de la liste)
          const activeEstab = establishments.find(e => e.active) || establishments[0];
          if (activeEstab) {
            setCurrentEstablishmentId(user.currentEstablishmentId || activeEstab.id);
          }
        } 
        // Autres utilisateurs : uniquement leurs établissements assignés
        else {
          const establishmentIds = user.establishmentIds || [];
          
          if (establishmentIds.length === 0) {
            console.warn('⚠️ Utilisateur sans établissement assigné');
            setUserEstablishments([]);
            setCurrentEstablishmentId(null);
            setLoading(false);
            return;
          }

          // Charger tous les établissements de l'utilisateur
          const establishments = await Promise.all(
            establishmentIds.map(async (estabId) => {
              const estabDoc = await getDoc(doc(db, 'establishments', estabId));
              if (estabDoc.exists()) {
                return {
                  id: estabDoc.id,
                  ...estabDoc.data()
                };
              }
              return null;
            })
          );

          const validEstablishments = establishments.filter(e => e !== null);
          console.log('✅ Établissements utilisateur chargés:', validEstablishments.length);
          setUserEstablishments(validEstablishments);
          
          // Définir l'établissement actuel
          const current = user.currentEstablishmentId && validEstablishments.find(e => e.id === user.currentEstablishmentId);
          setCurrentEstablishmentId(current ? current.id : validEstablishments[0]?.id || null);
        }

        setError(null);
      } catch (err) {
        console.error('❌ Erreur chargement établissements:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserEstablishments();
  }, [user?.uid, user?.role, user?.establishmentIds, user?.currentEstablishmentId]);

  // Établissement actuel complet
  const currentEstablishment = useMemo(() => {
    return userEstablishments.find(e => e.id === currentEstablishmentId) || null;
  }, [userEstablishments, currentEstablishmentId]);

  // Changer d'établissement
  const switchEstablishment = async (establishmentId) => {
    if (!user || !establishmentId) return { success: false, error: 'Paramètres invalides' };

    try {
      console.log('🔄 Changement d\'établissement:', establishmentId);
      
      // Mettre à jour dans Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        currentEstablishmentId: establishmentId,
        updatedAt: serverTimestamp()
      });

      // Mettre à jour l'état local
      setCurrentEstablishmentId(establishmentId);
      
      console.log('✅ Établissement changé avec succès');
      return { success: true };
    } catch (err) {
      console.error('❌ Erreur changement établissement:', err);
      return { success: false, error: err.message };
    }
  };

  // Vérifier si une fonctionnalité est activée pour l'établissement actuel
  const hasFeature = (featureKey) => {
    if (!currentEstablishment) return false;
    return currentEstablishment.features?.[featureKey] === true;
  };

  // Obtenir les établissements actifs uniquement
  const activeEstablishments = useMemo(() => {
    return userEstablishments.filter(e => e.active !== false);
  }, [userEstablishments]);

  return {
    // États
    userEstablishments: activeEstablishments,
    allEstablishments: userEstablishments, // Inclut les inactifs
    currentEstablishment,
    currentEstablishmentId,
    loading,
    error,
    
    // Méthodes
    switchEstablishment,
    hasFeature,
    
    // Informations utiles
    hasMultipleEstablishments: userEstablishments.length > 1,
    establishmentCount: userEstablishments.length
  };
};

export default useMultiEstablishments;