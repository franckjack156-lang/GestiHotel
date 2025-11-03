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
import { useNotifications } from './hooks/useNotifications';

// Layout (gardés en direct car toujours visibles)
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import NotificationPanel from './components/Notifications/NotificationPrompt';

// Modals (gardés en direct car légers)
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
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config/firebase';

import { toast } from './utils/toast';
import { notificationService } from './services/notificationService';

const AppContent = () => {
  const { user, loading: authLoading, logout } = useAuth();
  
  const toastInstance = useToast();
  
  useEffect(() => {
    setGlobalToast(toastInstance);
  }, [toastInstance]);

  useEffect(() => {
    if (user) {
      setAnalyticsUser(user.uid);
      analyticsEvents.login(user.uid);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Reste du code identique...
  // (Je copie juste la structure, le reste du code reste inchangé)

  const handleInterventionClick = (intervention) => {
    setSelectedIntervention(intervention);
  };

  const handleCreateIntervention = async (interventionData, photos) => {
    try {
      const photoUrls = await Promise.all(
        photos.map(async (photo) => {
          const photoRef = ref(storage, `interventions/${Date.now()}_${photo.name}`);
          await uploadBytes(photoRef, photo);
          const url = await getDownloadURL(photoRef);
          return {
            url,
            caption: photo.caption || '',
            uploadedAt: new Date().toISOString(),
            uploadedBy: user.uid,
            uploadedByName: user.name || user.email
          };
        })
      );

      const newIntervention = {
        ...interventionData,
        photos: photoUrls,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email,
        status: 'todo',
        history: [{
          id: `history_${Date.now()}`,
          status: 'todo',
          date: new Date().toISOString(),
          by: user.uid,
          byName: user.name || user.email,
          comment: 'Intervention créée'
        }]
      };

      await addDoc(collection(db, 'interventions'), newIntervention);
      toast.success('Intervention créée avec succès');
      setIsCreateInterventionModalOpen(false);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur création intervention:', error);
      toast.error('Erreur lors de la création', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const handleUpdateIntervention = async (interventionId, updates) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: user.name || user.email
      };

      if (updates.status) {
        const intervention = interventions.find(i => i.id === interventionId);
        updateData.history = [
          ...(intervention.history || []),
          {
            id: `history_${Date.now()}`,
            status: updates.status,
            date: new Date().toISOString(),
            by: user.uid,
            byName: user.name || user.email,
            comment: updates.comment || `Statut changé en ${updates.status}`
          }
        ];

        if (updates.status === 'completed' && intervention.createdBy !== user.uid) {
          await notificationService.notifyInterventionUpdate(
            intervention,
            intervention.createdBy,
            `L'intervention ${intervention.missionSummary} est terminée`
          );
        }
      }

      if (updates.assignedTo) {
        const intervention = interventions.find(i => i.id === interventionId);
        if (updates.assignedTo !== intervention.assignedTo) {
          await notificationService.notifyTechnician(
            updates.assignedTo,
            '🔧 Nouvelle assignation',
            `L'intervention ${intervention.missionSummary} vous a été assignée`,
            { interventionId }
          );
        }
      }

      await updateDoc(doc(db, 'interventions', interventionId), updateData);
      toast.success('Intervention mise à jour');

      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour intervention:', error);
      toast.error('Erreur lors de la mise à jour', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const handleToggleRoomBlock = async (room, reason) => {
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
    totalInterventions: interventions.length,
    completedThisMonth: interventions.filter(i => 
      i.status === 'completed' && 
      i.createdAt?.getMonth() === new Date().getMonth()
    ).length,
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
          onViewChange={(view) => {
            setCurrentView(view);
            setSidebarOpen(false);
          }}
          user={user}
          settings={settings}
          onLogout={logout}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentView={currentView}
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onSettingsClick={() => setIsSettingsModalOpen(true)}
          onNotificationsClick={() => setIsNotificationPanelOpen(true)}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* ✅ SUSPENSE pour lazy loading */}
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
              </div>
            }>
              {currentView === 'dashboard' && (
                <DashboardView
                  interventions={interventions}
                  blockedRooms={blockedRooms}
                  onInterventionClick={handleInterventionClick}
                />
              )}

              {currentView === 'interventions' && (
                <InterventionsView
                  interventions={interventions}
                  dropdowns={data}
                  onInterventionClick={handleInterventionClick}
                  onCreateClick={() => setIsCreateInterventionModalOpen(true)}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  filterStatus={filterStatus}
                  onFilterChange={setFilterStatus}
                />
              )}

              {currentView === 'analytics' && (
                <AnalyticsView
                  stats={analyticsStats}
                  onExportData={(type) => console.log('Export:', type)}
                />
              )}

              {currentView === 'advanced-analytics' && (
                <AdvancedAnalytics
                  interventions={interventions}
                  users={users}
                />
              )}

              {currentView === 'planning' && (
                <CalendarView
                  interventions={interventions}
                  users={users}
                  onInterventionClick={handleInterventionClick}
                  onCreateIntervention={() => setIsCreateInterventionModalOpen(true)}
                  onDragDrop={async (interventionId, newDate) => {
                    await handleUpdateIntervention(interventionId, { 
                      scheduledDate: newDate 
                    });
                  }}
                />
              )}

              {currentView === 'chat' && (
                <ChatView
                  user={user}
                  users={users}
                />
              )}

              {currentView === 'search' && (
                <AdvancedSearchView
                  interventions={interventions}
                  users={users}
                  data={data}
                  onInterventionClick={handleInterventionClick}
                />
              )}

              {currentView === 'users' && user.role === 'superadmin' && (
                <UsersManagementView
                  users={users}
                  currentUser={user}
                  onAddUser={handleCreateUser}
                  onEditUser={handleEditUser}
                  onUpdateUser={updateUser}
                  onDeleteUser={handleDeleteUser}
                  onUpdateUserPassword={handleUpdateUserPassword}
                  onActivateUser={activateUser}
                  onResetPassword={resetPassword}
                />
              )}

              {currentView === 'data-management' && user.role === 'superadmin' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Gestion des données de référence
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gérez toutes les listes déroulantes et données de configuration
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAdminModalOpen(true)}
                      className="btn-primary"
                    >
                      Gérer les données
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Chambres</div>
                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {data.locations?.length || 0}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {getActiveItems('locations').length} actives
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Types de missions</div>
                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {data.missionTypes?.length || 0}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {getActiveItems('missionTypes').length} actifs
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Fournisseurs</div>
                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {data.suppliers?.length || 0}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {getActiveItems('suppliers').length} actifs
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Équipements</div>
                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {data.equipment?.length || 0}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {getActiveItems('equipment').length} actifs
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'excel-import' && user.role === 'superadmin' && (
                <ExcelImportView />
              )}
              
              {currentView === 'rooms' && (
                <RoomsManagementView
                  blockedRooms={blockedRooms}
                  interventions={interventions}
                  onToggleRoomBlock={handleToggleRoomBlock}
                  onInterventionClick={handleInterventionClick}
                  dropdowns={data}
                  onAddLocation={handleAddDropdownItem}
                />
              )}
            </Suspense>
          </div>
        </main>
      </div>

      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />

      {isCreateInterventionModalOpen && (
        <CreateInterventionModal
          isOpen={isCreateInterventionModalOpen}
          onClose={() => setIsCreateInterventionModalOpen(false)}
          onAddIntervention={handleCreateIntervention}
          dropdowns={data}
          adminOptions={data}
          user={user}
          blockedRooms={blockedRooms}
          onAddLocation={(locationData) => addItem('locations', locationData)}
          getActiveItems={getActiveItems}
        />
      )}
        
      {selectedIntervention && (
        <InterventionDetailModal
          intervention={selectedIntervention}
          onClose={() => setSelectedIntervention(null)}
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
          users={users}
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
            // Logique création user
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
            <ToastContainer />
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;