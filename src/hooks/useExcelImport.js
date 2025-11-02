// src/hooks/useExcelImport.js - VERSION CORRIGÉE
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
   * Récupérer les dropdowns existants depuis Firestore
   */
  const getExistingDropdowns = async () => {
    try {
      const adminDataSnapshot = await getDocs(collection(db, 'adminData'));
      
      const dropdowns = {
        assignedTo: [],
        locations: [],
        roomTypes: [],
        missionTypes: [],
        interventionTypes: []
      };

      adminDataSnapshot.forEach(doc => {
        const data = doc.data();
        
        if (data.type === 'technicians' && data.active !== false) {
          dropdowns.assignedTo.push(data.name);
        } else if (data.type === 'locations') {
          dropdowns.locations.push(data.name);
        } else if (data.type === 'roomTypes') {
          dropdowns.roomTypes.push({ value: data.value, label: data.name });
        } else if (data.type === 'missionTypes') {
          dropdowns.missionTypes.push({ value: data.value, label: data.name });
        } else if (data.type === 'interventionTypes') {
          dropdowns.interventionTypes.push({ value: data.value, label: data.name });
        }
      });

      return dropdowns;
    } catch (error) {
      console.error('Erreur récupération dropdowns:', error);
      return {
        assignedTo: [],
        locations: [],
        roomTypes: [],
        missionTypes: [],
        interventionTypes: []
      };
    }
  };

  /**
   * Analyser les données sans les importer
   * Retourne les données parsées + les nouvelles valeurs détectées
   */
  const analyzeImportData = async (file) => {
    try {
      // Lire le fichier
      console.log('📖 Analyse du fichier Excel...');
      const rawData = await readExcelFile(file);

      console.log('📊 Données brutes lues:', rawData.length, 'lignes');
      
      // ✅ DEBUG : Afficher la première ligne pour voir les colonnes
      if (rawData.length > 0) {
        console.log('🔍 Colonnes détectées:', Object.keys(rawData[0]));
        console.log('🔍 Première ligne:', rawData[0]);
      }

      if (rawData.length === 0) {
        throw new Error('Aucune donnée à analyser');
      }

      // Récupérer les dropdowns existants
      const existingDropdowns = await getExistingDropdowns();

      // Parser les données (mais ne pas les importer)
      const parsedData = [];
      const errors = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2; // +2 car ligne 1 = headers

        // Valider la ligne
        const rowErrors = validateRow(row, rowNumber);
        if (rowErrors.length > 0) {
          console.warn(`⚠️ Erreurs ligne ${rowNumber}:`, rowErrors);
          errors.push(...rowErrors);
          continue;
        }

        // Mapper les données
        const mapped = mapExcelToFirestore(row, user);
        if (mapped) {
          parsedData.push(mapped);
          console.log(`✅ Ligne ${rowNumber} mappée:`, {
            location: mapped.location,
            assignedToName: mapped.assignedToName,
            status: mapped.status
          });
        }
      }

      console.log(`📦 Résultat analyse: ${parsedData.length} lignes valides, ${errors.length} erreurs`);

      return {
        success: true,
        parsedData,
        existingDropdowns,
        errors,
        total: rawData.length
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
   * Créer les nouvelles valeurs approuvées dans les dropdowns
   */
  const createApprovedDropdownValues = async (approvedNewValues) => {
    if (!approvedNewValues || Object.keys(approvedNewValues).length === 0) {
      return;
    }

    const batch = writeBatch(db);
    const adminDataRef = collection(db, 'adminData');

    // Techniciens
    if (approvedNewValues.assignedTo) {
      for (const techName of approvedNewValues.assignedTo) {
        const newTechRef = doc(adminDataRef);
        batch.set(newTechRef, {
          name: techName,
          type: 'technicians',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        console.log(`✅ Nouveau technicien approuvé: ${techName}`);
      }
    }

    // Localisations
    if (approvedNewValues.location) {
      for (const locName of approvedNewValues.location) {
        const newLocRef = doc(adminDataRef);
        batch.set(newLocRef, {
          name: locName,
          type: 'locations',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        console.log(`✅ Nouvelle localisation approuvée: ${locName}`);
      }
    }

    // Types de local (roomTypes)
    if (approvedNewValues.roomType) {
      for (const roomType of approvedNewValues.roomType) {
        const newRoomTypeRef = doc(adminDataRef);
        batch.set(newRoomTypeRef, {
          name: roomType,
          value: roomType.toLowerCase().replace(/\s+/g, '-'),
          type: 'roomTypes',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        console.log(`✅ Nouveau type de local approuvé: ${roomType}`);
      }
    }

    // Commit toutes les nouvelles valeurs
    await batch.commit();
  };

  /**
   * Importer les données (version avec validation)
   * @param {File|Array} fileOrData - Fichier Excel OU tableau de données déjà validées
   * @param {Object} approvedNewValues - Nouvelles valeurs approuvées par l'utilisateur
   */
  const importData = async (fileOrData, approvedNewValues = {}) => {
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
      let interventionsToImport = [];

      // Cas 1 : On reçoit un tableau de données pré-validées
      if (Array.isArray(fileOrData)) {
        interventionsToImport = fileOrData;
        console.log(`📦 Import de ${interventionsToImport.length} interventions pré-validées`);
      } 
      // Cas 2 : On reçoit un fichier (ancien comportement)
      else {
        console.log('📖 Lecture du fichier Excel...');
        const rawData = await readExcelFile(fileOrData);
        const totalRows = rawData.length;

        console.log('📊 Données lues:', totalRows, 'lignes');

        if (totalRows === 0) {
          throw new Error('Aucune donnée à importer');
        }

        // Parser et valider
        const errorDetails = [];
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          const rowNumber = i + 2;

          const rowErrors = validateRow(row, rowNumber);
          if (rowErrors.length > 0) {
            errorDetails.push(...rowErrors);
            continue;
          }

          const mapped = mapExcelToFirestore(row, user);
          if (mapped) {
            interventionsToImport.push(mapped);
          }

          setProgress(Math.round(((i + 1) / totalRows) * 30));
        }
      }

      // 1. Créer les nouvelles valeurs approuvées dans les dropdowns
      console.log('➕ Création des nouvelles valeurs approuvées...');
      await createApprovedDropdownValues(approvedNewValues);

      // 2. Importer les interventions
      console.log(`💾 Import de ${interventionsToImport.length} interventions...`);
      
      const batch = writeBatch(db);
      const interventionsRef = collection(db, 'interventions');
      let imported = 0;

      for (let i = 0; i < interventionsToImport.length; i++) {
        const intervention = interventionsToImport[i];
        
        // Trouver ou créer le technicien
        const technicianId = await findOrCreateTechnician(intervention.assignedToName);
        if (technicianId) {
          intervention.assignedTo = technicianId;
        }

        const newInterventionRef = doc(interventionsRef);
        batch.set(newInterventionRef, intervention);
        imported++;

        setProgress(30 + Math.round((i / interventionsToImport.length) * 70));

        // Commit par lots de 450 (limite Firestore = 500)
        if ((i + 1) % 450 === 0) {
          await batch.commit();
          console.log(`✅ Lot de ${i + 1} interventions importées`);
        }
      }

      // Commit final
      await batch.commit();

      setProgress(100);

      addToast({
        type: 'success',
        title: 'Import réussi',
        message: `${imported} intervention(s) importée(s) avec succès`
      });

      return {
        success: true,
        imported,
        total: interventionsToImport.length,
        errors: []
      };

    } catch (error) {
      console.error('❌ Erreur import:', error);
      
      addToast({
        type: 'error',
        title: 'Erreur d\'import',
        message: error.message
      });

      return {
        success: false,
        error: error.message,
        imported: 0
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
    analyzeImportData,
    deleteAllInterventions,
    downloadTemplate
  };
};