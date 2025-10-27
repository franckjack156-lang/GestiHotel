import React, { useState } from 'react';
import { X, Shield, Users, Database, Download, Upload, Trash2, Archive } from 'lucide-react';

const AdminOptionsModal = ({ isOpen, onClose, onDataManagement, onUserManagement, onExportData, onImportData, onCleanData }) => {
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'Général', icon: Shield },
    { id: 'data', label: 'Données', icon: Database },
    { id: 'users', label: 'Utilisateurs', icon: Users }
  ];

  const adminActions = {
    general: [
      {
        icon: Database,
        title: 'Gestion des données',
        description: 'Gérer les types d\'interventions, équipements, etc.',
        action: onDataManagement,
        color: 'blue'
      },
      {
        icon: Users,
        title: 'Gestion des utilisateurs',
        description: 'Gérer les comptes et permissions',
        action: onUserManagement,
        color: 'green'
      }
    ],
    data: [
      {
        icon: Download,
        title: 'Exporter les données',
        description: 'Télécharger toutes les données en JSON',
        action: onExportData,
        color: 'indigo'
      },
      {
        icon: Upload,
        title: 'Importer des données',
        description: 'Charger des données depuis un fichier',
        action: onImportData,
        color: 'amber'
      },
      {
        icon: Trash2,
        title: 'Nettoyer les données',
        description: 'Supprimer les données anciennes',
        action: onCleanData,
        color: 'red'
      },
      {
        icon: Archive,
        title: 'Archivage automatique',
        description: 'Configurer l\'archivage des interventions',
        action: () => {},
        color: 'purple'
      }
    ],
    users: [
      {
        icon: Users,
        title: 'Rôles et permissions',
        description: 'Gérer les niveaux d\'accès',
        action: () => {},
        color: 'blue'
      },
      {
        icon: Shield,
        title: 'Audit des activités',
        description: 'Voir l\'historique des actions',
        action: () => {},
        color: 'green'
      }
    ]
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
      green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400',
      amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
      red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Options Administrateur
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation par onglets */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminActions[activeTab]?.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 text-left hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getColorClasses(action.color)}`}>
                    <action.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pied de page */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Zone administrative
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Ces actions peuvent affecter l'ensemble de l'application. Utilisez-les avec précaution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOptionsModal;