// src/components/layout/Header.jsx - VERSION CORRIGÉE AVEC SÉLECTEUR D'ÉTABLISSEMENT
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
      
      {/* Left: Menu + Title */}
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
        
        {/* Sélecteur d'établissement (SuperAdmin uniquement) */}
        <EstablishmentSwitcher />

        {/* Notifications */}
        <button
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          aria-label="Notifications"
        >
          <Bell size={20} className="text-gray-600 dark:text-gray-400" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* Admin button (SuperAdmin/Manager uniquement) */}
        {isAdminOrManager && onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            aria-label="Admin"
            title="Administration"
          >
            <Shield size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          aria-label="Paramètres"
        >
          <Settings size={20} className="text-gray-600 dark:text-gray-400" />
        </button>

        {/* User Avatar */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.name || user?.email || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;