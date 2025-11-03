// src/hooks/useUserManagement.js - VERSION CORRIGÉE
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from '../config/firebase';
import { toast } from '../utils/toast';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ CORRECTION : Vérifier que l'utilisateur est authentifié
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('⚠️ useUserManagement: Utilisateur non connecté, chargement des users ignoré');
      setLoading(false);
      return;
    }

    console.log('🔍 useUserManagement: Chargement des utilisateurs...');
    console.log('👤 User authentifié:', currentUser.email);

    // ✅ Essayer d'abord avec getDocs (une seule lecture)
    const loadUsersOnce = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        
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
        
        console.log('✅ useUserManagement: Utilisateurs chargés:', usersData.length);
        setUsers(usersData);
        setLoading(false);
        
        // ✅ Si ça marche, passer au listener temps réel
        setupRealtimeListener();
        
      } catch (err) {
        console.error('❌ Erreur chargement utilisateurs:', err);
        console.error('   Code:', err.code);
        console.error('   Message:', err.message);
        
        if (err.code === 'permission-denied') {
          setError('Permissions Firestore insuffisantes. Vérifiez les règles Firestore.');
          toast.error('Erreur de permissions', {
            description: 'Impossible de charger les utilisateurs. Vérifiez les règles Firestore.'
          });
        } else {
          setError(err.message);
        }
        
        setLoading(false);
      }
    };

    // ✅ Setup du listener temps réel (si la première lecture fonctionne)
    const setupRealtimeListener = () => {
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
          
          console.log('🔄 useUserManagement: Mise à jour temps réel -', usersData.length, 'users');
          setUsers(usersData);
        },
        (err) => {
          console.error('❌ Erreur listener temps réel:', err);
          // Ne pas bloquer si le listener échoue, on garde les données chargées
        }
      );

      return unsubscribe;
    };

    // Lancer le chargement initial
    loadUsersOnce();

  }, []); // ✅ Pas de dépendances, s'exécute une seule fois

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

  const resetPassword = async (userId, newPassword) => {
    try {
      const functions = getFunctions();
      const updatePasswordFunc = httpsCallable(functions, 'updateUserPassword');
      
      await updatePasswordFunc({ userId, newPassword });

      toast.success('Mot de passe réinitialisé');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur reset password:', error);
      toast.error('Erreur réinitialisation', { description: error.message });
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
    resetPassword
  };
};

export default useUserManagement;