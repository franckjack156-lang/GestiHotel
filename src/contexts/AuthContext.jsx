// src/contexts/AuthContext.jsx - VERSION CORRIGÉE MULTI-ÉTABLISSEMENTS
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentEstablishment, setCurrentEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            const fullUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData
            };
            
            setUser(fullUser);
            
            // Charger l'établissement de l'utilisateur
            if (userData.establishmentId) {
              const estabDocRef = doc(db, 'establishments', userData.establishmentId);
              const estabDoc = await getDoc(estabDocRef);
              
              if (estabDoc.exists()) {
                setCurrentEstablishment({
                  id: estabDoc.id,
                  ...estabDoc.data()
                });
              }
            }

            // Mettre à jour lastLogin
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp()
            });
          }
        } catch (err) {
          console.error('Erreur chargement utilisateur:', err);
          setError('Erreur de chargement des données utilisateur');
        }
      } else {
        setUser(null);
        setCurrentEstablishment(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await signOut(auth);
        setLoading(false);
        const errorMessage = 'Utilisateur non trouvé dans la base de données';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const userData = userDoc.data();

      if (!userData.active) {
        await signOut(auth);
        setLoading(false);
        const errorMessage = 'Compte désactivé. Contactez un administrateur.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Charger l'établissement
      if (userData.establishmentId) {
        const estabDocRef = doc(db, 'establishments', userData.establishmentId);
        const estabDoc = await getDoc(estabDocRef);
        
        if (estabDoc.exists()) {
          setCurrentEstablishment({
            id: estabDoc.id,
            ...estabDoc.data()
          });
        }
      }

      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      let errorMessage;

      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Compte désactivé';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Trop de tentatives. Réessayez plus tard.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erreur réseau. Vérifiez votre connexion';
          break;
        default:
          errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (email, password, additionalData) => {
    setLoading(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const newUserData = {
        email,
        ...additionalData,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      await setDoc(userDocRef, newUserData);
      
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        ...newUserData
      });
      
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      let errorMessage;

      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Cette adresse email est déjà utilisée';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Adresse email invalide';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erreur réseau. Vérifiez votre connexion';
          break;
        default:
          errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await signOut(auth);
      setUser(null);
      setCurrentEstablishment(null);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const errorMessage = 'Erreur lors de la déconnexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser(prev => ({
          ...prev,
          ...userData
        }));
        
        // Recharger l'établissement
        if (userData.establishmentId) {
          const estabDocRef = doc(db, 'establishments', userData.establishmentId);
          const estabDoc = await getDoc(estabDocRef);
          
          if (estabDoc.exists()) {
            setCurrentEstablishment({
              id: estabDoc.id,
              ...estabDoc.data()
            });
          }
        }
      }
    } catch (err) {
      console.error('Erreur rafraîchissement utilisateur:', err);
    }
  };

  const changeEstablishment = async (establishmentId) => {
    if (!user) return { success: false, error: 'Non connecté' };
    
    if (user.role !== 'superadmin') {
      return { success: false, error: 'Permission refusée' };
    }
    
    try {
      const estabDocRef = doc(db, 'establishments', establishmentId);
      const estabDoc = await getDoc(estabDocRef);
      
      if (!estabDoc.exists()) {
        return { success: false, error: 'Établissement non trouvé' };
      }
      
      setCurrentEstablishment({
        id: estabDoc.id,
        ...estabDoc.data()
      });
      
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        currentEstablishmentId: establishmentId
      });
      
      return { success: true };
    } catch (err) {
      console.error('Erreur changement établissement:', err);
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    currentEstablishment,
    loading,
    error,
    login,
    signup,
    logout,
    refreshUser,
    changeEstablishment
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export { AuthContext };