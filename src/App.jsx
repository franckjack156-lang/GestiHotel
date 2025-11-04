// src/App.jsx - VERSION CORRIGÉE AVEC ADMIN PANEL
import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';

import { ToastContainer, useToast } from './components/common/Toast';
import { setGlobalToast } from './utils/toast';

import { setAnalyticsUser, analyticsEvents } from './config/firebase';
import ErrorBoundary from './components/common/ErrorBoundary';

import { useInterventions } from './hooks/useInterventions';
import { useBlockedRooms } from './hooks/useBlockedRooms';
import { useUserManagement } from './hooks/useUserManagement';
import { useUnifiedData } from './hooks/useUnifiedData';
import { useSettings } from './hooks/useSettings';

import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

import AuthScreen from './components/Auth/AuthScreen';
import LoadingSpinner from './components/common/LoadingSpinner';
import UnifiedAdminModal from './components/Admin/UnifiedAdminModal';
import CreateInterventionModal from './components/Interventions/CreateInterventionModal';
import InterventionDetailModal from './components/Interventions/InterventionDetailModal';
import SettingsModal from './components/Settings/SettingsModal';
import CreateUserModal from './components/Users/CreateUserModal';
import UserManagementModal from './components/Users/UserManagementModal';
import UpdatePasswordModal from './components/Users/UpdatePasswordModal';
import NotificationPrompt from './components/Notifications/NotificationPrompt';

// ✅ CORRECTION: Import direct d'AdminPanel
import AdminPanel from './components/Admin/AdminPanel';

import GlobalSearch, { useGlobalSearch } from './components/Search/GlobalSearch';

const DashboardView = lazy(() => import('./components/Dashboard/DashboardView'));
const InterventionsView = lazy(() => import('./components/Interventions/InterventionsView'));
const AnalyticsView = lazy(() => import('./components/Analytics/AnalyticsView'));
const AdvancedAnalytics = lazy(() => import('./components/Dashboard/AdvancedAnalytics'));
const CalendarView = lazy(() => import('./components/Planning/CalendarView'));
const ChatView = lazy(() => import('./components/Chat/ChatView'));
const UsersManagementView = lazy(() => import('./components/Users/UsersManagementView'));
const RoomsManagementView = lazy(() => import('./components/Rooms/RoomsManagementView'));
const ExcelImportView = lazy(() => import('./components/Admin/ExcelImportView'));
const AdvancedSearchView = lazy(() => import('./components/Search/AdvancedSearchView'));

const QRCodeManager = lazy(() => import('./components/QRCode/QRCodeManager'));
const TemplateManager = lazy(() => import('./components/Templates/TemplateManager'));

import { 
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
  addDoc,
  collection
} from 'firebase/firestore';
import { db } from './config/firebase';
import { toast } from './utils/toast';

const AppContent = () => {
  const { user, loading: authLoading, logout } = useAuth();
  
  const toastInstance = useToast();
  const { toasts, removeToast } = toastInstance;
  
  useEffect(() => {
    setGlobalToast(toastInstance);
  }, [toastInstance]);

  useEffect(() => {
    if (user) {
      setAnalyticsUser(user.uid);
      analyticsEvents.userLogin?.(user.role || 'reception');
    }
  }, [user]);

  const {
    currentView,
    setCurrentView,
    sidebarOpen,
    setSidebarOpen
  } = useApp();

  const { isOpen: isGlobalSearchOpen, setIsOpen: setIsGlobalSearchOpen } = useGlobalSearch();

  // ✅ CORRECTION: États pour les modales
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateInterventionModalOpen, setIsCreateInterventionModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templatePrefilledData, setTemplatePrefilledData] = useState(null);

  const { 
    interventions, 
    loading: interventionsLoading,
    stats: interventionStats,
    hasMore,
    loadMore,
    addIntervention,
    updateIntervention: updateInterventionHook,
    deleteIntervention: deleteInterventionHook,
    addMessage
  } = useInterventions(user);
  
  const { 
    blockedRooms, 
    loading: blockedRoomsLoading,
    toggleRoomBlock
  } = useBlockedRooms(user);
  
  const { 
    users, 
    loading: usersLoading,
    updateUser,
    activateUser,
    deleteUser,
    resetPassword
  } = useUserManagement();
  
  const { 
    data, 
    loading: dataLoading,
    addItem,
    updateItem,
    deleteItem,
    toggleActive,
    getActiveItems
  } = useUnifiedData(user);
  
  const { 
    settings, 
    updateSettings, 
    resetSettings,
    isInitialized: settingsInitialized 
  } = useSettings(user);

  const loading = interventionsLoading || blockedRoomsLoading || usersLoading || dataLoading;

  const analyticsStats = useMemo(() => {
    return {
      totalInterventions: interventions?.length || 0,
      completedThisMonth: interventions?.filter(i => {
        if (!i.status || i.status !== 'completed') return false;
        const createdDate = i.createdAt instanceof Date ? 
          i.createdAt : 
          (i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt));
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && 
               createdDate.getFullYear() === now.getFullYear();
      }).length || 0,
      avgCompletionTime: interventions?.length > 0 ? 
        interventions.filter(i => i.status === 'completed').length / interventions.length * 100 : 0
    };
  }, [interventions]);

  const allRooms = useMemo(() => {
    return interventions?.map(i => i.roomNumber).filter((v, i, a) => a.indexOf(v) === i) || [];
  }, [interventions]);

  // ==========================================
  // 🎯 HANDLERS
  // ==========================================

  const handleCreateIntervention = async (interventionData) => {
    try {
      await addIntervention(interventionData);
      setIsCreateInterventionModalOpen(false);
      setTemplatePrefilledData(null);
      toast.success('Intervention créée avec succès');
    } catch (error) {
      console.error('Erreur création intervention:', error);
      toast.error('Erreur lors de la création de l\'intervention');
      throw error;
    }
  };

  const handleUpdateIntervention = async (interventionId, updates) => {
    try {
      await updateInterventionHook(interventionId, updates);
      toast.success('Intervention mise à jour');
    } catch (error) {
      console.error('Erreur MAJ intervention:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const handleDeleteIntervention = async (interventionId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      return;
    }

    try {
      await deleteInterventionHook(interventionId);
      setSelectedIntervention(null);
      toast.success('Intervention supprimée');
    } catch (error) {
      console.error('Erreur suppression intervention:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsUserManagementModalOpen(true);
  };

  const handleOpenTemplates = () => {
    setIsCreateInterventionModalOpen(false);
    setIsTemplateModalOpen(true);
  };

  const handleUseTemplate = (template) => {
    setTemplatePrefilledData(template);
    setIsTemplateModalOpen(false);
    setIsCreateInterventionModalOpen(true);
  };

  const handleQRCodeCreateIntervention = (data) => {
    setTemplatePrefilledData(data);
    setIsQRCodeModalOpen(false);
    setIsCreateInterventionModalOpen(true);
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen overflow-hidden">
        
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setSidebarOpen(false);
          }}
          onLogout={logout}
          user={user}
          unreadNotifications={0}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          
          {/* ✅ CORRECTION: Ajouter onOpenAdmin au Header */}
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            onLogout={logout}
            onOpenAdmin={() => setIsAdminPanelOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            user={user}
            notificationCount={0}
          />

          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            {loading && !settingsInitialized ? (
              <LoadingSpinner />
            ) : (
              <Suspense fallback={<LoadingSpinner />}>
                {currentView === 'dashboard' && (
                  <DashboardView
                    stats={analyticsStats}
                    recentInterventions={interventions?.slice(0, 5) || []}
                    users={users || []}
                    user={user}
                    onCreateIntervention={() => setIsCreateInterventionModalOpen(true)}
                    onViewIntervention={(intervention) => setSelectedIntervention(intervention)}
                    onOpenQRCode={() => setIsQRCodeModalOpen(true)}
                  />
                )}

                {currentView === 'interventions' && (
                  <InterventionsView
                    interventions={interventions || []}
                    users={users || []}
                    dropdowns={data}
                    onCreateIntervention={() => setIsCreateInterventionModalOpen(true)}
                    onEditIntervention={(intervention) => setSelectedIntervention(intervention)}
                    user={user}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    stats={interventionStats}
                  />
                )}

                {currentView === 'analytics' && (
                  <AnalyticsView
                    interventions={interventions || []}
                    users={users || []}
                  />
                )}

                {currentView === 'rooms' && (
                  <RoomsManagementView
                    interventions={interventions || []}
                    blockedRooms={blockedRooms || []}
                    onToggleBlock={toggleRoomBlock}
                    onCreateIntervention={() => setIsCreateInterventionModalOpen(true)}
                    onViewIntervention={(intervention) => setSelectedIntervention(intervention)}
                  />
                )}

                {currentView === 'planning' && (
                  <CalendarView
                    interventions={interventions || []}
                    users={users || []}
                    onCreateIntervention={() => setIsCreateInterventionModalOpen(true)}
                    onEditIntervention={(intervention) => setSelectedIntervention(intervention)}
                  />
                )}

                {currentView === 'users' && user?.role === 'superadmin' && (
                  <UsersManagementView
                    users={users || []}
                    currentUser={user}
                    onEditUser={handleEditUser}
                    onUpdateUser={updateUser}
                    onAddUser={async (userData) => {
                      setIsCreateUserModalOpen(true);
                    }}
                    onUpdateUserPassword={(userId, newPassword) => {
                      const userToUpdate = users.find(u => u.id === userId);
                      if (userToUpdate) {
                        setSelectedUser(userToUpdate);
                        setIsUpdatePasswordModalOpen(true);
                      }
                    }}
                    onDeleteUser={deleteUser}
                    onActivateUser={activateUser}
                    onResetPassword={resetPassword}
                  />
                )}

                {currentView === 'advanced-analytics' && (
                  <AdvancedAnalytics
                    interventions={interventions || []}
                    users={users || []}
                  />
                )}

                {(currentView === 'excel-import' || currentView === 'import') && user?.role === 'superadmin' && (
                  <ExcelImportView />
                )}

                {currentView === 'search' && (
                  <AdvancedSearchView
                    interventions={interventions || []}
                    users={users || []}
                    onInterventionClick={(intervention) => setSelectedIntervention(intervention)}
                  />
                )}

                {currentView === 'chat' && (
                  <ChatView
                    interventions={interventions || []}
                    users={users || []}
                    currentUser={user}
                  />
                )}
              </Suspense>
            )}
          </div>
        </main>
      </div>

      <NotificationPrompt />

      {/* MODALES */}
      
      {isCreateInterventionModalOpen && (
        <CreateInterventionModal
          isOpen={isCreateInterventionModalOpen}
          onClose={() => {
            setIsCreateInterventionModalOpen(false);
            setTemplatePrefilledData(null);
          }}
          onSubmit={handleCreateIntervention}
          users={users || []}
          dropdowns={data}
          currentUser={user}
          prefilledData={templatePrefilledData}
          onOpenTemplates={handleOpenTemplates}
        />
      )}

      {selectedIntervention && (
        <InterventionDetailModal
          isOpen={!!selectedIntervention}
          onClose={() => setSelectedIntervention(null)}
          intervention={selectedIntervention}
          blockedRooms={blockedRooms || []}
          onUpdate={handleUpdateIntervention}
          onDelete={handleDeleteIntervention}
          users={users || []}
          dropdowns={data}
          user={user}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
          onResetSettings={resetSettings}
          user={user}
        />
      )}

      {isAdminModalOpen && (
        <UnifiedAdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          data={data}
          loading={dataLoading}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onToggleActive={toggleActive}
          user={user}
        />
      )}

      {/* ✅ CORRECTION: Afficher AdminPanel */}
      {isAdminPanelOpen && (
        <AdminPanel
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}

      {isCreateUserModalOpen && (
        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          onCreateUser={async (userData) => {
            setIsCreateUserModalOpen(false);
          }}
        />
      )}

      {isUserManagementModalOpen && selectedUser && (
        <UserManagementModal
          isOpen={isUserManagementModalOpen}
          onClose={() => {
            setIsUserManagementModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUpdateUser={updateUser}
          onActivateUser={activateUser}
          onDeleteUser={deleteUser}
          onResetPassword={resetPassword}
          currentUser={user}
        />
      )}

      {isUpdatePasswordModalOpen && selectedUser && (
        <UpdatePasswordModal
          isOpen={isUpdatePasswordModalOpen}
          onClose={() => {
            setIsUpdatePasswordModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}

      {isQRCodeModalOpen && (
        <Suspense fallback={<LoadingSpinner />}>
          <QRCodeManager
            onClose={() => setIsQRCodeModalOpen(false)}
            onCreateIntervention={handleQRCodeCreateIntervention}
          />
        </Suspense>
      )}

      {isTemplateModalOpen && (
        <Suspense fallback={<LoadingSpinner />}>
          <TemplateManager
            user={user}
            onUseTemplate={handleUseTemplate}
            onClose={() => setIsTemplateModalOpen(false)}
          />
        </Suspense>
      )}

      <GlobalSearch
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        interventions={interventions || []}
        users={users || []}
        rooms={allRooms}
        onSelectIntervention={(intervention) => {
          setSelectedIntervention(intervention);
          setIsGlobalSearchOpen(false);
        }}
        onSelectUser={(user) => {
          handleEditUser(user);
          setIsGlobalSearchOpen(false);
        }}
        onSelectRoom={(room) => {
          setCurrentView('rooms');
          setIsGlobalSearchOpen(false);
        }}
      />

      <ToastContainer toasts={toasts || []} onRemove={removeToast} />
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;