// src/services/index.js - SERVICE UNIFIÉ CENTRALISÉ
import { 
  collection, addDoc, updateDoc, doc, deleteDoc,
  serverTimestamp, arrayUnion, query, where, getDocs, getDoc
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
  /**
   * Connexion utilisateur
   */
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
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Déconnexion
   */
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Erreur logout:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupérer les données utilisateur depuis Firestore
   */
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

  /**
   * Listener d'état d'authentification
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser() {
    return auth.currentUser;
  }
};

// ==========================================
// 🔥 INTERVENTIONS SERVICE
// ==========================================
export const interventionService = {
  async create(data, user) {
    const intervention = {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      createdByName: user.name || user.email,
      status: 'todo',
      photos: [],
      messages: [],
      history: [{
        id: `history_${Date.now()}`,
        status: 'todo',
        date: new Date(),
        by: user.uid,
        byName: user.name || user.email,
        comment: 'Intervention créée',
        fields: []
      }]
    };

    const docRef = await addDoc(collection(db, 'interventions'), intervention);
    return { success: true, id: docRef.id };
  },

  async update(id, updates, user) {
    await updateDoc(doc(db, 'interventions', id), {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid
    });
    return { success: true };
  },

  async delete(id) {
    await deleteDoc(doc(db, 'interventions', id));
    return { success: true };
  },

  async addMessage(id, message, user) {
    const interventionRef = doc(db, 'interventions', id);
    const interventionSnap = await getDoc(interventionRef);
    
    if (!interventionSnap.exists()) {
      throw new Error('Intervention non trouvée');
    }

    const currentData = interventionSnap.data();
    const currentMessages = currentData.messages || [];

    const newMessage = {
      id: `msg_${Date.now()}`,
      text: message,
      type: 'text',
      senderId: user.uid,
      senderName: user.name || user.email,
      timestamp: new Date(),
      read: false
    };

    await updateDoc(interventionRef, {
      messages: [...currentMessages, newMessage],
      updatedAt: serverTimestamp(),
      updatedBy: user.uid
    });

    return { success: true };
  }
};

// ==========================================
// 👤 USERS SERVICE
// ==========================================
export const userService = {
  async create(userData) {
    try {
      const functions = getFunctions();
      const createUserFn = httpsCallable(functions, 'createUser');
      const result = await createUserFn(userData);
      return { success: true, userId: result.data.userId };
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  async update(userId, updates, currentUser) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(userId) {
    try {
      const functions = getFunctions();
      const deleteUserFn = httpsCallable(functions, 'deleteUser');
      await deleteUserFn({ userId });
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  async deactivate(userId, currentUser) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        active: false,
        deletedAt: serverTimestamp(),
        deletedBy: currentUser.uid
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur désactivation utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  async updatePassword(userId, data) {
    try {
      const functions = getFunctions();
      const updatePasswordFn = httpsCallable(functions, 'updateUserPassword');
      await updatePasswordFn({ 
        userId, 
        newPassword: data.newPassword || data.password 
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      return { success: false, error: error.message };
    }
  }
};

// ==========================================
// 📁 STORAGE SERVICE
// ==========================================
export const storageService = {
  async upload(file, path, onProgress) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return { success: true, url };
    } catch (error) {
      console.error('Erreur upload:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      return { success: false, error: error.message };
    }
  },

  async uploadMultiple(files, basePath) {
    try {
      const uploads = files.map((file, index) => {
        const path = `${basePath}/${Date.now()}_${index}_${file.name}`;
        return this.upload(file, path);
      });
      const results = await Promise.all(uploads);
      
      // Filtrer les uploads réussis
      const successfulUploads = results.filter(r => r.success);
      const urls = successfulUploads.map(r => r.url);
      
      return { success: true, urls };
    } catch (error) {
      console.error('Erreur upload multiple:', error);
      return { success: false, error: error.message, urls: [] };
    }
  },

  validate(file, maxSize = 5 * 1024 * 1024) {
    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux (max: ${maxSize / 1024 / 1024}MB)`);
    }
    
    // Vérifier le type de fichier (images uniquement)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou GIF.');
    }
    
    return true;
  }
};

// ==========================================
// 💾 OFFLINE & SYNC SERVICE
// ==========================================
export const syncService = {
  // Stockage local
  saveLocal(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde locale:', error);
    }
  },

  loadLocal(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Erreur chargement local:', error);
      return defaultValue;
    }
  },

  // Actions en attente
  savePendingAction(action) {
    const pending = this.loadLocal('pendingActions', []);
    pending.push({ 
      ...action, 
      id: `pending_${Date.now()}`, 
      timestamp: new Date().toISOString() 
    });
    this.saveLocal('pendingActions', pending);
  },

  getPendingActions() {
    return this.loadLocal('pendingActions', []);
  },

  clearPendingActions() {
    this.saveLocal('pendingActions', []);
  },

  removePendingAction(actionId) {
    const pending = this.getPendingActions();
    const filtered = pending.filter(a => a.id !== actionId);
    this.saveLocal('pendingActions', filtered);
  },

  // Synchronisation
  async syncAll(userId, interventions = []) {
    const pending = this.getPendingActions();
    let synced = 0;
    let errors = [];

    for (const action of pending) {
      try {
        await this.executeAction(action, userId);
        this.removePendingAction(action.id);
        synced++;
      } catch (error) {
        console.error('Erreur sync action:', error);
        errors.push({ action, error: error.message });
      }
    }

    return { success: true, synced, errors };
  },

  async executeAction(action, userId) {
    // Implémentation basée sur action.type
    switch (action.type) {
      case 'ADD_INTERVENTION':
        return await interventionService.create(action.data, { uid: userId });
      case 'UPDATE_INTERVENTION':
        return await interventionService.update(action.id, action.updates, { uid: userId });
      case 'ADD_MESSAGE':
        return await interventionService.addMessage(action.interventionId, action.message, { uid: userId });
      default:
        throw new Error('Type d\'action inconnu');
    }
  }
};

// ==========================================
// 📊 DATA SERVICE (Dropdowns & Admin Options)
// ==========================================
export const dataService = {
  async addItem(category, data, user) {
    const isDropdown = ['roomTypes', 'locations', 'missionTypes', 'interventionTypes', 'priorities', 'departments', 'creators'].includes(category);
    const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';

    const itemData = {
      ...data,
      ...(isDropdown ? { category } : { type: category }),
      active: true,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      createdByName: user.name
    };

    const docRef = await addDoc(collection(db, collectionName), itemData);
    return { success: true, id: docRef.id };
  },

  async updateItem(category, itemId, updates, user) {
    const isDropdown = ['roomTypes', 'locations', 'missionTypes', 'interventionTypes', 'priorities', 'departments', 'creators'].includes(category);
    const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';

    await updateDoc(doc(db, collectionName, itemId), {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid
    });
    return { success: true };
  },

  async deleteItem(category, itemId) {
    const isDropdown = ['roomTypes', 'locations', 'missionTypes', 'interventionTypes', 'priorities', 'departments', 'creators'].includes(category);
    const collectionName = isDropdown ? 'dropdownOptions' : 'adminData';

    await deleteDoc(doc(db, collectionName, itemId));
    return { success: true };
  },

  async checkIfUsed(category, itemId) {
    // Vérifier si l'item est utilisé dans des interventions
    const q = query(collection(db, 'interventions'));
    const snapshot = await getDocs(q);
    
    let isUsed = false;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (category === 'locations' && data.location === itemId) isUsed = true;
      if (category === 'technicians' && data.assignedTo === itemId) isUsed = true;
    });
    
    return isUsed;
  }
};

// Export par défaut
export default {
  auth: authService,
  intervention: interventionService,
  user: userService,
  storage: storageService,
  sync: syncService,
  data: dataService
};