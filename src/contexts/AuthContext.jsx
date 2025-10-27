import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../Config/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        try {
          // Récupérer les données utilisateur depuis Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Vérifier si l'utilisateur est actif
            if (userData.active === false) {
              await signOut(auth);
              setUser(null);
              setError('Votre compte a été désactivé. Contactez un administrateur.');
              setLoading(false);
              return;
            }

            // Mettre à jour la dernière connexion
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp()
            });

            // Définir l'utilisateur avec toutes ses données
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name || firebaseUser.displayName || 'Utilisateur',
              role: userData.role || 'reception',
              phone: userData.phone || '',
              department: userData.department || '',
              photoURL: firebaseUser.photoURL || userData.photoURL || null,
              active: userData.active !== false,
              createdAt: userData.createdAt,
              lastLogin: userData.lastLogin
            });
          } else {
            // L'utilisateur existe dans Auth mais pas dans Firestore
            // Créer un document utilisateur basique
            const newUserData = {
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Utilisateur',
              role: 'reception',
              active: true,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            };

            await setDoc(userDocRef, newUserData);

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Utilisateur',
              role: 'reception',
              active: true
            });
          }
        } catch (err) {
          console.error('Erreur chargement données utilisateur:', err);
          setError('Erreur lors du chargement des données utilisateur');
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Connexion
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Vérifier si l'utilisateur est actif
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().active === false) {
        await signOut(auth);
        setLoading(false);
        return { 
          success: false, 
          error: 'Votre compte a été désactivé. Contactez un administrateur.' 
        };
      }

      setLoading(false);
      return { success: true, user: userCredential.user };
    } catch (err) {
      setLoading(false);
      let errorMessage = 'Erreur de connexion';

      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'Aucun compte trouvé avec cet email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mot de passe incorrect';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte a été désactivé';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Trop de tentatives. Réessayez plus tard';
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

  // Inscription
  const signup = async (email, password, additionalData = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Mettre à jour le profil
      if (additionalData.name) {
        await updateProfile(userCredential.user, {
          displayName: additionalData.name
        });
      }

      // Créer le document utilisateur dans Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userData = {
        email: email,
        name: additionalData.name || 'Utilisateur',
        role: additionalData.role || 'reception',
        department: additionalData.department || '',
        phone: additionalData.phone || '',
        active: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };

      await setDoc(userDocRef, userData);

      setLoading(false);
      return { success: true, user: userCredential.user };
    } catch (err) {
      setLoading(false);
      let errorMessage = 'Erreur lors de l\'inscription';

      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Cet email est déjà utilisé';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
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

  // Déconnexion
  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await signOut(auth);
      setUser(null);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const errorMessage = 'Erreur lors de la déconnexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Rafraîchir les données utilisateur
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
      }
    } catch (err) {
      console.error('Erreur rafraîchissement utilisateur:', err);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export { AuthContext };