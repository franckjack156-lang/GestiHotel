// src/components/Admin/AdminPanel.jsx - VERSION COMPLÈTE AVEC MULTI-ÉTABLISSEMENTS
import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Building2, 
  FileSpreadsheet,
  ChevronRight,
  Shield,
  Database,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import EstablishmentsManagement from './EstablishmentsManagement';
import UsersManagementView from '../Users/UsersManagementView';
import UnifiedAdminModal from './UnifiedAdminModal';

const AdminPanel = ({ 
  isOpen, 
  onClose,
  users = [],
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onActivateUser,
  onResetPassword,
  data,
  dataLoading,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleActive
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('establishments');
  const [showAdminData, setShowAdminData] = useState(false);

  if (!isOpen) return null;

  const userRole = user?.role || '';

  // Onglets disponibles selon le rôle
  const tabs = [
    { 
      id: 'establishments', 
      label: 'Établissements', 
      icon: Building2, 
      roles: ['superadmin'],
      description: 'Gérer les établissements et leurs fonctionnalités'
    },
    { 
      id: 'users', 
      label: 'Utilisateurs', 
      icon: Users, 
      roles: ['superadmin'],
      description: 'Créer et gérer les comptes utilisateurs'
    },
    { 
      id: 'data', 
      label: 'Données de référence', 
      icon: Database, 
      roles: ['superadmin', 'manager'],
      description: 'Listes déroulantes, techniciens, fournisseurs'
    }
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(userRole));

  const renderContent = () => {
    switch (activeTab) {
      case 'establishments':
        return <EstablishmentsManagement />;
      
      case 'users':
        return (
          <div className="p-8">
            <UsersManagementView
              users={users}
              currentUser={user}
              onUpdateUser={onUpdateUser}
              onAddUser={onAddUser}
              onDeleteUser={onDeleteUser}
              onActivateUser={onActivateUser}
              onResetPassword={onResetPassword}
            />
          </div>
        );
      
      case 'data':
        return (
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Données de référence
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez les listes déroulantes, techniciens, fournisseurs et équipements
              </p>
            </div>
            <button
              onClick={() => setShowAdminData(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
            >
              Ouvrir la gestion des données
            </button>

            {showAdminData && (
              <UnifiedAdminModal
                isOpen={showAdminData}
                onClose={() => setShowAdminData(false)}
                data={data}
                loading={dataLoading}
                onAddItem={onAddItem}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                onToggleActive={onToggleActive}
                user={user}
              />
            )}
          </div>
        );
      
      default:
        return (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Sélectionnez un onglet
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Panneau d'Administration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestion centralisée de l'application
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content with sidebar */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto flex-shrink-0">
            <div className="space-y-2">
              {filteredTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-4 rounded-lg transition ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-900/50'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Icon 
                          size={20} 
                          className={isActive 
                            ? 'text-indigo-600 dark:text-indigo-400' 
                            : 'text-gray-600 dark:text-gray-400'
                          } 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold ${
                            isActive 
                              ? 'text-indigo-900 dark:text-indigo-200' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {tab.label}
                          </h3>
                          {isActive && (
                            <ChevronRight size={16} className="text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {tab.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2">
                <Shield size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Accès Administrateur
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Vous avez accès à {filteredTabs.length} section{filteredTabs.length > 1 ? 's' : ''} d'administration
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;