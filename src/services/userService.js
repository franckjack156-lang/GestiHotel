import { 
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../Config/firebase';

export const userService = {
  // Créer un utilisateur via Cloud Function
  async createUser(userData, currentUser) {
    try {
      const functions = getFunctions();
      const createUserFunction = httpsCallable(functions, 'createUser');
      
      const result = await createUserFunction({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        phone: userData.phone
      });

      return { 
        success: true, 
        userId: result.data.userId,
        message: result.data.message
      };
    } catch (error) {
      throw new Error(`Erreur création utilisateur: ${error.message}`);
    }
  },

  // Mettre à jour un utilisateur
  async updateUser(userId, updates, currentUser) {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
        updatedByName: currentUser.name
      };

      await updateDoc(doc(db, 'users', userId), updateData);
      return { success: true };
    } catch (error) {
      throw new Error(`Erreur mise à jour utilisateur: ${error.message}`);
    }
  },

  // Désactiver un utilisateur
  async deactivateUser(userId, currentUser) {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        active: false,
        deletedAt: serverTimestamp(),
        deletedBy: currentUser.uid,
        deletedByName: currentUser.name
      });
      
      return { success: true };
    } catch (error) {
      throw new Error(`Erreur désactivation utilisateur: ${error.message}`);
    }
  },

  // Réactiver un utilisateur
  async activateUser(userId, currentUser) {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        active: true,
        reactivatedAt: serverTimestamp(),
        reactivatedBy: currentUser.uid,
        reactivatedByName: currentUser.name
      });
      
      return { success: true };
    } catch (error) {
      throw new Error(`Erreur activation utilisateur: ${error.message}`);
    }
  },

  // Réinitialiser le mot de passe
  async resetPassword(userId) {
    try {
      const functions = getFunctions();
      const resetPasswordFunction = httpsCallable(functions, 'resetUserPassword');
      
      const result = await resetPasswordFunction({ userId });
      return { success: true, tempPassword: result.data.tempPassword };
    } catch (error) {
      throw new Error(`Erreur réinitialisation mot de passe: ${error.message}`);
    }
  }
};