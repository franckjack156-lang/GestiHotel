// src/components/layout/Header.jsx - VERSION AVEC SÉLECTEUR D'ÉTABLISSEMENT
import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import EstablishmentSwitcher from './EstablishmentSwitcher';

const Header = ({ 
  onMenuClick, 
  onLogout,
  onOpenAdmin,
  onOpenSettings,
  user,
  notificationCount = 0
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const userRole = user?.role || '';
  const isAdminOrManager = ['superadmin', 'manager'].includes(userRole);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-4">
      
      {/* Left: Menu */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          aria-label="Menu"
        >
          <Menu size={24} className="text-gray-600 dark:text-gray-400" />
        </button>

        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            GestiHôtel
          </h1>
        </div>
      </div>

      {/* Center: Search bar */}
      <div className="flex-1 max-w-2xl relative">
        <div className="relative">
          <Search 
            size={20} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Rechercher une intervention, un technicien..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none transition"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        
        {/* NOUVEAU: Sélecteur d'établissement */}
        <EstablishmentSwitcher user={user} />

        {/* Bouton Admin (SuperAdmin et Manager seulement) */}
        {isAdminOrManager && (
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
            title="Panneau d'administration"
          >
            <Shield size={20} />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}

        {/* Notifications */}
        <button
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          title="Notifications"
        >
          <Bell size={20} className="text-gray-600 dark:text-gray-400" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* Paramètres */}
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          title="Paramètres"
        >
          <Settings size={20} className="text-gray-600 dark:text-gray-400" />
        </button>

        {/* Profil utilisateur */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.name || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user?.role || 'reception'}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
            title="Se déconnecter"
          >
            {(user?.name || 'U')[0].toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;