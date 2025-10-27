import { 
  collection, 
  doc,
  getDocs, 
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../Config/firebase';
import { offlineService } from './offlineService';

export const syncService = {
  /**
   * Synchroniser toutes les données utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Array} localInterventions - Interventions locales
   * @returns {Promise<{success: boolean, synced?: number, error?: string}>}
   */
  async syncAllData(userId, localInterventions = []) {
    try {
      let syncedCount = 0;

      // 1. Synchroniser les actions en attente
      const pendingActions = offlineService.loadPendingActions();
      
      if (pendingActions.length > 0) {
        for (const action of pendingActions) {
          const result = await this.executePendingAction(action, userId);
          if (result.success) {
            offlineService.removePendingAction(action.id);
            syncedCount++;
          }
        }
      }

      // 2. Synchroniser les interventions locales
      const localOnly = this.getLocalOnlyInterventions(localInterventions);
      
      if (localOnly.length > 0) {
        for (const intervention of localOnly) {
          const result = await this.syncIntervention(intervention, userId);
          if (result.success) {
            syncedCount++;
          }
        }
      }

      // 3. Récupérer les données du serveur
      await this.fetchServerData(userId);

      // 4. Mettre à jour le timestamp de dernière synchro
      await this.updateLastSyncTimestamp(userId);

      return { success: true, synced: syncedCount };
    } catch (error) {
      console.error('Erreur syncAllData:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Exécuter une action en attente
   * @param {object} action - L'action à exécuter
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async executePendingAction(action, userId) {
    try {
      switch (action.type) {
        case 'ADD_INTERVENTION':
          return await this.syncIntervention(action.data, userId);
          
        case 'UPDATE_INTERVENTION':
          return await this.updateInterventionOnServer(action.interventionId, action.updates, userId);
          
        case 'DELETE_INTERVENTION':
          return await this.deleteInterventionOnServer(action.interventionId, userId);
          
        case 'TOGGLE_ROOM_BLOCK':
          return await this.toggleRoomBlockOnServer(action.room, action.reason, userId);
          
        default:
          console.warn('Type d\'action inconnu:', action.type);
          return { success: false, error: 'Type d\'action inconnu' };
      }
    } catch (error) {
      console.error('Erreur executePendingAction:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Synchroniser une intervention
   * @param {object} intervention - L'intervention à synchroniser
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async syncIntervention(intervention, userId) {
    try {
      const interventionRef = doc(collection(db, 'interventions'));
      
      const interventionData = {
        ...intervention,
        syncedAt: serverTimestamp(),
        syncedBy: userId
      };

      await setDoc(interventionRef, interventionData);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur syncIntervention:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mettre à jour une intervention sur le serveur
   * @param {string} interventionId - ID de l'intervention
   * @param {object} updates - Mises à jour
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateInterventionOnServer(interventionId, updates, userId) {
    try {
      const interventionRef = doc(db, 'interventions', interventionId);
      
      await updateDoc(interventionRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur updateInterventionOnServer:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprimer une intervention sur le serveur
   * @param {string} interventionId - ID de l'intervention
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteInterventionOnServer(interventionId, userId) {
    try {
      const interventionRef = doc(db, 'interventions', interventionId);
      
      // Soft delete
      await updateDoc(interventionRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: userId
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur deleteInterventionOnServer:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Basculer le blocage d'une chambre sur le serveur
   * @param {string} room - Numéro de chambre
   * @param {string} reason - Raison du blocage
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async toggleRoomBlockOnServer(room, reason, userId) {
    try {
      const roomRef = doc(collection(db, 'blockedRooms'));
      
      await setDoc(roomRef, {
        room,
        reason,
        blocked: true,
        blockedAt: serverTimestamp(),
        blockedBy: userId
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur toggleRoomBlockOnServer:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupérer les données du serveur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async fetchServerData(userId) {
    try {
      // Récupérer les interventions
      const interventionsQuery = query(
        collection(db, 'interventions'),
        where('assignedTo', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const interventionsSnapshot = await getDocs(interventionsQuery);
      const interventions = [];
      
      interventionsSnapshot.forEach((doc) => {
        interventions.push({ id: doc.id, ...doc.data() });
      });

      // Sauvegarder localement pour le mode hors ligne
      offlineService.saveData('offlineInterventions', interventions);

      // Récupérer les chambres bloquées
      const blockedRoomsQuery = query(
        collection(db, 'blockedRooms'),
        where('blocked', '==', true)
      );
      
      const blockedRoomsSnapshot = await getDocs(blockedRoomsQuery);
      const blockedRooms = [];
      
      blockedRoomsSnapshot.forEach((doc) => {
        blockedRooms.push({ id: doc.id, ...doc.data() });
      });

      offlineService.saveData('offlineBlockedRooms', blockedRooms);

      return { 
        success: true, 
        data: { interventions, blockedRooms } 
      };
    } catch (error) {
      console.error('Erreur fetchServerData:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mettre à jour le timestamp de dernière synchronisation
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<void>}
   */
  async updateLastSyncTimestamp(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastSync: serverTimestamp()
      });
      
      // Sauvegarder également localement
      offlineService.saveData('lastSyncTimestamp', new Date().toISOString());
    } catch (error) {
      console.error('Erreur updateLastSyncTimestamp:', error);
    }
  },

  /**
   * Obtenir les interventions uniquement locales
   * @param {Array} interventions - Toutes les interventions
   * @returns {Array}
   */
  getLocalOnlyInterventions(interventions) {
    return interventions.filter(intervention => {
      return intervention.id && intervention.id.startsWith('local_');
    });
  },

  /**
   * Résoudre les conflits entre données locales et serveur
   * @param {object} localData - Données locales
   * @param {object} serverData - Données serveur
   * @returns {object}
   */
  resolveConflicts(localData, serverData) {
    // Stratégie : le plus récent gagne
    const localTimestamp = new Date(localData.updatedAt || localData.createdAt);
    const serverTimestamp = new Date(serverData.updatedAt || serverData.createdAt);

    return localTimestamp > serverTimestamp ? localData : serverData;
  },

  /**
   * Synchronisation par lot (batch)
   * @param {Array} operations - Tableau d'opérations
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async batchSync(operations) {
    try {
      const batch = writeBatch(db);
      
      for (const operation of operations) {
        const { type, ref, data } = operation;
        
        switch (type) {
          case 'set':
            batch.set(ref, data);
            break;
          case 'update':
            batch.update(ref, data);
            break;
          case 'delete':
            batch.delete(ref);
            break;
          default:
            console.warn('Type d\'opération inconnu:', type);
        }
      }

      await batch.commit();
      
      return { success: true };
    } catch (error) {
      console.error('Erreur batchSync:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Vérifier si une synchronisation est nécessaire
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<boolean>}
   */
  async needsSync(userId) {
    const pendingActions = offlineService.loadPendingActions();
    
    if (pendingActions.length > 0) {
      return true;
    }

    const lastSyncStr = offlineService.loadData('lastSyncTimestamp');
    
    if (!lastSyncStr) {
      return true;
    }

    const lastSync = new Date(lastSyncStr);
    const now = new Date();
    const hoursSinceLastSync = (now - lastSync) / (1000 * 60 * 60);

    // Synchroniser si plus de 1 heure depuis la dernière synchro
    return hoursSinceLastSync > 1;
  }
};