import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebase';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [functionsAvailable, setFunctionsAvailable] = useState(null);
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  // Vérifier la disponibilité des Cloud Functions au chargement
  useEffect(() => {
    const checkFunctions = async () => {
      try {
        const functions = getFunctions();
        const testFunction = httpsCallable(functions, 'createUser');
        setFunctionsAvailable(true);
      } catch (error) {
        console.warn('⚠️ Cloud Functions non disponibles:', error);
        setFunctionsAvailable(false);
      }
    };

    checkFunctions();
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'superadmin') {
      setUsers([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const usersData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          usersData.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            lastLogin: data.lastLogin?.toDate?.() || null,
            deletedAt: data.deletedAt?.toDate?.() || null
          });
        });
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Erreur useUserManagement:', error);
        if (error.code === 'permission-denied') {
          addToast({
            type: 'error',
            title: 'Permission refusée',
            message: 'Accès aux utilisateurs refusé'
          });
        } else {
          addToast({
            type: 'error',
            title: 'Erreur',
            message: 'Erreur de chargement des utilisateurs'
          });
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, addToast]);

  const addUser = async (userData) => {
    try {
      if (!currentUser || currentUser.role !== 'superadmin') {
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Seuls les Super Admins peuvent créer des utilisateurs'
        });
        return { success: false, error: 'Permission refusée' };
      }

      // Validation des données
      if (!userData.email || !userData.name || !userData.password) {
        addToast({
          type: 'error',
          title: 'Données manquantes',
          message: 'Email, nom et mot de passe sont obligatoires'
        });
        return { success: false, error: 'Champs obligatoires manquants' };
      }

      if (userData.password.length < 6) {
        addToast({
          type: 'error',
          title: 'Mot de passe trop court',
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
        return { success: false, error: 'Mot de passe trop court' };
      }

      // Vérifier si les Functions sont disponibles
      if (functionsAvailable === false) {
        addToast({
          type: 'warning',
          title: 'Cloud Functions non déployées',
          message: 'Utilisez la console Firebase pour créer des utilisateurs. Instructions : Authentication > Users > Add user'
        });
        return { success: false, error: 'Cloud Functions non disponibles' };
      }

      // Appeler la Cloud Function
      try {
        const functions = getFunctions();
        const createUserFunction = httpsCallable(functions, 'createUser');
        
        const result = await createUserFunction({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          role: userData.role || 'reception',
          department: userData.department || '',
          phone: userData.phone || ''
        });

        addToast({
          type: 'success',
          title: 'Utilisateur créé',
          message: `${userData.email} créé avec succès`
        });
        
        return { 
          success: true, 
          userId: result.data.userId,
          message: result.data.message
        };

      } catch (funcError) {
        console.error('❌ Erreur Cloud Function:', funcError);
        
        // Fallback si les Functions ne sont pas déployées
        if (funcError.code === 'functions/not-found' || 
            funcError.code === 'functions/unavailable') {
          addToast({
            type: 'warning',
            title: 'Cloud Functions non déployées',
            message: 'Pour créer des utilisateurs :\n1. Déployez les functions : firebase deploy --only functions\n2. Ou utilisez la console Firebase'
          });
          setFunctionsAvailable(false);
          return { success: false, error: 'Cloud Functions non disponibles' };
        }
        
        throw funcError;
      }

    } catch (error) {
      console.error('❌ Erreur création utilisateur:', error);
      
      let errorMessage = "Erreur lors de la création de l'utilisateur";
      
      switch (error.code) {
        case 'already-exists':
        case 'auth/email-already-in-use':
          errorMessage = 'Un utilisateur avec cet email existe déjà';
          break;
        case 'invalid-argument':
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        case 'permission-denied':
          errorMessage = 'Permission refusée';
          break;
        case 'unauthenticated':
          errorMessage = 'Vous devez être connecté';
          break;
        default:
          errorMessage = error.message || 'Erreur inconnue';
      }

      addToast({
        type: 'error',
        title: 'Erreur création',
        message: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      if (!currentUser || currentUser.role !== 'superadmin') {
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Seuls les Super Admins peuvent modifier des utilisateurs'
        });
        return { success: false, error: 'Permission refusée' };
      }

      if (!updates.email || !updates.name) {
        addToast({
          type: 'error',
          title: 'Données manquantes',
          message: 'Email et nom sont obligatoires'
        });
        return { success: false, error: 'Champs obligatoires manquants' };
      }

      const updateData = {
        email: updates.email,
        name: updates.name,
        role: updates.role,
        department: updates.department || '',
        phone: updates.phone || '',
        active: updates.active !== false,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
        updatedByName: currentUser.name
      };

      await updateDoc(doc(db, 'users', userId), updateData);
      
      addToast({
        type: 'success',
        title: 'Utilisateur modifié',
        message: 'Utilisateur mis à jour avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur mise à jour utilisateur:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour'
      });
      
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      if (!currentUser || currentUser.role !== 'superadmin') {
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Seuls les Super Admins peuvent désactiver des utilisateurs'
        });
        return { success: false, error: 'Permission refusée' };
      }

      await updateDoc(doc(db, 'users', userId), { 
        active: false,
        deletedAt: serverTimestamp(),
        deletedBy: currentUser.uid,
        deletedByName: currentUser.name
      });
      
      addToast({
        type: 'success',
        title: 'Utilisateur désactivé',
        message: 'Utilisateur désactivé avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur désactivation utilisateur:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la désactivation'
      });
      
      return { success: false, error: error.message };
    }
  };

  const activateUser = async (userId) => {
    try {
      if (!currentUser || currentUser.role !== 'superadmin') {
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Seuls les Super Admins peuvent réactiver des utilisateurs'
        });
        return { success: false, error: 'Permission refusée' };
      }

      await updateDoc(doc(db, 'users', userId), { 
        active: true,
        reactivatedAt: serverTimestamp(),
        reactivatedBy: currentUser.uid,
        reactivatedByName: currentUser.name
      });
      
      addToast({
        type: 'success',
        title: 'Utilisateur réactivé',
        message: 'Utilisateur réactivé avec succès'
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur activation utilisateur:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la réactivation'
      });
      
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (userId) => {
    try {
      if (!currentUser || currentUser.role !== 'superadmin') {
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Seuls les Super Admins peuvent réinitialiser les mots de passe'
        });
        return { success: false, error: 'Permission refusée' };
      }

      // Générer un mot de passe temporaire
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

      if (functionsAvailable === false) {
        addToast({
          type: 'warning',
          title: 'Cloud Functions non disponibles',
          message: 'Utilisez la console Firebase pour réinitialiser le mot de passe'
        });
        return { success: false, error: 'Cloud Functions non disponibles' };
      }

      const functions = getFunctions();
      const resetPasswordFunction = httpsCallable(functions, 'updateUserPassword');
      
      await resetPasswordFunction({
        userId: userId,
        newPassword: tempPassword
      });

      addToast({
        type: 'success',
        title: 'Mot de passe réinitialisé',
        message: `Nouveau mot de passe : ${tempPassword}`
      });
      
      return { success: true, tempPassword };

    } catch (error) {
      console.error('❌ Erreur réinitialisation mot de passe:', error);
      
      if (error.code === 'functions/not-found' || 
          error.code === 'functions/unavailable') {
        addToast({
          type: 'warning',
          title: 'Cloud Functions non disponibles',
          message: 'Déployez les functions ou utilisez la console Firebase'
        });
        setFunctionsAvailable(false);
        return { success: false, error: 'Cloud Functions non disponibles' };
      }
      
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la réinitialisation'
      });
      
      return { success: false, error: error.message };
    }
  };

  const updateUserPassword = async (userId, newPassword) => {
    try {
      if (!currentUser || currentUser.role !== 'superadmin') {
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Seuls les Super Admins peuvent modifier les mots de passe'
        });
        return { success: false, error: 'Permission refusée' };
      }

      if (!newPassword || newPassword.length < 6) {
        addToast({
          type: 'error',
          title: 'Mot de passe invalide',
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
        return { success: false, error: 'Mot de passe trop court' };
      }

      if (functionsAvailable === false) {
        addToast({
          type: 'warning',
          title: 'Cloud Functions non disponibles',
          message: 'Utilisez la console Firebase pour modifier le mot de passe'
        });
        return { success: false, error: 'Cloud Functions non disponibles' };
      }

      const functions = getFunctions();
      const updatePasswordFunction = httpsCallable(functions, 'updateUserPassword');
      
      const result = await updatePasswordFunction({
        userId: userId,
        newPassword: newPassword
      });

      addToast({
        type: 'success',
        title: 'Mot de passe modifié',
        message: 'Mot de passe modifié avec succès'
      });
      
      return { success: true, message: result.data.message };

    } catch (error) {
      console.error('❌ Erreur modification mot de passe:', error);
      
      if (error.code === 'functions/not-found' || 
          error.code === 'functions/unavailable') {
        addToast({
          type: 'warning',
          title: 'Cloud Functions non disponibles',
          message: 'Déployez les functions ou utilisez la console Firebase'
        });
        setFunctionsAvailable(false);
        return { success: false, error: 'Cloud Functions non disponibles' };
      }
      
      let errorMessage = "Erreur lors de la modification du mot de passe";
      
      switch (error.code) {
        case 'not-found':
          errorMessage = 'Utilisateur non trouvé';
          break;
        case 'invalid-argument':
          errorMessage = 'Le mot de passe est trop faible';
          break;
        case 'permission-denied':
          errorMessage = 'Permission refusée';
          break;
        case 'unauthenticated':
          errorMessage = 'Vous devez être connecté';
          break;
        default:
          errorMessage = error.message || 'Erreur inconnue';
      }

      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  };

  return { 
    users, 
    loading, 
    functionsAvailable,
    addUser, 
    updateUser, 
    deleteUser,
    activateUser,
    resetPassword,
    updateUserPassword
  };
};