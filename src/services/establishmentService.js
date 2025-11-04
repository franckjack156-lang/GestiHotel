// src/services/establishmentService.js - VERSION MULTI-ÉTABLISSEMENTS
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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'establishments';

export const establishmentService = {
  /**
   * Créer un nouvel établissement
   */
  async create(data, userId) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        name: data.name,
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        
        // Fonctionnalités activées par défaut
        features: data.features || {
          interventions: true,
          rooms: true,
          planning: false,
          analytics: false,
          qrCodes: false,
          templates: false,
          excelImport: false
        },
        
        // Paramètres par défaut
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
      
      console.log('✅ Établissement créé:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erreur création établissement:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupérer tous les établissements
   */
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
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || null
        });
      });
      
      console.log('✅ Établissements chargés:', establishments.length);
      return { success: true, data: establishments };
    } catch (error) {
      console.error('❌ Erreur récupération établissements:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupérer un établissement par ID
   */
  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: 'Établissement non trouvé' };
      }
      
      return { 
        success: true, 
        data: { 
          id: docSnap.id, 
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate?.() || null
        } 
      };
    } catch (error) {
      console.error('❌ Erreur récupération établissement:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupérer plusieurs établissements par leurs IDs
   */
  async getByIds(ids) {
    try {
      if (!ids || ids.length === 0) {
        return { success: true, data: [] };
      }

      // Firestore limite les requêtes "in" à 10 éléments max
      const chunks = [];
      for (let i = 0; i < ids.length; i += 10) {
        chunks.push(ids.slice(i, i + 10));
      }

      const allEstablishments = [];

      for (const chunk of chunks) {
        const q = query(
          collection(db, COLLECTION),
          where('__name__', 'in', chunk)
        );

        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          allEstablishments.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || null
          });
        });
      }

      console.log('✅ Établissements chargés (multi):', allEstablishments.length);
      return { success: true, data: allEstablishments };
    } catch (error) {
      console.error('❌ Erreur récupération établissements multiples:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mettre à jour un établissement
   */
  async update(id, data, userId) {
    try {
      const docRef = doc(db, COLLECTION, id);
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
      
      console.log('✅ Établissement mis à jour:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur MAJ établissement:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Activer/Désactiver un établissement
   */
  async toggleActive(id, userId) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: 'Établissement non trouvé' };
      }

      const currentActive = docSnap.data().active;
      
      await updateDoc(docRef, {
        active: !currentActive,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
      
      console.log('✅ Statut établissement changé:', id, !currentActive);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprimer un établissement
   */
  async delete(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
      
      console.log('✅ Établissement supprimé:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression établissement:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mettre à jour les fonctionnalités d'un établissement
   */
  async updateFeatures(id, features, userId) {
    try {
      const docRef = doc(db, COLLECTION, id);
      
      await updateDoc(docRef, {
        features: features,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
      
      console.log('✅ Fonctionnalités mises à jour:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur MAJ fonctionnalités:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Vérifier si une fonctionnalité est active pour un établissement
   */
  async isFeatureEnabled(establishmentId, featureKey) {
    try {
      const result = await this.getById(establishmentId);
      
      if (!result.success) {
        return false;
      }

      return result.data.features?.[featureKey] === true;
    } catch (error) {
      console.error('❌ Erreur vérification fonctionnalité:', error);
      return false;
    }
  }
};

export default establishmentService;