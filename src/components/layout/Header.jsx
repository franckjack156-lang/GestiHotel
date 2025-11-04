import React, { useState } from 'react';
import { 
  List, 
  Settings, 
  ChevronDown, 
  User,
  LogOut,
  ClipboardList,
  QrCode,        // ✨ NOUVEAU
  FileText       // ✨ NOUVEAU
} from 'lucide-react';

const Header = ({ 
  currentView, 
  onMenuClick, 
  user,
  onOpenSettings,    // ✅ CORRIGÉ
  onOpenQRCode,      
  onOpenTemplates    
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Tableau de bord';
      case 'interventions': return 'Gestion des interventions';
      case 'analytics': return 'Analytics & Rapports';
      case 'users': return 'Gestion des utilisateurs';
      default: return 'GestiHôtel';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Partie gauche */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <List size={24} />
            </button>
            
            {/* Logo mobile */}
            <div className="lg:hidden ml-3 flex items-center">
              <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
                <ClipboardList className="text-white" size={18} />
              </div>
              <h1 className="ml-2 text-lg font-bold text-gray-800 dark:text-white">GestiHôtel</h1>
            </div>

            {/* Titre desktop */}
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {getViewTitle()}
              </h1>
            </div>
          </div>

          {/* Partie droite - Actions utilisateur */}
          <div className="flex items-center gap-2">
            {/* ✨ NOUVEAU: Bouton QR Code */}
            {(user?.role === 'superadmin' || user?.role === 'manager' || user?.role === 'reception') && onOpenQRCode && (
              <button
                onClick={onOpenQRCode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="QR Codes"
              >
                <QrCode size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* ✨ NOUVEAU: Bouton Templates */}
            {(user?.role === 'superadmin' || user?.role === 'manager') && onOpenTemplates && (
              <button
                onClick={onOpenTemplates}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Templates"
              >
                <FileText size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Paramètres</span>
            </button>
            
            {/* Menu utilisateur */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <User className="text-indigo-600 dark:text-indigo-300" size={16} />
                </div>
                <span className="hidden sm:inline">{user?.name}</span>
                <ChevronDown size={16} />
              </button>
              
              {/* Dropdown user menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-600">
                      <p className="font-medium">{user?.name}</p>
                      <p className="capitalize">{user?.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        // Logout handled by parent
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;