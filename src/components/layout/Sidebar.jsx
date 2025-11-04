import React from 'react';
import { 
  Home, 
  ClipboardList, 
  BarChart, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  FileSpreadsheet,
  Building2,
  QrCode,        // ✨ NOUVEAU
  FileText       // ✨ NOUVEAU
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';

const Sidebar = ({ 
  currentView, 
  onViewChange, 
  onClose,
  isMobile = false,
  onOpenQRCode,      // ✨ NOUVEAU
  onOpenTemplates    // ✨ NOUVEAU
}) => {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings(user);

  const sidebarCollapsed = settings?.sidebarCollapsed ?? false;
  const userRole = user?.role || 'reception';
  const userName = user?.name || user?.email || 'Utilisateur';

  const navigationItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, roles: ['reception', 'technician', 'manager', 'superadmin'] },
    { id: 'interventions', label: 'Interventions', icon: ClipboardList, roles: ['reception', 'technician', 'manager', 'superadmin'] },
    { id: 'rooms', label: 'Chambres', icon: Building2, roles: ['reception', 'manager', 'superadmin']},
    { id: 'planning', label: 'Planning', icon: Calendar, roles: ['manager', 'superadmin'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart, roles: ['manager', 'superadmin'] },
    { id: 'qr-codes', label: 'QR Codes', icon: QrCode, roles: ['superadmin', 'manager', 'reception'] },      // ✨ NOUVEAU
    { id: 'templates', label: 'Templates', icon: FileText, roles: ['superadmin', 'manager'] },                // ✨ NOUVEAU
    { id: 'users', label: 'Gestion utilisateurs', icon: Users, roles: ['superadmin'] },
    { id: 'data-management', label: 'Données de référence', icon: Settings, roles: ['superadmin'] },
    { id: 'excel-import', label: 'Import Excel', icon: FileSpreadsheet, roles: ['superadmin'] }
  ];

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  const handleItemClick = (itemId) => {
    // ✨ NOUVEAU: Gérer les clics sur QR Codes et Templates
    if (itemId === 'qr-codes') {
      onOpenQRCode?.();
      if (isMobile) onClose();
      return;
    } else if (itemId === 'templates') {
      onOpenTemplates?.();
      if (isMobile) onClose();
      return;
    }
    
    // Comportement normal pour les autres items
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
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* En-tête */}
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        {/* Logo et bouton fermeture mobile */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} mb-8`}>
          <div className="flex items-center">
            <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
              <ClipboardList className="text-white" size={24} />
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-800 dark:text-white">GestiHôtel</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gestion d'interventions</p>
              </div>
            )}
          </div>
          
          {/* Bouton fermeture pour mobile */}
          {isMobile && !isCollapsed && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {filteredNavigation.map(item => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex items-center w-full px-3 py-2 rounded-lg font-medium transition ${
                currentView === item.id 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-r-2 border-indigo-600' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!isCollapsed && (
                <span className="ml-3">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Bouton réduction sidebar (desktop uniquement) */}
      {!isMobile && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
            title={isCollapsed ? 'Étendre' : 'Réduire'}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <>
                <ChevronLeft size={20} />
                <span className="ml-2 text-sm">Réduire</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* User menu */}
      <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
        <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <span className="text-indigo-600 dark:text-indigo-300 font-semibold text-lg">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          {!isCollapsed && (
            <>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{userName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole}</p>
              </div>
              <button
                onClick={logout}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;