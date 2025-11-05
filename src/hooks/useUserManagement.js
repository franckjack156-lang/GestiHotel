// src/hooks/useUserManagement.js - VERSION CORRIGÉE
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useUserManagement = () => {
  const { user, loading: authLoading } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const allowedRoles = ['superadmin', 'manager'];
    if (!allowedRoles.includes(user.role)) {
      setError('Accès non autorisé');
      setLoading(false);
      return;
    }

    let q;
    
    // SuperAdmin voit tous les utilisateurs
    if (user.role === 'superadmin') {
      q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
    } 
    // Manager voit uniquement les utilisateurs de son établissement
    else {
      if (!user.establishmentId) {
        setUsers([]);
        setLoading(false);
        return;
      }
      
      q = query(
        collection(db, 'users'),
        where('establishmentId', '==', user.establishmentId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          lastLogin: doc.data().lastLogin?.toDate?.() || null,
          updatedAt: doc.data().updatedAt?.toDate?.() || null
        }));
        
        setUsers(usersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Erreur chargement utilisateurs:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const addUser = async (userData) => {
    try {
      const functions = getFunctions();
      const createUser = httpsCallable(functions, 'createUser');
      
      const result = await createUser({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        phone: userData.phone,
        establishmentId: userData.establishmentId,
        active: userData.active !== undefined ? userData.active : true
      });
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const functions = getFunctions();
      const deleteUserFunc = httpsCallable(functions, 'deleteUser');
      
      await deleteUserFunc({ userId });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      return { success: false, error: error.message };
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateUser(userId, { active: !currentStatus });
      return { success: true };
    } catch (error) {
      console.error('Erreur changement statut:', error);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (userId, newPassword) => {
    try {
      const functions = getFunctions();
      const updatePassword = httpsCallable(functions, 'updateUserPassword');
      
      await updatePassword({ userId, newPassword });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
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
    toggleUserStatus,
    resetPassword
  };
};

export default useUserManagement;