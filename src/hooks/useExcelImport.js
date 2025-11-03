
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  collection, 
  addDoc, 
  getDocs, 
  writeBatch,
  doc,
  serverTimestamp,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useToast } from '../contexts/ToastContext';

export const useExcelImport = (user) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  /**
   * ✅ CORRECTION MAJEURE : Parser de dates Excel robuste
   * Gère tous les formats : Date objects, DD/MM/YYYY, ISO, serial numbers Excel
   */
  const parseExcelDate = (dateValue) => {
    // Si c'est déjà un objet Date valide
    if (dateValue instanceof Date) {
      if (!isNaN(dateValue.getTime())) {
        return dateValue;
      }
    }
    
    // Si c'est un string
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      
      // Format DD/MM/YYYY ou D/M/YYYY
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          
          // Validation de base
          if (year >= 1900 && year <= 2100 && 
              month >= 1 && month <= 12 && 
              day >= 1 && day <= 31) {
            const date = new Date(year, month - 1, day);
            
            // Vérification supplémentaire que la date est valide
            if (date.getMonth() === month - 1 && date.getDate() === day) {
              return date;
            }
          }
        }
      }
      
      // Format ISO (YYYY-MM-DD) ou autres formats standards
      if (trimmed.includes('-')) {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      
      // Si c'est un string qui ressemble à un nombre
      const asNumber = parseFloat(trimmed);
      if (!isNaN(asNumber)) {
        // Continuer avec le traitement des nombres ci-dessous
        dateValue = asNumber;
      }
    }
    
    // Si c'est un nombre (serial date Excel)
    if (typeof dateValue === 'number' && !isNaN(dateValue)) {
      // Excel stocke les dates comme nombre de jours depuis le 1er janvier 1900
      // ATTENTION : Excel a un bug historique - il considère 1900 comme bissextile
      
      // Vérifier que le nombre est dans une plage raisonnable
      // 1 = 01/01/1900, ~45000 = année 2023
      if (dateValue >= 1 && dateValue <= 100000) {
        const excelEpoch = new Date(1899, 11, 30); // 30 décembre 1899
        const msPerDay = 24 * 60 * 60 * 1000;
        
        // Correction pour le bug d'Excel avec 1900 (année bissextile fictive)
        // Si la date serial est > 59 (après le 28 février 1900), on retire 1 jour
        const adjustedSerial = dateValue > 59 ? dateValue - 1 : dateValue;
        const resultDate = new Date(excelEpoch.getTime() + adjustedSerial * msPerDay);
        
        // Vérifier que la date résultante est valide
        if (!isNaN(resultDate.getTime()) && 
            resultDate.getFullYear() >= 1900 && 
            resultDate.getFullYear() <= 2100) {
          return resultDate;
        }
      }
    }
    
    // Fallback : date actuelle avec un warning
    console.warn('⚠️ Date invalide détectée, utilisation de la date actuelle:', dateValue);
    return new Date();
  };

  /**
   * Lire un fichier Excel (.xlsx ou .xls) avec support des dates
   */
  const readExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          
          // ✅ CORRECTION : Activer cellDates pour parser les dates correctement
          const workbook = XLSX.read(data, { 
            type: 'array',
            cellDates: true,  // ⭐ IMPORTANT : Parse les dates en objets Date
            dateNF: 'dd/mm/yyyy'
          });
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir en JSON avec raw: false pour garder le formatage
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,  // Convertir en string sauf pour les dates
            dateNF: 'dd/mm/yyyy',
            cellDates: true  // Important pour les dates
          });
          
          console.log('📖 Fichier Excel lu avec succès:', jsonData.length, 'lignes');
          
          resolve(jsonData);
        } catch (error) {
          console.error('❌ Erreur lecture Excel:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('❌ Erreur FileReader:', error);
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * ✅ CORRECTION MAJEURE : Préserver le créateur original
   * Chercher si le créateur existe dans la base, sinon créer un identifiant externe
   */
  const findOrCreateCreator = async (creatorName) => {
    if (!creatorName || creatorName.trim() === '' || creatorName === 'Import Excel') {
      // Pas de créateur spécifié, utiliser l'importateur
      return {
        creatorId: user?.uid || 'import',
        creatorName: user?.name || 'Import Excel'
      };
    }

    const normalizedName = creatorName.trim();

    try {
      // Chercher si un utilisateur avec ce nom existe
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('name', '==', normalizedName));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Utilisateur trouvé dans la base
        const userDoc = snapshot.docs[0];
        return {
          creatorId: userDoc.id,
          creatorName: userDoc.data().name
        };
      }
      
      // Utilisateur non trouvé, créer un ID externe pour traçabilité
      const externalId = `external_${normalizedName.toLowerCase().replace(/\s+/g, '_')}`;
      
      console.log(`ℹ️ Créateur externe détecté: ${normalizedName} (ID: ${externalId})`);
      
      return {
        creatorId: externalId,
        creatorName: normalizedName
      };
      
    } catch (error) {
      console.error('❌ Erreur recherche créateur:', error);
      // En cas d'erreur, utiliser l'importateur
      return {
        creatorId: user?.uid || 'import',
        creatorName: user?.name || 'Import Excel'
      };
    }
  };

  /**
   * ✅ CORRECTION MAJEURE : Mapper les données avec créateur original préservé
   */
  const mapExcelToFirestore = async (row, user) => {
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

    // ✅ CORRECTION 1 : Utiliser le parser de dates robuste
    const dateValue = row.Date || row.date;
    const parsedDate = parseExcelDate(dateValue);

    // ✅ CORRECTION 2 : Trouver ou créer le créateur original
    const originalCreatorName = (row.Demandeur || row.demandeur || '').trim();
    const creatorInfo = await findOrCreateCreator(originalCreatorName);

    return {
      // Informations de base
      location: (row.Localisation || row.localisation || '').trim(),
      roomType: (row['Type Local'] || row['type_local'] || 'chambre').toLowerCase().trim(),
      
      // Mission
      missionSummary: row.Mission || row.mission || '',
      missionComment: row['Commentaires Mission'] || row['commentaires_mission'] || '',
      missionType: (row['Type Mission'] || row['type_mission'] || '')
        .toLowerCase()
        .trim()
        .replace(/é/g, 'e')
        .replace(/è/g, 'e'),
      
      // Intervention
      interventionType: (row['Type Intervention'] || row['type_intervention'] || 'reparation')
        .toLowerCase()
        .trim(),
      priority: priority,
      status: status,
      
      // Assignation
      assignedToName: (row.Intervenant || row.intervenant || '').trim(),
      assignedTo: '', // À remplir avec l'ID du technicien
      techComment: row['Commentaire Intervenant'] || row['commentaire_intervenant'] || '',
      
      // ✅ CRÉATEUR ORIGINAL (pas l'importateur)
      creator: creatorInfo.creatorId,
      creatorName: creatorInfo.creatorName,
      
      // ✅ TRAÇABILITÉ DE L'IMPORT (qui a importé, quand)
      importedBy: user?.uid,
      importedByName: user?.name,
      importedAt: serverTimestamp(),
      
      // ✅ DATE CORRECTE
      createdAt: parsedDate,
      updatedAt: serverTimestamp(),
      
      // État de la chambre
      roomBlocked: (row.Etat || row.etat || '').toLowerCase().includes('bloqu'),
      
      // Données par défaut
      photos: [],
      messages: [],
      suppliesNeeded: [],
      
      // ✅ HISTORIQUE avec le bon créateur
      history: [{
        id: `history_${Date.now()}_${Math.random()}`,
        status: status,
        date: parsedDate.toISOString(),
        by: creatorInfo.creatorId,  // ⭐ Créateur original
        byName: creatorInfo.creatorName,  // ⭐ Nom original
        comment: `Intervention créée par ${creatorInfo.creatorName} (importée depuis Excel par ${user?.name || 'Import'})`
      }]
    };
  };

  /**
   * Valider les données d'une ligne
   */
  const validateRow = (row, rowNumber) => {
    const errors = [];

    // Champs obligatoires
    const date = row.Date || row.date || '';
    const demandeur = row.Demandeur || row.demandeur || '';
    const typeLocal = row['Type Local'] || row['type_local'] || row['Type de Local'] || '';
    const intervenant = row.Intervenant || row.intervenant || '';
    const statut = row.Statut || row.statut || '';

    if (!date || date.toString().trim() === '') {
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
   * Récupérer les dropdowns existants avec normalisation
   */
  const getExistingDropdowns = async () => {
    try {
      const dropdowns = {
        assignedToName: [],
        location: [],
        roomType: [],
        missionType: [],
        interventionType: [],
        creatorName: []
      };

      // Lire depuis adminData (techniciens)
      const adminDataSnapshot = await getDocs(collection(db, 'adminData'));
      
      adminDataSnapshot.forEach(doc => {
        const data = doc.data();
        
        if (data.type === 'technicians' && data.active !== false && data.name) {
          dropdowns.assignedToName.push(data.name.toLowerCase().trim());
        }
      });

      // Lire depuis dropdownOptions
      const dropdownOptionsSnapshot = await getDocs(collection(db, 'dropdownOptions'));
      
      dropdownOptionsSnapshot.forEach(doc => {
        const data = doc.data();
        
        if (data.category === 'locations' && data.active !== false && data.name) {
          dropdowns.location.push(data.name.toLowerCase().trim());
        }
        else if (data.category === 'roomTypes' && data.active !== false) {
          if (data.value) dropdowns.roomType.push(data.value.toLowerCase().trim());
          if (data.name) dropdowns.roomType.push(data.name.toLowerCase().trim());
        }
        else if (data.category === 'missionTypes' && data.active !== false) {
          if (data.value) dropdowns.missionType.push(data.value.toLowerCase().trim());
          if (data.name) dropdowns.missionType.push(data.name.toLowerCase().trim());
        }
        else if (data.category === 'interventionTypes' && data.active !== false) {
          if (data.value) dropdowns.interventionType.push(data.value.toLowerCase().trim());
          if (data.name) dropdowns.interventionType.push(data.name.toLowerCase().trim());
        }
        else if (data.category === 'creators' && data.active !== false && data.name) {
          dropdowns.creatorName.push(data.name.toLowerCase().trim());
        }
      });

      // Supprimer les doublons
      Object.keys(dropdowns).forEach(key => {
        dropdowns[key] = [...new Set(dropdowns[key])];
      });

      console.log('📊 Dropdowns chargés:', {
        assignedToName: `${dropdowns.assignedToName.length} techniciens`,
        location: `${dropdowns.location.length} localisations`,
        roomType: `${dropdowns.roomType.length} types de local`,
        missionType: `${dropdowns.missionType.length} types de mission`,
        interventionType: `${dropdowns.interventionType.length} types d'intervention`,
        creatorName: `${dropdowns.creatorName.length} créateurs`
      });

      return dropdowns;
    } catch (error) {
      console.error('❌ Erreur récupération dropdowns:', error);
      return {
        assignedToName: [],
        location: [],
        roomType: [],
        missionType: [],
        interventionType: [],
        creatorName: []
      };
    }
  };

  /**
   * Analyser les données sans les importer
   */
  const analyzeImportData = async (file) => {
    try {
      console.log('📖 Analyse du fichier Excel...');
      const rawData = await readExcelFile(file);

      console.log('📊 Données brutes lues:', rawData.length, 'lignes');
      
      if (rawData.length > 0) {
        console.log('🔍 Colonnes détectées:', Object.keys(rawData[0]));
        console.log('🔍 Première ligne (aperçu):', {
          Date: rawData[0].Date || rawData[0].date,
          Demandeur: rawData[0].Demandeur || rawData[0].demandeur,
          Localisation: rawData[0].Localisation || rawData[0].localisation
        });
      }

      if (rawData.length === 0) {
        throw new Error('Aucune donnée à analyser');
      }

      const existingDropdowns = await getExistingDropdowns();
      const parsedData = [];
      const errors = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2;

        const rowErrors = validateRow(row, rowNumber);
        if (rowErrors.length > 0) {
          console.warn(`⚠️ Erreurs ligne ${rowNumber}:`, rowErrors);
          errors.push(...rowErrors);
          continue;
        }

        // ✅ CORRECTION : mapExcelToFirestore est maintenant async
        const mapped = await mapExcelToFirestore(row, user);
        if (mapped) {
          parsedData.push(mapped);
        }
      }

      console.log(`📦 Analyse terminée: ${parsedData.length} lignes valides, ${errors.length} erreurs`);

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
      const techniciansRef = collection(db, 'adminData');
      const snapshot = await getDocs(techniciansRef);
      
      const normalizedSearch = technicianName.toLowerCase().trim();
      let technicianId = null;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'technicians' && 
            data.name && 
            data.name.toLowerCase().trim() === normalizedSearch) {
          technicianId = doc.id;
        }
      });

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
      console.error('❌ Erreur recherche technicien:', error);
      return null;
    }
  };

  /**
   * Créer les nouvelles valeurs approuvées dans les bonnes collections
   */
  const createApprovedDropdownValues = async (approvedNewValues) => {
    if (!approvedNewValues || Object.keys(approvedNewValues).length === 0) {
      console.log('⏭️ Aucune nouvelle valeur à créer');
      return;
    }

    const batch = writeBatch(db);
    const adminDataRef = collection(db, 'adminData');
    const dropdownOptionsRef = collection(db, 'dropdownOptions');
    let createdCount = 0;

    // Techniciens → adminData
    if (approvedNewValues.assignedToName && Array.isArray(approvedNewValues.assignedToName)) {
      for (const techName of approvedNewValues.assignedToName) {
        const newTechRef = doc(adminDataRef);
        batch.set(newTechRef, {
          name: techName.trim(),
          type: 'technicians',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        console.log(`✅ Nouveau technicien: ${techName}`);
        createdCount++;
      }
    }

    // Localisations → dropdownOptions
    if (approvedNewValues.location && Array.isArray(approvedNewValues.location)) {
      for (const locName of approvedNewValues.location) {
        const newLocRef = doc(dropdownOptionsRef);
        batch.set(newLocRef, {
          name: locName.trim(),
          category: 'locations',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        console.log(`✅ Nouvelle localisation: ${locName}`);
        createdCount++;
      }
    }

    // Types de local → dropdownOptions
    if (approvedNewValues.roomType && Array.isArray(approvedNewValues.roomType)) {
      for (const roomType of approvedNewValues.roomType) {
        const newRoomTypeRef = doc(dropdownOptionsRef);
        batch.set(newRoomTypeRef, {
          name: roomType.charAt(0).toUpperCase() + roomType.slice(1).toLowerCase(),
          value: roomType.toLowerCase().trim().replace(/\s+/g, '-'),
          category: 'roomTypes',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        console.log(`✅ Nouveau type de local: ${roomType}`);
        createdCount++;
      }
    }

    // Types de mission → dropdownOptions
    if (approvedNewValues.missionType && Array.isArray(approvedNewValues.missionType)) {
      for (const missionType of approvedNewValues.missionType) {
        const newMissionTypeRef = doc(dropdownOptionsRef);
        batch.set(newMissionTypeRef, {
          name: missionType.charAt(0).toUpperCase() + missionType.slice(1).toLowerCase(),
          value: missionType.toLowerCase().trim().replace(/\s+/g, '-'),
          category: 'missionTypes',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        console.log(`✅ Nouveau type de mission: ${missionType}`);
        createdCount++;
      }
    }

    // Types d'intervention → dropdownOptions
    if (approvedNewValues.interventionType && Array.isArray(approvedNewValues.interventionType)) {
      for (const interventionType of approvedNewValues.interventionType) {
        const newInterventionTypeRef = doc(dropdownOptionsRef);
        batch.set(newInterventionTypeRef, {
          name: interventionType.charAt(0).toUpperCase() + interventionType.slice(1).toLowerCase(),
          value: interventionType.toLowerCase().trim().replace(/\s+/g, '-'),
          category: 'interventionTypes',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        console.log(`✅ Nouveau type d'intervention: ${interventionType}`);
        createdCount++;
      }
    }

    // Créateurs → dropdownOptions
    if (approvedNewValues.creatorName && Array.isArray(approvedNewValues.creatorName)) {
      for (const creatorName of approvedNewValues.creatorName) {
        const newCreatorRef = doc(dropdownOptionsRef);
        batch.set(newCreatorRef, {
          name: creatorName.trim(),
          category: 'creators',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        console.log(`✅ Nouveau créateur: ${creatorName}`);
        createdCount++;
      }
    }

    if (createdCount > 0) {
      await batch.commit();
      console.log(`✅ ${createdCount} nouvelle(s) valeur(s) créée(s)`);
    }
  };

  /**
   * Importer les données (version avec validation)
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

      // Cas 1 : Données pré-validées
      if (Array.isArray(fileOrData)) {
        interventionsToImport = fileOrData;
        console.log(`📦 Import de ${interventionsToImport.length} interventions pré-validées`);
      } 
      // Cas 2 : Fichier Excel
      else {
        console.log('📖 Lecture du fichier Excel...');
        const rawData = await readExcelFile(fileOrData);
        const totalRows = rawData.length;

        console.log('📊 Données lues:', totalRows, 'lignes');

        if (totalRows === 0) {
          throw new Error('Aucune donnée à importer');
        }

        const errorDetails = [];
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          const rowNumber = i + 2;

          const rowErrors = validateRow(row, rowNumber);
          if (rowErrors.length > 0) {
            errorDetails.push(...rowErrors);
            continue;
          }

          // ✅ mapExcelToFirestore est maintenant async
          const mapped = await mapExcelToFirestore(row, user);
          if (mapped) {
            interventionsToImport.push(mapped);
          }

          setProgress(Math.round(((i + 1) / totalRows) * 30));
        }
      }

      // Créer les nouvelles valeurs approuvées
      console.log('➕ Création des nouvelles valeurs approuvées...');
      await createApprovedDropdownValues(approvedNewValues);

      // Importer les interventions
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
      
      let errorMessage = 'Une erreur est survenue lors de l\'import.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission refusée. Vérifiez vos droits Firestore.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporairement indisponible. Réessayez.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addToast({
        type: 'error',
        title: 'Erreur import',
        message: errorMessage,
        duration: 8000
      });

      return { success: false, error: errorMessage };
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  /**
   * Supprimer toutes les interventions
   */
  const deleteAllInterventions = async () => {
    if (!user || (user.role !== 'superadmin' && user.role !== 'manager')) {
      addToast({
        type: 'error',
        title: 'Permission refusée',
        message: 'Seuls les admins peuvent supprimer toutes les interventions'
      });
      return { success: false, error: 'Permission refusée' };
    }

    setDeleting(true);

    try {
      const interventionsRef = collection(db, 'interventions');
      const q = query(interventionsRef);
      const snapshot = await getDocs(q);

      console.log(`🗑️ Suppression de ${snapshot.size} interventions...`);

      const batch = writeBatch(db);
      let deleted = 0;

      snapshot.forEach((docSnapshot) => {
        batch.delete(doc(db, 'interventions', docSnapshot.id));
        deleted++;
      });

      await batch.commit();

      addToast({
        type: 'success',
        title: 'Suppression réussie',
        message: `${deleted} intervention(s) supprimée(s)`
      });

      return { success: true, deleted };

    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la suppression.';
      
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

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Interventions');

    const columnWidths = [
      { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 10 },
      { wch: 30 }, { wch: 40 }, { wch: 20 }, { wch: 40 },
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }
    ];
    worksheet['!cols'] = columnWidths;

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