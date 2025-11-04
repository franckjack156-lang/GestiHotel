// src/App.jsx - VERSION CORRIGÉE
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

// Admin Panel (conditionnel)
let AdminPanel = null;
try {
  AdminPanel = require('./components/Admin/AdminPanel').default;
} catch (e) {
  console.warn('AdminPanel non disponible');
}

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

  // NOUVEAU: État pour AdminPanel
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

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
        const createdDate = i.createdAt instanceof Date ? i.createdAt : new Date(i.createdAt);
        return createdDate.getMonth() === new Date().getMonth();
      }).length || 0,
      todo: interventionStats?.todo || 0,
      inProgress: interventionStats?.inProgress || 0,
      completed: interventionStats?.completed || 0,
      cancelled: interventionStats?.cancelled || 0,
      averageResolutionTime: interventionStats?.averageTime || 0,
      completionRate: interventionStats?.completionRate || 0,
      technicianPerformance: [],
      roomIssueFrequency: []
    };
  }, [interventions, interventionStats]);

  const allRooms = useMemo(() => {
    const roomsSet = new Set();
    data.locations?.forEach(loc => {
      const roomName = typeof loc === 'object' ? loc.value || loc.name : loc;
      if (roomName) roomsSet.add(roomName);
    });
    interventions?.forEach(i => {
      if (i.locations && Array.isArray(i.locations)) {
        i.locations.forEach(loc => roomsSet.add(String(loc)));
      } else if (i.location) {
        roomsSet.add(String(i.location));
      }
    });
    return Array.from(roomsSet).map(name => ({ name }));
  }, [data.locations, interventions]);

  const [isCreateInterventionModalOpen, setIsCreateInterventionModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templatePrefilledData, setTemplatePrefilledData] = useState(null);

  const handleCreateIntervention = async (interventionData) => {
    try {
      const newIntervention = {
        ...interventionData,
        createdBy: user.uid,
        createdByName: user.name || user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: interventionData.status || 'todo'
      };

      await addDoc(collection(db, 'interventions'), newIntervention);
      toast.success('Intervention créée');
      setIsCreateInterventionModalOpen(false);
      setTemplatePrefilledData(null);
    } catch (error) {
      console.error('Erreur création:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdateIntervention = async (id, updates) => {
    try {
      await updateDoc(doc(db, 'interventions', id), {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      toast.success('Intervention mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteIntervention = async (id) => {
    try {
      await deleteDoc(doc(db, 'interventions', id));
      toast.success('Intervention supprimée');
      setSelectedIntervention(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleRoomBlock = async (room, reason = '') => {
    try {
      const result = await toggleRoomBlock(room, reason);
      if (result.success) {
        toast.success(`Chambre ${room} ${result.blocked ? 'bloquée' : 'débloquée'}`);
      }
      return result;
    } catch (error) {
      console.error('Erreur blocage chambre:', error);
      toast.error('Erreur lors du blocage');
      return { success: false, error: error.message };
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsCreateUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsUserManagementModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      toast.success('Utilisateur supprimé');
    } catch (error) {
      console.error('Erreur suppression user:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleUpdateUserPassword = (user) => {
    setSelectedUser(user);
    setIsUpdatePasswordModalOpen(true);
  };

  const handleAddDropdownItem = async (category, value) => {
    try {
      await addItem(category, {
        name: value,
        value: value.toLowerCase().replace(/\s+/g, '-'),
        label: value
      });
      toast.success('Élément ajouté');
    } catch (error) {
      console.error('Erreur ajout dropdown:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleOpenQRCode = () => {
    setIsQRCodeModalOpen(true);
  };

  const handleQRCodeCreateIntervention = (data) => {
    setIsQRCodeModalOpen(false);
    setTemplatePrefilledData(data.prefilledData);
    setIsCreateInterventionModalOpen(true);
  };

  const handleOpenTemplates = () => {
    setIsTemplateModalOpen(true);
  };

  const handleUseTemplate = (templateData) => {
    setIsTemplateModalOpen(false);
    setTemplatePrefilledData(templateData);
    setIsCreateInterventionModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 
        transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onClose={() => setSidebarOpen(false)}
          onOpenQRCode={handleOpenQRCode}
          onOpenTemplates={handleOpenTemplates}
          user={user}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={logout}
          onOpenAdmin={() => setIsAdminPanelOpen(true)} // CORRIGÉ
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          user={user}
          notificationCount={0}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              }>
                {currentView === 'dashboard' && (
                  <DashboardView 
                    interventions={interventions || []}
                    blockedRooms={blockedRooms || []}
                    users={users || []}
                    stats={analyticsStats}
                    onInterventionClick={(intervention) => setSelectedIntervention(intervention)}
                    onCreateIntervention={() => setIsCreateInterventionModalOpen(true)}
                  />
                )}

                {currentView === 'interventions' && (
                  <InterventionsView
                    interventions={interventions || []}
                    users={users || []}
                    blockedRooms={blockedRooms || []}
                    dropdowns={data}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    onInterventionClick={(intervention) => setSelectedIntervention(intervention)}
                    onCreateClick={() => setIsCreateInterventionModalOpen(true)}
                    onToggleRoomBlock={handleToggleRoomBlock}
                  />
                )}

                {currentView === 'analytics' && (
                  <AnalyticsView
                    interventions={interventions || []}
                    users={users || []}
                    stats={analyticsStats}
                  />
                )}

                {currentView === 'planning' && (
                  <CalendarView
                    interventions={interventions || []}
                    users={users || []}
                    onInterventionClick={(intervention) => setSelectedIntervention(intervention)}
                    onCreateIntervention={() => setIsCreateInterventionModalOpen(true)}
                  />
                )}

                {currentView === 'users' && (
                  <UsersManagementView
                    users={users || []}
                    currentUser={user}
                    onUpdateUser={updateUser}
                    onCreateUser={handleCreateUser}
                    onEditUser={handleEditUser}
                    onDeleteUser={handleDeleteUser}
                    onUpdatePassword={handleUpdateUserPassword}
                    onActivateUser={activateUser}
                    onResetPassword={resetPassword}
                  />
                )}

                {currentView === 'rooms' && (
                  <RoomsManagementView
                    blockedRooms={blockedRooms || []}
                    interventions={interventions || []}
                    onToggleRoomBlock={handleToggleRoomBlock}
                    onInterventionClick={(intervention) => setSelectedIntervention(intervention)}
                    dropdowns={data}
                    onAddLocation={handleAddDropdownItem}
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

      {/* NOUVEAU: Admin Panel */}
      {AdminPanel && isAdminPanelOpen && (
        <AdminPanel
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
        />
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