// src/services/index.js - SERVICE UNIFIÉ CENTRALISÉ
import { 
  collection, addDoc, updateDoc, doc, deleteDoc,
  serverTimestamp, arrayUnion, query, where, getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, storage } from '../config/firebase';

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
        status: 'todo',
        date: new Date().toISOString(),
        by: user.uid,
        byName: user.name,
        comment: 'Intervention créée'
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
    await updateDoc(doc(db, 'interventions', id), {
      messages: arrayUnion({
        text: message,
        senderId: user.uid,
        senderName: user.name,
        timestamp: serverTimestamp()
      })
    });
    return { success: true };
  }
};

// ==========================================
// 👤 USERS SERVICE
// ==========================================
export const userService = {
  async create(userData) {
    const functions = getFunctions();
    const createUserFn = httpsCallable(functions, 'createUser');
    const result = await createUserFn(userData);
    return { success: true, userId: result.data.userId };
  },

  async update(userId, updates, currentUser) {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    });
    return { success: true };
  },

  async deactivate(userId, currentUser) {
    await updateDoc(doc(db, 'users', userId), {
      active: false,
      deletedAt: serverTimestamp(),
      deletedBy: currentUser.uid
    });
    return { success: true };
  },

  async updatePassword(userId, newPassword) {
    const functions = getFunctions();
    const updatePasswordFn = httpsCallable(functions, 'updateUserPassword');
    await updatePasswordFn({ userId, newPassword });
    return { success: true };
  }
};

// ==========================================
// 📁 STORAGE SERVICE
// ==========================================
export const storageService = {
  async upload(file, path, onProgress) {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { success: true, url };
  },

  async delete(path) {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true };
  },

  async uploadMultiple(files, basePath) {
    const uploads = files.map(file => {
      const path = `${basePath}/${Date.now()}_${file.name}`;
      return this.upload(file, path);
    });
    const results = await Promise.all(uploads);
    return { success: true, urls: results.map(r => r.url) };
  },

  validate(file, maxSize = 5 * 1024 * 1024) {
    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux (max: ${maxSize / 1024 / 1024}MB)`);
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
    localStorage.setItem(key, JSON.stringify(data));
  },

  loadLocal(key, defaultValue = null) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },

  // Actions en attente
  savePendingAction(action) {
    const pending = this.loadLocal('pendingActions', []);
    pending.push({ ...action, id: `pending_${Date.now()}`, timestamp: new Date().toISOString() });
    this.saveLocal('pendingActions', pending);
  },

  getPendingActions() {
    return this.loadLocal('pendingActions', []);
  },

  clearPendingActions() {
    this.saveLocal('pendingActions', []);
  },

  // Synchronisation
  async syncAll(userId, interventions = []) {
    const pending = this.getPendingActions();
    let synced = 0;

    for (const action of pending) {
      try {
        await this.executeAction(action, userId);
        synced++;
      } catch (error) {
        console.error('Erreur sync action:', error);
      }
    }

    this.clearPendingActions();
    return { success: true, synced };
  },

  async executeAction(action, userId) {
    // Implémentation basée sur action.type
    switch (action.type) {
      case 'ADD_INTERVENTION':
        return await interventionService.create(action.data, { uid: userId });
      case 'UPDATE_INTERVENTION':
        return await interventionService.update(action.id, action.updates, { uid: userId });
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
  intervention: interventionService,
  user: userService,
  storage: storageService,
  sync: syncService,
  data: dataService
};