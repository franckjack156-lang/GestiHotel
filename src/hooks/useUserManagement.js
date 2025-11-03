// src/hooks/useUserManagement.js - VERSION PROPRE
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
import { toast } from '../utils/toast'; // ✨ NOUVEAU

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      toast.success(`${userData.name} créé avec succès`);
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

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      toast.success('Utilisateur mis à jour');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur update:', error);
      toast.error('Erreur lors de la mise à jour', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const functions = getFunctions();
      const deleteUserFunc = httpsCallable(functions, 'deleteUser');
      
      await deleteUserFunc({ userId });

      toast.success('Utilisateur supprimé');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur lors de la suppression', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const activateUser = async (userId, active) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        active,
        updatedAt: serverTimestamp()
      });

      toast.success(active ? 'Utilisateur activé' : 'Utilisateur désactivé');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur activation:', error);
      toast.error('Erreur', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (userId) => {
    try {
      const functions = getFunctions();
      const resetPasswordFunc = httpsCallable(functions, 'resetUserPassword');
      
      await resetPasswordFunc({ userId });

      toast.success('Email de réinitialisation envoyé');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur reset password:', error);
      toast.error('Erreur lors de la réinitialisation', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateUserPassword = async (userId, newPassword) => {
    try {
      const functions = getFunctions();
      const updatePasswordFunc = httpsCallable(functions, 'updateUserPassword');
      
      await updatePasswordFunc({ userId, newPassword });

      toast.success('Mot de passe mis à jour');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur update password:', error);
      toast.error('Erreur lors de la mise à jour', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    activateUser,
    resetPassword,
    updateUserPassword
  };
};