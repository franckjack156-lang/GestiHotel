import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, CheckCircle, XCircle, Plus, X, 
  FileText, Users, MapPin, Tag, Calendar, Upload
} from 'lucide-react';

/**
 * ImportValidationModal - Validation des données avant import
 * 
 * Permet de :
 * - Prévisualiser les données à importer
 * - Identifier les nouvelles valeurs pour chaque liste déroulante
 * - Approuver/rejeter les nouvelles entrées
 * - Corriger les données avant import
 */
const ImportValidationModal = ({
  isOpen,
  onClose,
  onConfirmImport,
  parsedData = [],
  existingDropdowns = {},
  dropdownFields = ['assignedTo', 'location', 'category', 'subcategory', 'priority']
}) => {
  // ✅ DEBUG : Logs au chargement
  console.log('🔍 ImportValidationModal - Props reçues:', {
    isOpen,
    parsedDataLength: parsedData.length,
    parsedDataSample: parsedData.slice(0, 2),
    existingDropdowns,
    dropdownFields
  });

  const [validatedData, setValidatedData] = useState(parsedData);
  const [approvedNewValues, setApprovedNewValues] = useState({});
  const [currentTab, setCurrentTab] = useState('preview'); // 'preview' | 'newValues'

  // ✅ DEBUG : Logs quand validatedData change
  console.log('🔍 ImportValidationModal - État validatedData:', {
    length: validatedData.length,
    sample: validatedData.slice(0, 2)
  });

  // ✅ AJOUT : Mettre à jour validatedData quand parsedData change
  React.useEffect(() => {
    console.log('🔄 useEffect - parsedData a changé:', parsedData.length);
    setValidatedData(parsedData);
  }, [parsedData]);

  // Analyser les nouvelles valeurs par champ
  const newValuesByField = useMemo(() => {
    const result = {};
    
    dropdownFields.forEach(field => {
      const existingValues = new Set(
        (existingDropdowns[field] || []).map(item => 
          typeof item === 'object' ? item.value : item
        )
      );
      
      const newValues = new Set();
      
      validatedData.forEach(row => {
        const value = row[field];
        if (value && !existingValues.has(value)) {
          newValues.add(value);
        }
      });
      
      result[field] = {
        existing: existingValues.size,
        new: Array.from(newValues),
        approved: approvedNewValues[field] || new Set()
      };
    });
    
    return result;
  }, [validatedData, existingDropdowns, dropdownFields, approvedNewValues]);

  // Statistiques globales
  const stats = useMemo(() => {
    const totalRows = validatedData.length;
    const totalNewValues = Object.values(newValuesByField).reduce(
      (sum, field) => sum + field.new.length, 
      0
    );
    const approvedNewValues = Object.values(newValuesByField).reduce(
      (sum, field) => sum + field.approved.size,
      0
    );
    
    return {
      totalRows,
      totalNewValues,
      approvedNewValues,
      readyToImport: approvedNewValues === totalNewValues
    };
  }, [validatedData, newValuesByField]);

  // Toggle approbation d'une nouvelle valeur
  const toggleApproval = (field, value) => {
    setApprovedNewValues(prev => {
      const fieldApproved = new Set(prev[field] || []);
      
      if (fieldApproved.has(value)) {
        fieldApproved.delete(value);
      } else {
        fieldApproved.add(value);
      }
      
      return {
        ...prev,
        [field]: fieldApproved
      };
    });
  };

  // Approuver tout
  const approveAll = () => {
    const allApproved = {};
    
    Object.keys(newValuesByField).forEach(field => {
      allApproved[field] = new Set(newValuesByField[field].new);
    });
    
    setApprovedNewValues(allApproved);
  };

  // Rejeter tout
  const rejectAll = () => {
    setApprovedNewValues({});
  };

  // Confirmer l'import
  const handleConfirmImport = () => {
    // Filtrer les données pour ne garder que celles avec des valeurs approuvées
    const filteredData = validatedData.filter(row => {
      return dropdownFields.every(field => {
        const value = row[field];
        if (!value) return true; // Valeur vide = OK
        
        // Vérifier si la valeur existe ou est approuvée
        const existingValues = new Set(
          (existingDropdowns[field] || []).map(item => 
            typeof item === 'object' ? item.value : item
          )
        );
        
        if (existingValues.has(value)) return true;
        
        const approvedSet = approvedNewValues[field] || new Set();
        return approvedSet.has(value);
      });
    });
    
    onConfirmImport(filteredData, approvedNewValues);
  };

  // Libellés des champs
  const fieldLabels = {
    assignedTo: 'Intervenants',
    assignedToName: 'Intervenants',
    location: 'Localisations',
    roomType: 'Types de local',
    missionType: 'Types de mission',
    interventionType: 'Types d\'intervention',
    priority: 'Priorités'
  };

  // Icônes des champs
  const fieldIcons = {
    assignedTo: Users,
    assignedToName: Users,
    location: MapPin,
    roomType: Tag,
    missionType: Tag,
    interventionType: Tag,
    priority: AlertCircle
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText size={24} />
                Validation des données d'import
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Vérifiez et approuvez les nouvelles valeurs avant l'import
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-sm text-blue-600 dark:text-blue-400">Lignes à importer</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.totalRows}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <p className="text-sm text-orange-600 dark:text-orange-400">Nouvelles valeurs</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {stats.totalNewValues}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-sm text-green-600 dark:text-green-400">Approuvées</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats.approvedNewValues}
              </p>
            </div>
            <div className={`rounded-lg p-3 ${
              stats.readyToImport 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <p className="text-sm text-gray-600 dark:text-gray-400">Statut</p>
              <p className="text-sm font-bold mt-1 flex items-center gap-1">
                {stats.readyToImport ? (
                  <>
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-green-700 dark:text-green-300">Prêt</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-orange-600" />
                    <span className="text-orange-700 dark:text-orange-300">À valider</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setCurrentTab('preview')}
              className={`px-4 py-2 rounded-lg transition ${
                currentTab === 'preview'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Aperçu des données
            </button>
            <button
              onClick={() => setCurrentTab('newValues')}
              className={`px-4 py-2 rounded-lg transition ${
                currentTab === 'newValues'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Plus size={16} className="inline mr-2" />
              Nouvelles valeurs ({stats.totalNewValues})
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentTab === 'preview' ? (
            /* Aperçu des données */
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                Aperçu des {stats.totalRows} interventions à importer
              </h3>
              
              {/* ✅ DEBUG */}
              {console.log('🎨 Rendu du tableau - validatedData:', {
                length: validatedData.length,
                first3: validatedData.slice(0, 3)
              })}
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">N°</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Mission</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Intervenant</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Localisation</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Type mission</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Priorité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {validatedData.slice(0, 50).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{index + 1}</td>
                        <td className="px-3 py-2 text-gray-800 dark:text-white max-w-xs truncate">
                          {row.missionSummary || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {row.assignedToName || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {row.location || '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {row.missionType || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            row.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                            row.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                            row.priority === 'normal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {row.priority || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validatedData.length > 50 && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    ... et {validatedData.length - 50} autres lignes
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Nouvelles valeurs à approuver */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  Valider les nouvelles entrées pour les listes déroulantes
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={approveAll}
                    className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                  >
                    ✓ Tout approuver
                  </button>
                  <button
                    onClick={rejectAll}
                    className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                  >
                    ✗ Tout rejeter
                  </button>
                </div>
              </div>

              {Object.entries(newValuesByField).map(([field, data]) => {
                if (data.new.length === 0) return null;
                
                const Icon = fieldIcons[field] || Tag;
                
                return (
                  <div key={field} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                        <Icon size={18} />
                        {fieldLabels[field] || field}
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{data.existing}</span> existantes · 
                        <span className="font-medium text-orange-600 dark:text-orange-400 ml-1">
                          {data.new.length}
                        </span> nouvelles
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {data.new.map(value => {
                        const isApproved = data.approved.has(value);
                        
                        return (
                          <button
                            key={value}
                            onClick={() => toggleApproval(field, value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition border-2 ${
                              isApproved
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300'
                                : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isApproved ? (
                                <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400" />
                              )}
                              <span className="truncate">{value}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {stats.totalNewValues === 0 && (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Aucune nouvelle valeur détectée. Toutes les données utilisent des valeurs existantes.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          {!stats.readyToImport && stats.totalNewValues > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>
                  <strong>{stats.totalNewValues - stats.approvedNewValues}</strong> nouvelle(s) valeur(s) 
                  en attente d'approbation. Les lignes contenant des valeurs non approuvées seront ignorées.
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={stats.totalRows === 0}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Upload size={18} />
              Importer {stats.totalRows > 0 && `(${stats.totalRows} lignes)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportValidationModal;