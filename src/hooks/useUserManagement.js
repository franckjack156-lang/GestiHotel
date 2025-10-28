// src/hooks/useUserManagement.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebase';
import { useToast } from '../contexts/ToastContext';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  // ✅ Écouter les utilisateurs en temps réel
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          usersData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            lastLogin: data.lastLogin?.toDate?.() || null,
            updatedAt: data.updatedAt?.toDate?.() || null
          });
        });
        setUsers(usersData);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Erreur chargement utilisateurs:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ✅ Ajouter un utilisateur (via Cloud Function)
  const addUser = async (userData) => {
    try {
      const functions = getFunctions();
      const createUser = httpsCallable(functions, 'createUser');
      
      const result = await createUser({
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
        message: `${userData.name} a été créé avec succès`
      });

      return { success: true, userId: result.data.userId };
    } catch (error) {
      console.error('❌ Erreur création utilisateur:', error);
      
      let errorMessage = 'Erreur lors de la création';
      
      if (error.code === 'functions/already-exists') {
        errorMessage = 'Un utilisateur avec cet email existe déjà';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'Permission refusée';
      } else if (error.message) {
        errorMessage = error.message;
      }

      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  };

  // ✅ Mettre à jour un utilisateur
  const updateUser = async (userId, updates) => {
    try {
      // Nettoyer les valeurs undefined
      const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      await updateDoc(doc(db, 'users', userId), {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });

      addToast({
        type: 'success',
        title: 'Utilisateur modifié',
        message: 'Les informations ont été mises à jour'
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur modification utilisateur:', error);
      
      let errorMessage = 'Erreur lors de la modification';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission refusée';
      } else if (error.code === 'not-found') {
        errorMessage = 'Utilisateur non trouvé';
      }

      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  };

  // ✅ Désactiver un utilisateur (soft delete)
  const deleteUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        active: false,
        deletedAt: serverTimestamp()
      });

      addToast({
        type: 'success',
        title: 'Utilisateur désactivé',
        message: 'L\'utilisateur ne pourra plus se connecter'
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

  // ✅ Réactiver un utilisateur
  const activateUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        active: true,
        deletedAt: null
      });

      addToast({
        type: 'success',
        title: 'Utilisateur activé',
        message: 'L\'utilisateur peut à nouveau se connecter'
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur activation utilisateur:', error);

      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'activation'
      });

      return { success: false, error: error.message };
    }
  };

  // ✅ Réinitialiser le mot de passe
  const resetPassword = async (userId) => {
    try {
      const functions = getFunctions();
      const resetPasswordFn = httpsCallable(functions, 'resetUserPassword');
      
      const result = await resetPasswordFn({ userId });

      addToast({
        type: 'success',
        title: 'Mot de passe réinitialisé',
        message: 'Un nouveau mot de passe temporaire a été généré'
      });

      return { 
        success: true, 
        tempPassword: result.data.tempPassword 
      };
    } catch (error) {
      console.error('❌ Erreur réinitialisation mot de passe:', error);

      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la réinitialisation du mot de passe'
      });

      return { success: false, error: error.message };
    }
  };

  // ✅ Modifier le mot de passe
  const updateUserPassword = async (userId, newPassword) => {
    try {
      const functions = getFunctions();
      const updatePasswordFn = httpsCallable(functions, 'updateUserPassword');
      
      await updatePasswordFn({ 
        userId, 
        newPassword 
      });

      addToast({
        type: 'success',
        title: 'Mot de passe modifié',
        message: 'Le mot de passe a été changé avec succès'
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur modification mot de passe:', error);

      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la modification du mot de passe'
      });

      return { success: false, error: error.message };
    }
  };

  // ✅ Obtenir les statistiques
  const stats = {
    total: users.length,
    active: users.filter(u => u.active !== false).length,
    inactive: users.filter(u => u.active === false).length,
    byRole: {
      superadmin: users.filter(u => u.role === 'superadmin').length,
      manager: users.filter(u => u.role === 'manager').length,
      technician: users.filter(u => u.role === 'technician').length,
      reception: users.filter(u => u.role === 'reception').length
    }
  };

  return {
    users,
    loading,
    error,
    stats,
    addUser,
    updateUser,
    deleteUser,
    activateUser,
    resetPassword,
    updateUserPassword
  };
};