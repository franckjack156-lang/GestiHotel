import { 
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../Config/firebase';

export const interventionService = {
  // Créer une intervention
  async createIntervention(interventionData, user) {
    try {
      const intervention = {
        ...interventionData,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email,
        status: 'todo',
        photos: [],
        suppliesNeeded: [],
        messages: [],
        history: [{ 
          status: 'todo', 
          date: new Date().toISOString(), 
          by: user.uid,
          byName: user.name || user.email,
          comment: 'Intervention créée'
        }],
        priority: interventionData.priority || 'normal',
        estimatedDuration: interventionData.estimatedDuration || 60,
        actualDuration: 0,
        costEstimate: interventionData.costEstimate || 0,
        actualCost: 0
      };

      const docRef = await addDoc(collection(db, 'interventions'), intervention);
      return { success: true, id: docRef.id };
    } catch (error) {
      throw new Error(`Erreur création intervention: ${error.message}`);
    }
  },

  // Mettre à jour une intervention
  async updateIntervention(interventionId, updates, user) {
    try {
      const interventionRef = doc(db, 'interventions', interventionId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: user.name || user.email
      };

      await updateDoc(interventionRef, updateData);
      return { success: true };
    } catch (error) {
      throw new Error(`Erreur mise à jour intervention: ${error.message}`);
    }
  },

  // Uploader une photo
  async uploadPhoto(file, interventionId) {
    try {
      const storageRef = ref(storage, `interventions/${interventionId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, url: downloadURL };
    } catch (error) {
      throw new Error(`Erreur upload photo: ${error.message}`);
    }
  },

  // Ajouter un message à une intervention
  async addMessage(interventionId, message, user) {
    try {
      const interventionRef = doc(db, 'interventions', interventionId);
      const messageData = {
        text: message,
        type: 'text',
        senderId: user.uid,
        senderName: user.name || user.email,
        timestamp: serverTimestamp(),
        read: false
      };

      await updateDoc(interventionRef, {
        messages: arrayUnion(messageData),
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Erreur ajout message: ${error.message}`);
    }
  },

  // Supprimer une intervention
  async deleteIntervention(interventionId) {
    try {
      await deleteDoc(doc(db, 'interventions', interventionId));
      return { success: true };
    } catch (error) {
      throw new Error(`Erreur suppression intervention: ${error.message}`);
    }
  }
};