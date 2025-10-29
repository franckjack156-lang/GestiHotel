// src/hooks/useExcelImport.js - VERSION AVEC SUPPORT EXCEL COMPLET
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  collection, 
  addDoc, 
  getDocs, 
  writeBatch,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useToast } from '../contexts/ToastContext';

export const useExcelImport = (user) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  /**
   * Lire un fichier Excel (.xlsx ou .xls)
   */
  const readExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Prendre la première feuille
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false, // Garder les dates en format texte
            dateNF: 'dd/mm/yyyy' // Format de date français
          });
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Mapper les données Excel vers le format Firestore
   */
  const mapExcelToFirestore = (row, user) => {
    // Mapping des statuts
    const statusMap = {
      'À faire': 'todo',
      'A faire': 'todo',
      'En cours': 'inprogress',
      'En commande': 'ordering',
      'Terminée': 'completed',
      'Terminee': 'completed',
      'Annulée': 'cancelled',
      'Annulee': 'cancelled'
    };

    // Mapping des priorités
    const priorityMap = {
      'Urgent': 'urgent',
      'Urgente': 'urgent',
      'Haute': 'high',
      'Élevée': 'high',
      'Elevee': 'high',
      'Normale': 'normal',
      'Normal': 'normal',
      'Basse': 'low',
      'Bas': 'low'
    };

    const status = statusMap[row.Statut] || statusMap[row.statut] || 'todo';
    const priority = priorityMap[row.Priorité] || priorityMap[row.priorite] || 'normal';

    // Parser la date (plusieurs formats possibles)
    let parsedDate = new Date();
    const dateStr = row.Date || row.date || '';
    
    if (dateStr) {
      // Format JJ/MM/AAAA
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        parsedDate = new Date(year, month - 1, day);
      }
      // Format AAAA-MM-JJ
      else if (dateStr.includes('-')) {
        parsedDate = new Date(dateStr);
      }
      // Timestamp Excel (nombre de jours depuis 1900)
      else if (!isNaN(dateStr)) {
        const excelEpoch = new Date(1899, 11, 30);
        parsedDate = new Date(excelEpoch.getTime() + parseFloat(dateStr) * 86400000);
      }
    }

    // Validation de la date
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }

    return {
      // Informations de base
      location: row.Localisation || row.localisation || '',
      roomType: (row['Type Local'] || row['type_local'] || 'chambre').toLowerCase(),
      
      // Mission
      missionSummary: row.Mission || row.mission || '',
      missionComment: row['Commentaires Mission'] || row['commentaires_mission'] || '',
      missionType: (row['Type Mission'] || row['type_mission'] || '').toLowerCase().replace(/é/g, 'e').replace(/è/g, 'e'),
      
      // Intervention
      interventionType: (row['Type Intervention'] || row['type_intervention'] || 'reparation').toLowerCase(),
      priority: priority,
      status: status,
      
      // Assignation
      assignedToName: row.Intervenant || row.intervenant || '',
      assignedTo: '', // À remplir avec l'ID du technicien si trouvé
      techComment: row['Commentaire Intervenant'] || row['commentaire_intervenant'] || '',
      
      // Créateur
      creatorName: row.Demandeur || row.demandeur || 'Import Excel',
      createdBy: user?.uid || 'import',
      createdByName: user?.name || 'Import Excel',
      
      // Dates
      createdAt: parsedDate,
      updatedAt: serverTimestamp(),
      
      // État de la chambre
      roomBlocked: (row.Etat || row.etat || '').toLowerCase().includes('bloqu'),
      
      // Données par défaut
      photos: [],
      messages: [],
      suppliesNeeded: [],
      history: [{
        id: `history_${Date.now()}_${Math.random()}`,
        status: status,
        date: parsedDate.toISOString(),
        by: user?.uid || 'import',
        byName: user?.name || 'Import Excel',
        comment: 'Intervention importée depuis Excel'
      }]
    };
  };

  /**
   * Valider les données
   */
  const validateRow = (row, rowNumber) => {
    const errors = [];

    // ✅ Champs obligatoires uniquement
    const date = row.Date || row.date || '';
    const demandeur = row.Demandeur || row.demandeur || '';
    const typeLocal = row['Type Local'] || row['type_local'] || row['Type de Local'] || '';
    const intervenant = row.Intervenant || row.intervenant || '';
    const statut = row.Statut || row.statut || '';

    if (!date || date.trim() === '') {
      errors.push(`Ligne ${rowNumber}: La date est obligatoire`);
    }

    if (!demandeur || demandeur.trim() === '') {
      errors.push(`Ligne ${rowNumber}: Le demandeur est obligatoire`);
    }

    if (!typeLocal || typeLocal.trim() === '') {
      errors.push(`Ligne ${rowNumber}: Le type de local est obligatoire`);
    }

    if (!intervenant || intervenant.trim() === '') {
      errors.push(`Ligne ${rowNumber}: L'intervenant est obligatoire`);
    }

    if (!statut || statut.trim() === '') {
      errors.push(`Ligne ${rowNumber}: Le statut est obligatoire`);
    }

    return errors;
  };

  /**
   * Trouver ou créer un technicien
   */
  const findOrCreateTechnician = async (technicianName) => {
    if (!technicianName || technicianName.trim() === '') {
      return null;
    }

    try {
      // Chercher le technicien dans adminData
      const techniciansRef = collection(db, 'adminData');
      const snapshot = await getDocs(techniciansRef);
      
      let technicianId = null;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'technicians' && 
            data.name.toLowerCase() === technicianName.toLowerCase().trim()) {
          technicianId = doc.id;
        }
      });

      // Si non trouvé, créer le technicien
      if (!technicianId && user) {
        const newTech = await addDoc(collection(db, 'adminData'), {
          name: technicianName.trim(),
          type: 'technicians',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        technicianId = newTech.id;
        
        console.log(`✅ Technicien créé: ${technicianName}`);
      }

      return technicianId;
    } catch (error) {
      console.error('Erreur recherche technicien:', error);
      return null;
    }
  };

  /**
   * Importer les données
   */
  const importData = async (file) => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    if (user.role !== 'superadmin' && user.role !== 'manager') {
      addToast({
        type: 'error',
        title: 'Permission refusée',
        message: 'Seuls les admins peuvent importer des données'
      });
      return { success: false, error: 'Permission refusée' };
    }

    setImporting(true);
    setProgress(0);

    try {
      // Lire le fichier Excel
      console.log('📖 Lecture du fichier Excel...');
      const rawData = await readExcelFile(file);

      console.log('📊 Données lues:', rawData.length, 'lignes');

      if (rawData.length === 0) {
        throw new Error('Aucune donnée à importer');
      }

      const totalRows = rawData.length;
      const imported = [];
      const errors = [];

      // Traiter chaque ligne
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2; // +2 car ligne 1 = headers

        try {
          // Valider la ligne
          const validationErrors = validateRow(row, rowNumber);
          if (validationErrors.length > 0) {
            errors.push({
              row: rowNumber,
              data: row,
              error: validationErrors.join(', ')
            });
            setProgress(Math.round(((i + 1) / totalRows) * 100));
            continue;
          }

          // Mapper les données
          const interventionData = mapExcelToFirestore(row, user);

          // Trouver le technicien
          const technicianName = row.Intervenant || row.intervenant;
          if (technicianName) {
            const technicianId = await findOrCreateTechnician(technicianName);
            if (technicianId) {
              interventionData.assignedTo = technicianId;
            }
          }

          // Ajouter à Firestore
          await addDoc(collection(db, 'interventions'), interventionData);

          imported.push(interventionData);

          // Mettre à jour la progression
          setProgress(Math.round(((i + 1) / totalRows) * 100));

        } catch (error) {
          console.error(`❌ Erreur ligne ${rowNumber}:`, error);
          errors.push({
            row: rowNumber,
            data: row,
            error: error.message
          });
          setProgress(Math.round(((i + 1) / totalRows) * 100));
        }
      }

      // Afficher le résultat
      const message = `Import terminé : ${imported.length}/${totalRows} interventions importées`;
      
      if (errors.length === 0) {
        addToast({
          type: 'success',
          title: 'Import réussi ✅',
          message: message,
          duration: 8000
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Import partiel ⚠️',
          message: `${message}. ${errors.length} erreur(s) détectée(s).`,
          duration: 10000
        });
      }

      return {
        success: true,
        imported: imported.length,
        errors: errors.length,
        total: totalRows,
        errorDetails: errors
      };

    } catch (error) {
      console.error('❌ Erreur import:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur import',
        message: error.message
      });

      return {
        success: false,
        error: error.message
      };
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  /**
   * Supprimer toutes les interventions
   */
  const deleteAllInterventions = async () => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
      return { success: false, error: 'Non authentifié' };
    }

    if (user.role !== 'superadmin') {
      addToast({
        type: 'error',
        title: 'Permission refusée',
        message: 'Seuls les Super Admins peuvent supprimer toutes les données'
      });
      return { success: false, error: 'Permission refusée' };
    }

    setDeleting(true);

    try {
      console.log('🗑️ Démarrage de la suppression...');
      
      const interventionsRef = collection(db, 'interventions');
      const snapshot = await getDocs(interventionsRef);

      console.log(`📊 ${snapshot.size} interventions trouvées`);

      if (snapshot.empty) {
        addToast({
          type: 'info',
          title: 'Aucune donnée',
          message: 'Il n\'y a aucune intervention à supprimer'
        });
        setDeleting(false);
        return { success: true, deleted: 0 };
      }

      // Utiliser batch pour supprimer (max 500 par batch)
      const BATCH_SIZE = 500;
      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      let totalCount = 0;

      snapshot.forEach((document) => {
        currentBatch.delete(doc(db, 'interventions', document.id));
        operationCount++;
        totalCount++;

        // Si on atteint 500 opérations, créer un nouveau batch
        if (operationCount === BATCH_SIZE) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      });

      // Ajouter le dernier batch s'il contient des opérations
      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      console.log(`📦 ${batches.length} batch(es) à exécuter`);

      // Exécuter tous les batches séquentiellement pour éviter les problèmes
      for (let i = 0; i < batches.length; i++) {
        console.log(`⏳ Exécution batch ${i + 1}/${batches.length}...`);
        await batches[i].commit();
      }

      console.log(`✅ ${totalCount} interventions supprimées`);

      addToast({
        type: 'success',
        title: 'Suppression réussie',
        message: `${totalCount} intervention(s) supprimée(s)`,
        duration: 5000
      });

      return { success: true, deleted: totalCount };

    } catch (error) {
      console.error('❌ Erreur suppression:', error);

      let errorMessage = 'Erreur lors de la suppression';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission refusée. Vérifiez vos droits Firestore.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporairement indisponible. Réessayez.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      addToast({
        type: 'error',
        title: 'Erreur suppression',
        message: errorMessage,
        duration: 8000
      });

      return { success: false, error: errorMessage };
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Télécharger le template Excel
   */
  const downloadTemplate = () => {
    // Données d'exemple
    const templateData = [
      {
        'Date': '15/01/2024',
        'Demandeur': 'Réception',
        'Localisation': 'Chambre 101',
        'Etat': 'Libre',
        'Mission': 'Fuite robinet',
        'Commentaires Mission': 'Le robinet de la salle de bain fuit',
        'Intervenant': 'Jean Dupont',
        'Commentaire Intervenant': 'Réparation effectuée',
        'Statut': 'Terminée',
        'Type Local': 'chambre',
        'Type Mission': 'plomberie',
        'Type Intervention': 'reparation',
        'Priorité': 'Haute'
      },
      {
        'Date': '16/01/2024',
        'Demandeur': 'Ménage',
        'Localisation': 'Suite 205',
        'Etat': 'Bloquée',
        'Mission': 'Climatisation bruyante',
        'Commentaires Mission': 'Client se plaint du bruit',
        'Intervenant': 'Marie Martin',
        'Commentaire Intervenant': 'En cours de diagnostic',
        'Statut': 'En cours',
        'Type Local': 'suite',
        'Type Mission': 'climatisation',
        'Type Intervention': 'maintenance-preventive',
        'Priorité': 'Urgent'
      },
      {
        'Date': '17/01/2024',
        'Demandeur': 'Direction',
        'Localisation': 'Couloir Etage 2',
        'Etat': 'Libre',
        'Mission': 'Ampoule grillée',
        'Commentaires Mission': 'Ampoule du couloir à remplacer',
        'Intervenant': 'Pierre Durand',
        'Commentaire Intervenant': '',
        'Statut': 'À faire',
        'Type Local': 'couloir',
        'Type Mission': 'electricite',
        'Type Intervention': 'reparation',
        'Priorité': 'Normale'
      }
    ];

    // Créer le workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Interventions');

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 12 },  // Date
      { wch: 15 },  // Demandeur
      { wch: 20 },  // Localisation
      { wch: 10 },  // Etat
      { wch: 30 },  // Mission
      { wch: 40 },  // Commentaires Mission
      { wch: 20 },  // Intervenant
      { wch: 40 },  // Commentaire Intervenant
      { wch: 12 },  // Statut
      { wch: 15 },  // Type Local
      { wch: 15 },  // Type Mission
      { wch: 20 },  // Type Intervention
      { wch: 12 }   // Priorité
    ];
    worksheet['!cols'] = columnWidths;

    // Télécharger le fichier
    XLSX.writeFile(workbook, `template_interventions_${Date.now()}.xlsx`);

    addToast({
      type: 'success',
      title: 'Template téléchargé',
      message: 'Fichier Excel créé avec succès'
    });
  };

  return {
    importing,
    progress,
    deleting,
    importData,
    deleteAllInterventions,
    downloadTemplate
  };
};