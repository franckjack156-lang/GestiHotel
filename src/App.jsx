import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Toast
import { ToastContainer, useToast } from './components/common/Toast';
import { setGlobalToast } from './utils/toast';

// Analytics Firebase
import { setAnalyticsUser, analyticsEvents } from './config/firebase';
import ErrorBoundary from './components/common/ErrorBoundary';

// Hooks
import { useUnifiedData } from './hooks/useUnifiedData';
import { useSettings } from './hooks/useSettings';
import { useUserManagement } from './hooks/useUserManagement';
import { useNotificationsPush } from './hooks/useNotifications'; // ✅ RENOMMÉ pour éviter conflit

// Layout
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Modals
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

// ✅ LAZY LOADING - Vues principales
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

// Firestore imports
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config/firebase';

import { toast } from './utils/toast';
import { notificationService } from './services/notificationService';

const AppContent = () => {
  const { user, loading: authLoading, logout } = useAuth();
  
  // ✅ CORRECTION : Récupérer toasts et removeToast depuis useToast
  const toastInstance = useToast();
  const { toasts, removeToast } = toastInstance;
  
  useEffect(() => {
    setGlobalToast(toastInstance);
  }, [toastInstance]);

  useEffect(() => {
    if (user) {
      setAnalyticsUser(user.uid);
      // ✅ CORRECTION : Utiliser userLogin au lieu de login
      analyticsEvents.userLogin?.(user.role || 'reception');
    }
  }, [user]);

  const {
    currentView,
    setCurrentView,
    sidebarOpen,
    setSidebarOpen
  } = useApp();

  const {
    interventions,
    blockedRooms,
    users,
    data,
    loading: dataLoading,
    refresh,
    addItem,
    getActiveItems
  } = useUnifiedData(user);

  const { settings } = useSettings(user);

  const {
    updateUser,
    activateUser,
    deleteUser,
    resetPassword
  } = useUserManagement();

  const [isCreateInterventionModalOpen, setIsCreateInterventionModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleCreateIntervention = async (interventionData) => {
    try {
      const newIntervention = {
        ...interventionData,
        createdBy: user.uid,
        createdByName: user.name || user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'pending'
      };

      await addDoc(collection(db, 'interventions'), newIntervention);
      toast.success('Intervention créée');
      setIsCreateInterventionModalOpen(false);
      refresh();
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
      refresh();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleToggleRoomBlock = async (room, reason = '') => {
    try {
      const existingBlock = blockedRooms.find(br => br.room === room && br.blocked === true);

      if (existingBlock) {
        await updateDoc(doc(db, 'blockedRooms', existingBlock.id), {
          blocked: false,
          unblockedAt: serverTimestamp(),
          unblockedBy: user.uid,
          unblockedByName: user.name || user.email
        });
        toast.success(`Chambre ${room} débloquée`);
      } else {
        const newBlock = {
          room,
          reason,
          blocked: true,
          blockedAt: serverTimestamp(),
          blockedBy: user.uid,
          blockedByName: user.name || user.email
        };

        await addDoc(collection(db, 'blockedRooms'), newBlock);
        toast.success(`Chambre ${room} bloquée`);
      }

      return { success: true };
      
    } catch (error) {
      console.error('Erreur blocage chambre:', error);
      toast.error('Erreur lors du blocage', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const handleAddDropdownItem = async (locationData) => {
    return await addItem('locations', locationData);
  };

  const handleCreateUser = () => {
    setIsCreateUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsUserManagementModalOpen(true);
  };

  const handleDeleteUser = async (user) => {
    if (confirm(`Êtes-vous sûr de vouloir désactiver ${user.name} ?`)) {
      return await deleteUser(user.id);
    }
  };

  const handleUpdateUserPassword = (user) => {
    setSelectedUser(user);
    setIsUpdatePasswordModalOpen(true);
  };

  const analyticsStats = {
    totalInterventions: interventions?.length || 0,
    completedThisMonth: interventions?.filter(i => 
      i.status === 'completed' && 
      i.createdAt?.getMonth() === new Date().getMonth()
    ).length || 0,
    averageResolutionTime: 2.5,
    technicianPerformance: [],
    roomIssueFrequency: []
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={logout}
          onCreateIntervention={() => setIsCreateInterventionModalOpen(true)}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onNotificationClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
          user={user}
          // ✅ CORRECTION : Passer 0 par défaut si undefined
          notificationCount={0}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  onInterventionClick={(intervention) => setSelectedIntervention(intervention)}
                  onCreateIntervention={() => setIsCreateInterventionModalOpen(true)}
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
                  onCreateUser={handleCreateUser}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                  onUpdatePassword={handleUpdateUserPassword}
                  currentUser={user}
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

              {currentView === 'import' && user?.role === 'super_admin' && (
                <ExcelImportView
                  onImportComplete={refresh}
                />
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
          </div>
        </main>
      </div>

      <NotificationPrompt />

      {isCreateInterventionModalOpen && (
        <CreateInterventionModal
          isOpen={isCreateInterventionModalOpen}
          onClose={() => setIsCreateInterventionModalOpen(false)}
          onSubmit={handleCreateIntervention}
          users={users || []}
          dropdowns={data}
          currentUser={user}
        />
      )}

      {selectedIntervention && (
        <InterventionDetailModal
          isOpen={!!selectedIntervention}
          onClose={() => setSelectedIntervention(null)}
          intervention={selectedIntervention}
          blockedRooms={blockedRooms || []}
          onUpdate={handleUpdateIntervention}
          onDelete={async (id) => {
            try {
              await deleteDoc(doc(db, 'interventions', id));
              toast.success('Intervention supprimée');
              setSelectedIntervention(null);
            } catch (error) {
              toast.error('Erreur suppression');
            }
          }}
          users={users || []}
          dropdowns={data}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          user={user}
        />
      )}

      {isAdminModalOpen && (
        <UnifiedAdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          data={data}
          onRefresh={refresh}
          onAddItem={addItem}
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

      {/* ✅ CORRECTION CRITIQUE : Passer toasts et removeToast au ToastContainer */}
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