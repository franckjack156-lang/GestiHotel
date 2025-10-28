import React, { useState } from 'react';
import { useExcelImport } from '../../hooks/useExcelImport';
import { useAuth } from '../../contexts/AuthContext';

import { Upload, Download, Trash2, FileSpreadsheet, AlertTriangle, CheckCircle, Loader, Database, RefreshCw, Info, X } from 'lucide-react';

const ExcelImportSystem = () => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Télécharger le template Excel
  const downloadTemplate = () => {
    const template = `Date,Demandeur,Localisation,Etat,Mission,Commentaires Mission,Intervenant,Commentaire Intervenant,Statut,Type Local,Type Mission,Type Intervention,Priorité
2024-01-15,Réception,Chambre 101,Libre,Fuite robinet,Le robinet de la salle de bain fuit,Jean Dupont,Réparation effectuée,Terminée,chambre,plomberie,reparation,high
2024-01-16,Ménage,Suite 205,Bloquée,Climatisation bruyante,Client se plaint du bruit,Marie Martin,En cours de diagnostic,En cours,suite,climatisation,maintenance-preventive,urgent
2024-01-17,Direction,Couloir Etage 2,Libre,Ampoule grillée,Ampoule du couloir à remplacer,Pierre Durand,,À faire,couloir,electricite,reparation,normal`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_interventions.csv';
    link.click();
  };

  // Gérer la sélection du fichier
  const handleFileSelect = (e) => {
  const selectedFile = e.target.files[0];
  if (selectedFile) {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (validExtensions.includes(extension)) {
      setFile(selectedFile);
      setResults(null);
    } else {
      alert('Veuillez sélectionner un fichier CSV ou Excel (.xlsx, .xls)');
    }
  }
};

  // Parser le CSV
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
    
    return data;
  };

  // Mapper les données Excel vers le format Firestore
  const mapExcelToFirestore = (row) => {
    const statusMap = {
      'À faire': 'todo',
      'En cours': 'inprogress',
      'En commande': 'ordering',
      'Terminée': 'completed',
      'Annulée': 'cancelled'
    };

    return {
      // Informations de base
      location: row.Localisation || '',
      roomType: row['Type Local'] || 'chambre',
      
      // Mission
      missionSummary: row.Mission || '',
      missionComment: row['Commentaires Mission'] || '',
      missionType: row['Type Mission'] || '',
      
      // Intervention
      interventionType: row['Type Intervention'] || 'reparation',
      priority: row['Priorité'] || 'normal',
      status: statusMap[row.Statut] || 'todo',
      
      // Assignation
      assignedToName: row.Intervenant || '',
      techComment: row['Commentaire Intervenant'] || '',
      
      // Créateur
      creatorName: row.Demandeur || 'Import Excel',
      
      // Dates
      createdAt: row.Date ? new Date(row.Date) : new Date(),
      
      // État de la chambre
      roomBlocked: row.Etat === 'Bloquée',
      
      // Métadonnées
      importedAt: new Date(),
      importedBy: 'admin',
      photos: [],
      messages: [],
      suppliesNeeded: [],
      history: [{
        id: `history_${Date.now()}`,
        status: statusMap[row.Statut] || 'todo',
        date: row.Date ? new Date(row.Date).toISOString() : new Date().toISOString(),
        by: 'import',
        byName: 'Import Excel',
        comment: 'Intervention importée depuis Excel'
      }]
    };
  };

  // Importer les données
  const handleImport = async () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      // Lire le fichier
      const text = await file.text();
      const rawData = parseCSV(text);
      
      console.log('📊 Données brutes:', rawData);
      
      // Simuler l'import (à remplacer par vrai code Firestore)
      const totalRows = rawData.length;
      const imported = [];
      const errors = [];
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        
        try {
          const interventionData = mapExcelToFirestore(row);
          
          // Validation basique
          if (!interventionData.location || !interventionData.missionSummary) {
            errors.push({
              row: i + 2,
              data: row,
              error: 'Localisation ou Mission manquante'
            });
            continue;
          }
          
          // ICI: Ajouter le code Firebase réel
          // await addDoc(collection(db, 'interventions'), interventionData);
          
          imported.push(interventionData);
          
          // Mettre à jour la progression
          setProgress(Math.round(((i + 1) / totalRows) * 100));
          
          // Simuler un délai
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          errors.push({
            row: i + 2,
            data: row,
            error: error.message
          });
        }
      }
      
      setResults({
        success: imported.length,
        errors: errors.length,
        total: totalRows,
        errorDetails: errors
      });
      
    } catch (error) {
      console.error('❌ Erreur import:', error);
      alert('Erreur lors de l\'import: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  // Supprimer toutes les données
  const handleDeleteAll = async () => {
    setDeleting(true);
    
    try {
      // ICI: Ajouter le code Firebase réel pour supprimer
      // const interventionsRef = collection(db, 'interventions');
      // const snapshot = await getDocs(interventionsRef);
      // const batch = writeBatch(db);
      // snapshot.forEach((doc) => {
      //   batch.delete(doc.ref);
      // });
      // await batch.commit();
      
      // Simuler la suppression
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('✅ Toutes les interventions ont été supprimées');
      setShowConfirmDelete(false);
      setResults(null);
      setFile(null);
      
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-indigo-100 p-4 rounded-xl">
              <FileSpreadsheet className="text-indigo-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Import Excel - Interventions
              </h1>
              <p className="text-gray-600 mt-1">
                Importez vos données depuis un fichier Excel ou CSV
              </p>
            </div>
          </div>

          {/* Info importante */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">⚠️ Important</p>
              <p>Cette opération remplacera TOUTES les interventions existantes. Assurez-vous d'avoir une sauvegarde avant de continuer.</p>
            </div>
          </div>
        </div>

        {/* Actions principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Télécharger le template */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Download className="text-green-600" size={24} />
              <h3 className="font-semibold text-gray-800">1. Télécharger le template</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Téléchargez le fichier exemple avec toutes les colonnes nécessaires
            </p>
            <button
              onClick={downloadTemplate}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Télécharger le template
            </button>
          </div>

          {/* Supprimer toutes les données */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="text-red-600" size={24} />
              <h3 className="font-semibold text-gray-800">2. Nettoyer la base</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Supprimez toutes les interventions existantes avant l'import
            </p>
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={deleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 size={20} />
                  Supprimer tout
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload et import */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="text-indigo-600" size={24} />
            <h3 className="font-semibold text-gray-800 text-lg">3. Importer le fichier</h3>
          </div>

          {/* Zone de drop */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileSpreadsheet className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-2">
                Cliquez pour sélectionner un fichier
              </p>
              <p className="text-sm text-gray-500">
                CSV ou Excel (.xlsx) - Max 10 MB
              </p>
            </label>
          </div>

          {/* Fichier sélectionné */}
          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="text-blue-600" size={24} />
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Format des colonnes */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Info className="text-gray-600" size={18} />
              <h4 className="font-semibold text-gray-800">Colonnes requises</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span>Date</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span>Demandeur</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span>Localisation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span>Etat</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span>Mission</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span>Commentaires Mission</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span>Intervenant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span>Statut</span>
              </div>
            </div>
          </div>

          {/* Bouton import */}
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader className="animate-spin" size={20} />
                Import en cours... {progress}%
              </>
            ) : (
              <>
                <Upload size={20} />
                Importer les données
              </>
            )}
          </button>
        </div>

        {/* Résultats */}
        {results && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Résultats de l'import
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="font-semibold text-green-800">Réussies</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {results.success}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-red-600" size={20} />
                  <span className="font-semibold text-red-800">Erreurs</span>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {results.errors}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="text-blue-600" size={20} />
                  <span className="font-semibold text-blue-800">Total</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {results.total}
                </p>
              </div>
            </div>

            {/* Détails des erreurs */}
            {results.errorDetails && results.errorDetails.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-3">
                  Détails des erreurs
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.errorDetails.map((error, index) => (
                    <div key={index} className="bg-white rounded p-3 text-sm">
                      <p className="font-medium text-gray-800">
                        Ligne {error.row}
                      </p>
                      <p className="text-red-600">{error.error}</p>
                      <p className="text-gray-600 text-xs mt-1">
                        {JSON.stringify(error.data)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de confirmation suppression */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Confirmation de suppression
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer <strong>TOUTES</strong> les interventions ?
                Cette action est <strong>irréversible</strong>.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelImportSystem;