// src/components/layout/Sidebar.jsx - VERSION CORRIGÉE SANS BOUTON ADMIN
import React from 'react';
import { 
  Home, 
  ClipboardList, 
  BarChart, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Building2,
  QrCode,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';

const Sidebar = ({ 
  currentView, 
  onViewChange, 
  onClose,
  isMobile = false,
  onOpenQRCode,
  onOpenTemplates,
  user
}) => {
  const { logout } = useAuth();
  const { settings, updateSettings } = useSettings(user);

  const sidebarCollapsed = settings?.sidebarCollapsed ?? false;
  const userRole = user?.role || 'reception';
  const userName = user?.name || user?.email || 'Utilisateur';

  // Navigation principale (SANS éléments admin)
  const navigationItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, roles: ['reception', 'technician', 'manager', 'superadmin'] },
    { id: 'interventions', label: 'Interventions', icon: ClipboardList, roles: ['reception', 'technician', 'manager', 'superadmin'] },
    { id: 'rooms', label: 'Chambres', icon: Building2, roles: ['reception', 'manager', 'superadmin']},
    { id: 'planning', label: 'Planning', icon: Calendar, roles: ['manager', 'superadmin'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart, roles: ['manager', 'superadmin'] },
    { id: 'qr-codes', label: 'QR Codes', icon: QrCode, roles: ['superadmin', 'manager', 'reception'] },
    { id: 'templates', label: 'Templates', icon: FileText, roles: ['superadmin', 'manager'] }
  ];

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  const handleItemClick = (itemId) => {
    if (itemId === 'qr-codes') {
      onOpenQRCode?.();
      if (isMobile) onClose();
      return;
    } else if (itemId === 'templates') {
      onOpenTemplates?.();
      if (isMobile) onClose();
      return;
    }
    
    onViewChange(itemId);
    if (isMobile) onClose();
  };

  const toggleSidebar = () => {
    if (updateSettings) {
      updateSettings({ ...settings, sidebarCollapsed: !sidebarCollapsed });
    }
  };

  const isCollapsed = sidebarCollapsed && !isMobile;

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="text-indigo-600 dark:text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">GestiHôtel</h2>
          </div>
        )}
        
        {isMobile ? (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">{userName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{userRole}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {filteredNavigation.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={20} />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
        
        {/* Settings */}
        <button
          onClick={() => {
            onViewChange('settings');
            if (isMobile) onClose();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
            currentView === 'settings'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={isCollapsed ? 'Paramètres' : ''}
        >
          <Settings size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Paramètres</span>}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          title={isCollapsed ? 'Déconnexion' : ''}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;