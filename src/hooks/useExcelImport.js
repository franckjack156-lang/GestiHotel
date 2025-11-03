// src/hooks/useExcelImport.js - VERSION PROPRE
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  collection, 
  addDoc, 
  getDocs, 
  writeBatch,
  doc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from '../utils/toast'; // ✨ NOUVEAU

export const useExcelImport = (user) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);

  /**
   * Parser de dates Excel robuste
   */
  const parseExcelDate = (dateValue) => {
    if (dateValue instanceof Date) {
      if (!isNaN(dateValue.getTime())) {
        return dateValue;
      }
    }
    
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      
      // Format DD/MM/YYYY
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          
          if (year >= 1900 && year <= 2100 && 
              month >= 1 && month <= 12 && 
              day >= 1 && day <= 31) {
            const date = new Date(year, month - 1, day);
            
            if (date.getMonth() === month - 1 && date.getDate() === day) {
              return date;
            }
          }
        }
      }
      
      // Format ISO
      if (trimmed.includes('-')) {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      
      // Tentative de parsing direct
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    // Serial number Excel (1 = 1er janvier 1900)
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
      
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    console.warn('⚠️ Date invalide:', dateValue);
    return new Date();
  };

  /**
   * Lire le fichier Excel
   */
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lecture fichier'));
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Trouver ou créer un technicien
   */
  const findOrCreateTechnician = async (technicianName) => {
    if (!technicianName || technicianName.trim() === '') {
      return null;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('name', '==', technicianName.trim()),
        where('role', '==', 'technician')
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur recherche technicien:', error);
      return null;
    }
  };

  /**
   * Trouver ou créer un créateur
   */
  const findOrCreateCreator = async (creatorName) => {
    if (!creatorName || creatorName.trim() === '') {
      return {
        creatorId: user?.uid || 'import',
        creatorName: user?.name || 'Import'
      };
    }

    try {
      const dropdownsRef = collection(db, 'dropdownOptions');
      const q = query(
        dropdownsRef,
        where('category', '==', 'creators'),
        where('name', '==', creatorName.trim())
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const creator = snapshot.docs[0].data();
        return {
          creatorId: snapshot.docs[0].id,
          creatorName: creator.name
        };
      }

      return {
        creatorId: user?.uid || 'import',
        creatorName: creatorName.trim()
      };
    } catch (error) {
      console.error('❌ Erreur recherche créateur:', error);
      return {
        creatorId: user?.uid || 'import',
        creatorName: creatorName.trim()
      };
    }
  };

  /**
   * Mapper Excel vers Firestore
   */
  const mapExcelToFirestore = async (row, user) => {
    const parsedDate = parseExcelDate(row.Date || row.date);
    
    const creatorName = (row.Demandeur || row.demandeur || '').trim();
    const creatorInfo = await findOrCreateCreator(creatorName);

    const rawStatus = (row.Statut || row.statut || 'À faire').toLowerCase().trim();
    let status = 'todo';
    if (rawStatus.includes('termin') || rawStatus.includes('complet')) {
      status = 'completed';
    } else if (rawStatus.includes('cours') || rawStatus.includes('progress')) {
      status = 'in-progress';
    }

    const rawPriority = (row.Priorité || row.priorite || row.Priority || 'Normale').toLowerCase().trim();
    let priority = 'medium';
    if (rawPriority.includes('urgent') || rawPriority.includes('haute') || rawPriority.includes('high')) {
      priority = 'high';
    } else if (rawPriority.includes('basse') || rawPriority.includes('low')) {
      priority = 'low';
    }

    return {
      // Localisation
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
      assignedTo: '',
      techComment: row['Commentaire Intervenant'] || row['commentaire_intervenant'] || '',
      
      // Créateur original
      creator: creatorInfo.creatorId,
      creatorName: creatorInfo.creatorName,
      
      // Traçabilité import
      importedBy: user?.uid,
      importedByName: user?.name,
      importedAt: serverTimestamp(),
      
      // Dates
      createdAt: parsedDate,
      updatedAt: serverTimestamp(),
      
      // État chambre
      roomBlocked: (row.Etat || row.etat || '').toLowerCase().includes('bloqu'),
      
      // Données par défaut
      photos: [],
      messages: [],
      suppliesNeeded: [],
      
      // Historique
      history: [{
        id: `history_${Date.now()}_${Math.random()}`,
        status: status,
        date: parsedDate.toISOString(),
        by: creatorInfo.creatorId,
        byName: creatorInfo.creatorName,
        comment: `Intervention créée par ${creatorInfo.creatorName} (importée depuis Excel par ${user?.name || 'Import'})`
      }]
    };
  };

  /**
   * Valider une ligne
   */
  const validateRow = (row, rowNumber) => {
    const errors = [];

    const date = row.Date || row.date || '';
    const demandeur = row.Demandeur || row.demandeur || '';
    const typeLocal = row['Type Local'] || row['type_local'] || '';
    const intervenant = row.Intervenant || row.intervenant || '';
    const statut = row.Statut || row.statut || '';

    if (!date || date.toString().trim() === '') {
      errors.push(`Ligne ${rowNumber}: Date manquante`);
    }

    if (!demandeur || demandeur.toString().trim() === '') {
      errors.push(`Ligne ${rowNumber}: Demandeur manquant`);
    }

    if (!typeLocal || typeLocal.toString().trim() === '') {
      errors.push(`Ligne ${rowNumber}: Type de local manquant`);
    }

    return errors;
  };

  /**
   * Analyser les données pour validation
   */
  const analyzeImportData = async (file) => {
    try {
      const rawData = await readExcelFile(file);
      
      if (rawData.length === 0) {
        throw new Error('Aucune donnée à importer');
      }

      const parsedData = [];
      const errors = [];
      const newValues = {
        location: new Set(),
        roomType: new Set(),
        missionType: new Set(),
        interventionType: new Set(),
        priority: new Set(),
        creatorName: new Set()
      };

      // Charger les valeurs existantes
      const existingDropdowns = {
        locations: [],
        roomTypes: [],
        missionTypes: [],
        interventionTypes: [],
        priorities: [],
        creators: []
      };

      const dropdownsSnapshot = await getDocs(collection(db, 'dropdownOptions'));
      dropdownsSnapshot.forEach(doc => {
        const data = doc.data();
        const category = data.category;
        if (category && existingDropdowns[category]) {
          existingDropdowns[category].push(data.name || data.value);
        }
      });

      // Parser les données
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2;

        const rowErrors = validateRow(row, rowNumber);
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          continue;
        }

        const mapped = await mapExcelToFirestore(row, user);
        parsedData.push(mapped);

        // Détecter nouvelles valeurs
        if (mapped.location && !existingDropdowns.locations.includes(mapped.location)) {
          newValues.location.add(mapped.location);
        }
        if (mapped.roomType && !existingDropdowns.roomTypes.includes(mapped.roomType)) {
          newValues.roomType.add(mapped.roomType);
        }
        if (mapped.missionType && !existingDropdowns.missionTypes.includes(mapped.missionType)) {
          newValues.missionType.add(mapped.missionType);
        }
        if (mapped.interventionType && !existingDropdowns.interventionTypes.includes(mapped.interventionType)) {
          newValues.interventionType.add(mapped.interventionType);
        }
        if (mapped.creatorName && !existingDropdowns.creators.includes(mapped.creatorName)) {
          newValues.creatorName.add(mapped.creatorName);
        }
      }

      return {
        success: true,
        parsedData,
        newValues,
        existingDropdowns,
        errors
      };

    } catch (error) {
      console.error('❌ Erreur analyse:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  /**
   * Créer les nouvelles valeurs approuvées
   */
  const createApprovedDropdownValues = async (approvedNewValues) => {
    const batch = writeBatch(db);
    const dropdownOptionsRef = collection(db, 'dropdownOptions');
    let createdCount = 0;

    // Localisations
    if (approvedNewValues.location && Array.isArray(approvedNewValues.location)) {
      for (const location of approvedNewValues.location) {
        const newLocationRef = doc(dropdownOptionsRef);
        batch.set(newLocationRef, {
          name: location.trim(),
          category: 'locations',
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || 'Import'
        });
        createdCount++;
      }
    }

    // Types de chambres
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
        createdCount++;
      }
    }

    // Types de mission
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
        createdCount++;
      }
    }

    // Types d'intervention
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
        createdCount++;
      }
    }

    // Créateurs
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
        createdCount++;
      }
    }

    if (createdCount > 0) {
      await batch.commit();
      console.log(`✅ ${createdCount} nouvelle(s) valeur(s) créée(s)`);
    }
  };

  /**
   * Importer les données
   */
  const importData = async (fileOrData, approvedNewValues = {}) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return { success: false, error: 'Non authentifié' };
    }

    if (user.role !== 'superadmin' && user.role !== 'manager') {
      toast.error('Seuls les admins peuvent importer des données');
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

        // Commit par lots de 450
        if ((i + 1) % 450 === 0) {
          await batch.commit();
          console.log(`✅ Lot de ${i + 1} interventions importées`);
        }
      }

      // Commit final
      await batch.commit();

      setProgress(100);

      toast.success(`${imported} intervention(s) importée(s) avec succès`);

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
      
      toast.error(errorMessage, { duration: 8000 });

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
      toast.error('Seuls les admins peuvent supprimer toutes les interventions');
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

      toast.success(`${deleted} intervention(s) supprimée(s)`);

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

      toast.error(errorMessage, { duration: 8000 });

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

    toast.success('Template téléchargé');
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