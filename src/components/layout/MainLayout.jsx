import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Sidebar from './Sidebar.js';
import Header from './Header.jsx';
import FloatingActionButton from './FloatingActionButton.jsx';

const MainLayout = ({ 
  children, 
  currentView, 
  onViewChange, 
  onCreateIntervention,
  showFAB = true 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar pour mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
            <Sidebar 
              currentView={currentView}
              onViewChange={onViewChange}
              onClose={() => setSidebarOpen(false)}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar 
          currentView={currentView}
          onViewChange={onViewChange}
          isMobile={false}
        />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentView={currentView}
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bouton d'action flottant */}
      {showFAB && onCreateIntervention && (
        <FloatingActionButton onClick={onCreateIntervention} />
      )}
    </div>
  );
};

export default MainLayout;