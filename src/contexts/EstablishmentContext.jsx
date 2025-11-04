// src/contexts/EstablishmentContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const EstablishmentContext = createContext();

export const EstablishmentProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentEstablishment, setCurrentEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger l'établissement de l'utilisateur
  useEffect(() => {
    if (!user) {
      setCurrentEstablishment(null);
      setLoading(false);
      return;
    }

    // Si l'utilisateur n'a pas d'établissement assigné
    if (!user.establishmentId) {
      console.warn('⚠️ Utilisateur sans établissement:', user.email);
      setCurrentEstablishment(null);
      setLoading(false);
      return;
    }

    const loadEstablishment = async () => {
      try {
        console.log('🏢 Chargement établissement:', user.establishmentId);
        
        const estabRef = doc(db, 'establishments', user.establishmentId);
        const estabSnap = await getDoc(estabRef);

        if (estabSnap.exists()) {
          const establishment = {
            id: estabSnap.id,
            ...estabSnap.data()
          };
          
          console.log('✅ Établissement chargé:', establishment.name);
          setCurrentEstablishment(establishment);
          setError(null);
        } else {
          console.error('❌ Établissement non trouvé:', user.establishmentId);
          setError('Établissement non trouvé');
          setCurrentEstablishment(null);
        }
      } catch (err) {
        console.error('❌ Erreur chargement établissement:', err);
        setError(err.message);
        setCurrentEstablishment(null);
      } finally {
        setLoading(false);
      }
    };

    loadEstablishment();
  }, [user?.establishmentId, user?.email]);

  const value = {
    currentEstablishment,
    loading,
    error
  };

  return (
    <EstablishmentContext.Provider value={value}>
      {children}
    </EstablishmentContext.Provider>
  );
};

export const useEstablishment = () => {
  const context = useContext(EstablishmentContext);
  if (!context) {
    throw new Error('useEstablishment must be used within an EstablishmentProvider');
  }
  return context;
};

export default EstablishmentContext;