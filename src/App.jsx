// src/App.jsx - VERSION FINALE CORRIGÉE

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Analytics Firebase uniquement
import { setAnalyticsUser, analyticsEvents } from './config/firebase';
import ErrorBoundary from './components/common/ErrorBoundary';

// ✅ Hooks - TOUS en premier
import { useUnifiedData } from './hooks/useUnifiedData';
import { useSettings } from './hooks/useSettings';
import { useUserManagement } from './hooks/useUserManagement';

// Layout
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import NotificationPanel from './components/Notifications/NotificationPanel';
import AdvancedSearchView from './components/Search/AdvancedSearchView';

// Vues
import DashboardView from './components/Dashboard/DashboardView';
import InterventionsView from './components/Interventions/InterventionsView';
import AnalyticsView from './components/Analytics/AnalyticsView';
import AdvancedAnalytics from './components/Dashboard/AdvancedAnalytics';
import UsersManagementView from './components/Users/UsersManagementView';
import CalendarView from './components/Planning/CalendarView';
import ChatView from './components/Chat/ChatView';

// Modals
import AuthScreen from './components/Auth/AuthScreen';
import LoadingSpinner from './components/common/LoadingSpinner';
import Toast from './components/common/Toast';
import UnifiedAdminModal from './components/Admin/UnifiedAdminModal';
import CreateInterventionModal from './components/Interventions/CreateInterventionModal';
import InterventionDetailModal from './components/Interventions/InterventionDetailModal';
import SettingsModal from './components/Settings/SettingsModal';
import CreateUserModal from './components/Users/CreateUserModal';
import UserManagementModal from './components/Users/UserManagementModal';
import UpdatePasswordModal from './components/Users/UpdatePasswordModal';

// Firestore imports pour les interventions
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
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config/firebase';

const AppContent = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { toasts, removeToast } = useToast();
  const { addToast } = useToast();
  const { 
    currentView, 
    setCurrentView,
    isCreateInterventionModalOpen,
    setIsCreateInterventionModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen
  } = useApp();

  // ✅ Hooks de données - TOUJOURS appelés
  const {
    data,
    loading: dataLoading,
    error: dataError,
    addItem,
    updateItem,
    deleteItem,
    toggleActive,
    getActiveItems
  } = useUnifiedData(user);

  const { settings, updateSettings, resetSettings } = useSettings(user);

  const {
    users,
    loading: usersLoading,
    addUser,
    updateUser,
    deleteUser,
    activateUser,
    resetPassword,
    updateUserPassword
  } = useUserManagement();

  // ✅ État local pour les interventions
  const [interventions, setInterventions] = useState([]);
  const [blockedRooms, setBlockedRooms] = useState([]);
  const [interventionsLoading, setInterventionsLoading] = useState(true);

  // État local - Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ✅ Charger les interventions
  useEffect(() => {
    if (!user) {
      setInterventions([]);
      setBlockedRooms([]);
      setInterventionsLoading(false);
      return;
    }

    // Écouter les interventions
    let interventionsQuery = query(
      collection(db, 'interventions'),
      orderBy('createdAt', 'desc')
    );

    // Filtrer par rôle
    if (user.role === 'technician') {
      interventionsQuery = query(
        collection(db, 'interventions'),
        where('assignedTo', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubInterventions = onSnapshot(
      interventionsQuery,
      (snapshot) => {
        const interventionsData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          interventionsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || null
          });
        });
        setInterventions(interventionsData);
        setInterventionsLoading(false);
      },
      (error) => {
        console.error('❌ Erreur chargement interventions:', error);
        setInterventionsLoading(false);
      }
    );

    // Écouter les chambres bloquées
    const blockedRoomsQuery = query(
      collection(db, 'blockedRooms'),
      where('blocked', '==', true)
    );

    const unsubBlockedRooms = onSnapshot(
      blockedRoomsQuery,
      (snapshot) => {
        const blockedRoomsData = [];
        snapshot.forEach((doc) => {
          blockedRoomsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setBlockedRooms(blockedRoomsData);
      },
      (error) => {
        console.error('❌ Erreur chargement chambres bloquées:', error);
      }
    );

    return () => {
      unsubInterventions();
      unsubBlockedRooms();
    };
  }, [user]);

  // ✅ Analytics
  useEffect(() => {
    if (user) {
      setAnalyticsUser(user.uid, {
        role: user.role,
        department: user.department || 'unknown'
      });
      analyticsEvents.userLogin(user.role);
    }
  }, [user]);

  useEffect(() => {
    if (currentView) {
      analyticsEvents.pageView(currentView);
    }
  }, [currentView]);

  // ✅ Vérifications conditionnelles
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const isLoading = authLoading || dataLoading || interventionsLoading;

  // ✅ Handlers interventions
  const handleInterventionClick = (intervention) => {
    setSelectedIntervention(intervention);
  };

  const handleCreateIntervention = async (interventionData, photos) => {
    try {
      // Upload des photos
      const photoUrls = [];
      if (photos && photos.length > 0) {
        for (const photo of photos) {
          const storageRef = ref(storage, `interventions/${Date.now()}_${photo.name}`);
          const snapshot = await uploadBytes(storageRef, photo);
          const downloadURL = await getDownloadURL(snapshot.ref);
          photoUrls.push(downloadURL);
        }
      }

      // Créer l'intervention
      const interventionToAdd = {
        ...interventionData,
        photos: photoUrls,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email,
        status: 'todo',
        messages: [],
        history: [{
          status: 'todo',
          date: new Date().toISOString(),
          by: user.uid,
          byName: user.name || user.email,
          comment: 'Intervention créée'
        }]
      };

      await addDoc(collection(db, 'interventions'), interventionToAdd);

      addToast({
        type: 'success',
        title: 'Intervention créée',
        message: 'L\'intervention a été créée avec succès'
      });

      setIsCreateInterventionModalOpen(false);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur création intervention:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la création de l\'intervention'
      });
      return { success: false, error: error.message };
    }
  };

  const handleUpdateIntervention = async (interventionId, updates, photos = []) => {
    try {
      // Upload des nouvelles photos
      const photoUrls = [];
      if (photos && photos.length > 0) {
        for (const photo of photos) {
          const storageRef = ref(storage, `interventions/${interventionId}/${Date.now()}_${photo.name}`);
          const snapshot = await uploadBytes(storageRef, photo);
          const downloadURL = await getDownloadURL(snapshot.ref);
          photoUrls.push(downloadURL);
        }
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: user.name || user.email
      };

      // Ajouter les nouvelles photos
      if (photoUrls.length > 0) {
        const intervention = interventions.find(i => i.id === interventionId);
        updateData.photos = [...(intervention?.photos || []), ...photoUrls];
      }

      await updateDoc(doc(db, 'interventions', interventionId), updateData);

      addToast({
        type: 'success',
        title: 'Intervention mise à jour',
        message: 'L\'intervention a été mise à jour avec succès'
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur mise à jour intervention:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour de l\'intervention'
      });
      return { success: false, error: error.message };
    }
  };

  const handleToggleRoomBlock = async (room, reason) => {
    try {
      // Vérifier si la chambre est déjà bloquée
      const existingBlock = blockedRooms.find(br => br.room === room && br.blocked);

      if (existingBlock) {
        // Débloquer
        await updateDoc(doc(db, 'blockedRooms', existingBlock.id), {
          blocked: false,
          unblockedAt: serverTimestamp(),
          unblockedBy: user.uid,
          unblockedByName: user.name || user.email
        });

        addToast({
          type: 'success',
          title: 'Chambre débloquée',
          message: `La chambre ${room} a été débloquée`
        });
      } else {
        // Bloquer
        await addDoc(collection(db, 'blockedRooms'), {
          room,
          reason,
          blocked: true,
          blockedAt: serverTimestamp(),
          blockedBy: user.uid,
          blockedByName: user.name || user.email
        });

        addToast({
          type: 'success',
          title: 'Chambre bloquée',
          message: `La chambre ${room} a été bloquée`
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur blocage chambre:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du blocage de la chambre'
      });
      return { success: false, error: error.message };
    }
  };

  // ✅ Handlers utilisateurs
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

  // ✅ Stats pour Analytics
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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

      {/* Contenu principal */}
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
            {/* Dashboard */}
            {currentView === 'dashboard' && (
              <DashboardView
                interventions={interventions}
                blockedRooms={blockedRooms}
                onInterventionClick={handleInterventionClick}
              />
            )}

            {/* Interventions */}
            {currentView === 'interventions' && (
              <InterventionsView
                interventions={interventions}
                onInterventionClick={handleInterventionClick}
                onCreateClick={() => setIsCreateInterventionModalOpen(true)}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
              />
            )}

            {/* Analytics Basique */}
            {currentView === 'analytics' && (
              <AnalyticsView
                stats={analyticsStats}
                onExportData={(type) => console.log('Export:', type)}
              />
            )}

            {/* Analytics Avancés */}
            {currentView === 'advanced-analytics' && (
              <AdvancedAnalytics
                interventions={interventions}
                users={users}
              />
            )}

            {/* Calendrier/Planning */}
            {currentView === 'calendar' && (
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

            {/* Chat */}
            {currentView === 'chat' && (
              <ChatView
                user={user}
                users={users}
              />
            )}

            {/* Recherche Avancée */}
            {currentView === 'search' && (
              <AdvancedSearchView
                interventions={interventions}
                users={users}
                data={data}
                onInterventionClick={handleInterventionClick}
              />
            )}

            {/* Gestion utilisateurs */}
            {currentView === 'users' && user.role === 'superadmin' && (
              <UsersManagementView
                users={users}
                onAddUser={handleCreateUser}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                onUpdateUserPassword={handleUpdateUserPassword}
                currentUser={user}
              />
            )}

            {/* Gestion des données */}
            {currentView === 'data-management' && user.role === 'superadmin' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                      Gestion des données de référence
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Gérez toutes les listes déroulantes et données admin
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAdminModalOpen(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Ouvrir le gestionnaire
                  </button>
                </div>

                {/* Statistiques rapides */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Localisations</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {data.locations?.length || 0}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      {getActiveItems('locations').length} actives
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Techniciens</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {data.technicians?.length || 0}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      {getActiveItems('technicians').length} actifs
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
          </div>
        </main>
      </div>

      {/* Panel de Notifications */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />

      {/* MODALS */}
      
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
          onUpdateIntervention={handleUpdateIntervention}
          onToggleRoomBlock={handleToggleRoomBlock}
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
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
          onResetSettings={resetSettings}
        />
      )}

      {isCreateUserModalOpen && (
        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          onAddUser={async (userData) => {
            const result = await addUser(userData);
            if (result.success) {
              setIsCreateUserModalOpen(false);
            }
            return result;
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
          onResetPassword={resetPassword}
          onDeleteUser={deleteUser}
          onActivateUser={activateUser}
          onUpdatePassword={(user) => {
            setIsUserManagementModalOpen(false);
            setSelectedUser(user);
            setIsUpdatePasswordModalOpen(true);
          }}
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
          onUpdatePassword={async (userId, password) => {
            const result = await updateUserPassword(userId, password);
            if (result.success) {
              setIsUpdatePasswordModalOpen(false);
              setSelectedUser(null);
            }
            return result;
          }}
        />
      )}

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

// App principale avec NotificationProvider
const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppProvider>
              <AppContent />
            </AppProvider>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;