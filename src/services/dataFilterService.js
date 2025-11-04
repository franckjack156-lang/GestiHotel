// src/services/dataFilterService.js
// Service pour filtrer automatiquement les données par établissement
import { 
  collection, 
  query, 
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

class DataFilterService {
  
  /**
   * Récupérer les données filtrées par établissement
   */
  async getFilteredData(collectionName, establishmentId, additionalFilters = []) {
    try {
      if (!establishmentId) {
        console.warn('⚠️ Pas d\'établissement spécifié pour le filtrage');
        return { success: false, data: [], error: 'Établissement requis' };
      }

      console.log(`🔍 Récupération ${collectionName} pour établissement:`, establishmentId);

      const filters = [
        where('establishmentId', '==', establishmentId),
        ...additionalFilters
      ];

      const q = query(collection(db, collectionName), ...filters);
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`✅ ${data.length} ${collectionName} récupérés`);
      return { success: true, data };

    } catch (error) {
      console.error(`❌ Erreur récupération ${collectionName}:`, error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Récupérer les dropdownOptions par établissement et catégorie
   */
  async getDropdownOptions(establishmentId, category = null) {
    try {
      if (!establishmentId) {
        return { success: false, data: [], error: 'Établissement requis' };
      }

      const filters = [where('establishmentId', '==', establishmentId)];
      
      if (category) {
        filters.push(where('category', '==', category));
      }

      const q = query(collection(db, 'dropdownOptions'), ...filters);
      const snapshot = await getDocs(q);

      const options = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const cat = data.category;
        
        if (!options[cat]) {
          options[cat] = [];
        }
        
        options[cat].push({
          id: doc.id,
          ...data
        });
      });

      console.log(`✅ Options dropdown chargées pour ${establishmentId}:`, Object.keys(options));
      return { success: true, data: options };

    } catch (error) {
      console.error('❌ Erreur récupération dropdowns:', error);
      return { success: false, data: {}, error: error.message };
    }
  }

  /**
   * Récupérer les adminData par établissement et type
   */
  async getAdminData(establishmentId, type = null) {
    try {
      if (!establishmentId) {
        return { success: false, data: {}, error: 'Établissement requis' };
      }

      const filters = [where('establishmentId', '==', establishmentId)];
      
      if (type) {
        filters.push(where('type', '==', type));
      }

      const q = query(collection(db, 'adminData'), ...filters);
      const snapshot = await getDocs(q);

      const data = {};
      
      snapshot.docs.forEach(doc => {
        const itemData = doc.data();
        const itemType = itemData.type;
        
        if (!data[itemType]) {
          data[itemType] = [];
        }
        
        data[itemType].push({
          id: doc.id,
          ...itemData
        });
      });

      console.log(`✅ Admin data chargées pour ${establishmentId}:`, Object.keys(data));
      return { success: true, data };

    } catch (error) {
      console.error('❌ Erreur récupération admin data:', error);
      return { success: false, data: {}, error: error.message };
    }
  }

  /**
   * Ajouter une donnée avec l'établissement
   */
  async addWithEstablishment(collectionName, data, establishmentId, userId) {
    try {
      if (!establishmentId) {
        return { success: false, error: 'Établissement requis' };
      }

      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        establishmentId,
        createdAt: serverTimestamp(),
        createdBy: userId,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });

      console.log(`✅ ${collectionName} créé avec établissement:`, docRef.id);
      return { success: true, id: docRef.id };

    } catch (error) {
      console.error(`❌ Erreur création ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour une donnée (vérifie l'établissement)
   */
  async updateWithEstablishment(collectionName, docId, data, establishmentId, userId) {
    try {
      if (!establishmentId) {
        return { success: false, error: 'Établissement requis' };
      }

      // On ne change JAMAIS l'establishmentId d'une donnée existante
      const updateData = { ...data };
      delete updateData.establishmentId;

      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });

      console.log(`✅ ${collectionName} mis à jour:`, docId);
      return { success: true };

    } catch (error) {
      console.error(`❌ Erreur mise à jour ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer une donnée (vérifie l'établissement)
   */
  async deleteWithEstablishment(collectionName, docId, establishmentId) {
    try {
      if (!establishmentId) {
        return { success: false, error: 'Établissement requis' };
      }

      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);

      console.log(`✅ ${collectionName} supprimé:`, docId);
      return { success: true };

    } catch (error) {
      console.error(`❌ Erreur suppression ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Migrer une donnée existante vers un établissement
   */
  async migrateToEstablishment(collectionName, docId, establishmentId, userId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        establishmentId,
        migratedAt: serverTimestamp(),
        migratedBy: userId
      });

      console.log(`✅ ${collectionName} migré vers établissement:`, docId);
      return { success: true };

    } catch (error) {
      console.error(`❌ Erreur migration ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }
}

export const dataFilterService = new DataFilterService();
export default dataFilterService;