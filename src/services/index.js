// src/services/index.js - SERVICE UNIFIÉ CENTRALISÉ CORRIGÉ
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  getDoc,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { db, storage, auth } from '../config/firebase';

// ==========================================
// 🔐 AUTH SERVICE
// ==========================================
export const authService = {
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await this.getUserData(userCredential.user.uid);
      
      if (!userData) {
        await signOut(auth);
        return { 
          success: false, 
          error: 'Utilisateur non trouvé dans la base de données' 
        };
      }

      if (!userData.active) {
        await signOut(auth);
        return { 
          success: false, 
          error: 'Compte désactivé. Contactez l\'administrateur.' 
        };
      }

      return { 
        success: true, 
        user: { ...userData, uid: userCredential.user.uid } 
      };
    } catch (error) {
      console.error('Erreur login:', error);
      
      let errorMessage = 'Erreur de connexion';
      
      switch (error.code) {
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
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Erreur logout:', error);
      return { success: false, error: error.message };
    }
  },

  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return null;
    }
  },

  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser() {
    return auth.currentUser;
  }
};

// ==========================================
// 👥 USER SERVICE
// ==========================================
export const userService = {
  async getAll(establishmentId = null) {
    try {
      let q;
      
      if (establishmentId) {
        q = query(
          collection(db, 'users'),
          where('establishmentId', '==', establishmentId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      return [];
    }
  },

  async getById(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return null;
    }
  },

  async update(userId, data) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(userId) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==========================================
// 🏢 ESTABLISHMENT SERVICE
// ==========================================
export const establishmentService = {
  async getAll() {
    try {
      const q = query(
        collection(db, 'establishments'),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur récupération établissements:', error);
      return [];
    }
  },

  async getById(establishmentId) {
    try {
      const estabDoc = await getDoc(doc(db, 'establishments', establishmentId));
      if (estabDoc.exists()) {
        return { id: estabDoc.id, ...estabDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération établissement:', error);
      return null;
    }
  },

  async create(data) {
    try {
      const docRef = await addDoc(collection(db, 'establishments'), {
        ...data,
        createdAt: serverTimestamp(),
        active: true
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erreur création établissement:', error);
      return { success: false, error: error.message };
    }
  },

  async update(establishmentId, data) {
    try {
      await updateDoc(doc(db, 'establishments', establishmentId), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour établissement:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(establishmentId) {
    try {
      await deleteDoc(doc(db, 'establishments', establishmentId));
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression établissement:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==========================================
// 🔧 TECHNICIAN SERVICE
// ==========================================
export const technicianService = {
  async getAll(establishmentId = null) {
    try {
      let q;
      
      if (establishmentId) {
        q = query(
          collection(db, 'technicians'),
          where('establishmentId', '==', establishmentId),
          where('active', '==', true),
          orderBy('name', 'asc')
        );
      } else {
        q = query(
          collection(db, 'technicians'),
          where('active', '==', true),
          orderBy('name', 'asc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur récupération techniciens:', error);
      return [];
    }
  },

  async getById(technicianId) {
    try {
      const techDoc = await getDoc(doc(db, 'technicians', technicianId));
      if (techDoc.exists()) {
        return { id: techDoc.id, ...techDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération technicien:', error);
      return null;
    }
  },

  async findByName(name, establishmentId = null) {
    try {
      let q;
      
      if (establishmentId) {
        q = query(
          collection(db, 'technicians'),
          where('name', '==', name),
          where('establishmentId', '==', establishmentId),
          where('active', '==', true)
        );
      } else {
        q = query(
          collection(db, 'technicians'),
          where('name', '==', name),
          where('active', '==', true)
        );
      }

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Erreur recherche technicien:', error);
      return null;
    }
  },

  async create(data) {
    try {
      const docRef = await addDoc(collection(db, 'technicians'), {
        ...data,
        createdAt: serverTimestamp(),
        active: true
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erreur création technicien:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==========================================
// 📍 LOCATION SERVICE
// ==========================================
export const locationService = {
  async getAll(establishmentId = null) {
    try {
      let q;
      
      if (establishmentId) {
        q = query(
          collection(db, 'locations'),
          where('establishmentId', '==', establishmentId),
          where('active', '==', true),
          orderBy('name', 'asc')
        );
      } else {
        q = query(
          collection(db, 'locations'),
          where('active', '==', true),
          orderBy('name', 'asc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur récupération localisations:', error);
      return [];
    }
  },

  async create(data) {
    try {
      const docRef = await addDoc(collection(db, 'locations'), {
        ...data,
        createdAt: serverTimestamp(),
        active: true
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erreur création localisation:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==========================================
// 📸 STORAGE SERVICE
// ==========================================
export const storageService = {
  async uploadFile(path, file) {
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return { success: true, url };
    } catch (error) {
      console.error('Erreur upload fichier:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteFile(url) {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      return { success: false, error: error.message };
    }
  }
};

export default {
  auth: authService,
  user: userService,
  establishment: establishmentService,
  technician: technicianService,
  location: locationService,
  storage: storageService
};