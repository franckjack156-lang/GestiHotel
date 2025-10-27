// src/hooks/useUsers.js
import { useState, useEffect } from 'react';
import { db, auth } from '../Config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const useUsers = (roleFilter = null) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    let q = roleFilter 
      ? query(usersRef, where('role', '==', roleFilter), orderBy('createdAt', 'desc'))
      : query(usersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
        setLoading(false);
      },
      (err) => {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roleFilter]);

  const addUser = async (userData) => {
    try {
      setError(null);
      
      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );

      // Ajouter les informations dans Firestore
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        phone: userData.phone || '',
        status: userData.status || 'active',
        specialties: userData.specialties || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, uid: userCredential.user.uid };
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      setError(null);
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      setError(null);
      // Note: Supprimer un utilisateur de Firebase Auth nécessite des privilèges admin
      // Cette fonction supprime seulement les données Firestore
      await deleteDoc(doc(db, 'users', userId));
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setError(null);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const getTechnicians = async () => {
    try {
      const q = query(
        collection(db, 'users'), 
        where('role', '==', 'technician'),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Erreur lors de la récupération des techniciens:', err);
      return [];
    }
  };

  const getUsersByRole = async (role) => {
    try {
      const q = query(
        collection(db, 'users'), 
        where('role', '==', role),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs par rôle:', err);
      return [];
    }
  };

  const getUserStats = () => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      superAdmin: users.filter(u => u.role === 'super_admin').length,
      manager: users.filter(u => u.role === 'manager').length,
      reception: users.filter(u => u.role === 'reception').length,
      technician: users.filter(u => u.role === 'technician').length
    };
  };

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getTechnicians,
    getUsersByRole,
    getUserStats
  };
};