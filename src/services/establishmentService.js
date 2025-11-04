// src/services/establishmentService.js
import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'establishments';

export const establishmentService = {
  async create(data, userId) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        features: data.features || {
          interventions: true,
          rooms: true,
          planning: false,
          analytics: false,
          qrCodes: false,
          templates: false,
          excelImport: false
        },
        settings: data.settings || {
          timezone: 'Europe/Paris',
          currency: 'EUR',
          language: 'fr'
        },
        active: data.active !== undefined ? data.active : true,
        createdAt: serverTimestamp(),
        createdBy: userId,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erreur création établissement:', error);
      return { success: false, error: error.message };
    }
  },

  async getAll() {
    try {
      const q = query(
        collection(db, COLLECTION),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const establishments = [];
      
      snapshot.forEach(doc => {
        establishments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, data: establishments };
    } catch (error) {
      console.error('Erreur récupération établissements:', error);
      return { success: false, error: error.message };
    }
  },

  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: 'Établissement non trouvé' };
      }
      
      return { 
        success: true, 
        data: { id: docSnap.id, ...docSnap.data() } 
      };
    } catch (error) {
      console.error('Erreur récupération établissement:', error);
      return { success: false, error: error.message };
    }
  },

  async getActive() {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('active', '==', true),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const establishments = [];
      
      snapshot.forEach(doc => {
        establishments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, data: establishments };
    } catch (error) {
      console.error('Erreur récupération établissements actifs:', error);
      return { success: false, error: error.message };
    }
  },

  async update(id, data, userId) {
    try {
      const docRef = doc(db, COLLECTION, id);
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour établissement:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression établissement:', error);
      return { success: false, error: error.message };
    }
  },

  async toggleActive(id, userId) {
    try {
      const result = await this.getById(id);
      if (!result.success) return result;
      
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        active: !result.data.active,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur toggle active établissement:', error);
      return { success: false, error: error.message };
    }
  },

  async updateFeatures(id, features, userId) {
    try {
      const docRef = doc(db, COLLECTION, id);
      
      await updateDoc(docRef, {
        features,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour fonctionnalités:', error);
      return { success: false, error: error.message };
    }
  }
};