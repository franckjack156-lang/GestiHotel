// src/contexts/AppContext.jsx - MODIFIÉ
import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isCreateInterventionModalOpen, setIsCreateInterventionModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAdminOptionsModalOpen, setIsAdminOptionsModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false); // NOUVEAU
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  const value = {
    currentView,
    setCurrentView,
    isCreateInterventionModalOpen,
    setIsCreateInterventionModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isAdminOptionsModalOpen,
    setIsAdminOptionsModalOpen,
    isAdminPanelOpen, // NOUVEAU
    setIsAdminPanelOpen, // NOUVEAU
    selectedIntervention,
    setSelectedIntervention
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};