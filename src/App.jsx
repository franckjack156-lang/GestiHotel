// src/App.jsx - VERSION CORRIGÉE ET COMPLÈTE

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Analytics Firebase
import { setAnalyticsUser, analyticsEvents } from './config/firebase';
import ErrorBoundary from './components/common/ErrorBoundary';

// ✅ HOOKS - Tous en premier
import { useUnifiedData } from './hooks/useUnifiedData';
import { useSettings } from './hooks/useSettings';

// Layout
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import NotificationPanel from './components/Notifications/NotificationPanel';

// Vues
import DashboardView from './components/Dashboard/DashboardView';
import InterventionsView from './components/Interventions/InterventionsView';
import AnalyticsView from './components/Analytics/AnalyticsView';
import AdvancedAnalytics from './components/Dashboard/AdvancedAnalytics';
import UsersManagementView from './components/Users/UsersManagementView';

// Modals
import AuthScreen from './components/Auth/AuthScreen';
import LoadingSpinner from './components/common/LoadingSpinner';
import Toast from './components/common/Toast';
import UnifiedAdminModal from './components/Admin/UnifiedAdminModal';
import CreateInterventionModal from './components/Interventions/CreateInterventionModal';
import InterventionDetailModal from './components/Interventions/InterventionDetailModal';
import SettingsModal from './components/Settings/SettingsModal';

// ✅ CORRECTION : Import des bons composants utilisateurs
import UnifiedUserModal from './components/Users/UnifiedUserModal';

// ✅ SERVICES
import { 
  interventionService, 
  userService,
  storageService 
} from './services/index';

const AppContent = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { toasts, removeToast, addToast } = useToast();
  const { 
    currentView, 
    setCurrentView,
    isCreateInterventionModalOpen,
    setIsCreateInterventionModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen
  } = useApp();

  // ========== HOOKS DE DONNÉES ==========
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

  // ========== ÉTAT LOCAL ==========
  const [interventions, setInterventions] = useState([]);
  const [blockedRooms, setBlockedRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // ✅ CORRECTION : États pour modals unifiées
  const [userModalMode, setUserModalMode] = useState('create'); // 'create', 'edit', 'password'
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // ========== CHARGEMENT DES DONNÉES ==========
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Charger interventions
    const loadInterventions = async () => {
      try {
        const q = query(
          collection(db, 'interventions'),
          orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
          setInterventions(data);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Erreur chargement interventions:', error);
        addToast({ type: 'error', message: 'Erreur chargement des interventions' });
      }
    };

    // Charger utilisateurs
    const loadUsers = async () => {
      try {
        const q = query(collection(db, 'users'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUsers(data);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
      }
    };

    // Charger chambres bloquées
    const loadBlockedRooms = async () => {
      try {
        const q = query(
          collection(db, 'blockedRooms'),
          where('blocked', '==', true)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setBlockedRooms(data);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Erreur chargement chambres bloquées:', error);
      }
    };

    const unsubscribeInterventions = loadInterventions();
    const unsubscribeUsers = loadUsers();
    const unsubscribeRooms = loadBlockedRooms();

    setLoading(false);

    return () => {
      unsubscribeInterventions?.then(unsub => unsub?.());
      unsubscribeUsers?.then(unsub => unsub?.());
      unsubscribeRooms?.then(unsub => unsub?.());
    };
  }, [user]);

  // ========== ANALYTICS ==========
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

  // ========== HANDLERS INTERVENTIONS ==========
  const handleInterventionClick = (intervention) => {
    setSelectedIntervention(intervention);
  };

  const handleCreateIntervention = async (interventionData, photos) => {
    try {
      // Upload photos si présentes
      let photoUrls = [];
      if (photos && photos.length > 0) {
        const uploadResults = await storageService.uploadMultiple(
          photos,
          `interventions/${Date.now()}`
        );
        if (uploadResults.success) {
          photoUrls = uploadResults.urls;
        }
      }

      // Créer l'intervention
      const result = await interventionService.create(
        {
          ...interventionData,
          photos: photoUrls
        },
        user
      );

      if (result.success) {
        setIsCreateInterventionModalOpen(false);
        addToast({ 
          type: 'success', 
          title: 'Intervention créée',
          message: 'Nouvelle intervention ajoutée avec succès' 
        });
      }

      return result;
    } catch (error) {
      addToast({ 
        type: 'error', 
        message: 'Erreur lors de la création de l\'intervention' 
      });
      return { success: false, error: error.message };
    }
  };

  const handleUpdateIntervention = async (interventionId, updates, photos = []) => {
    try {
      // Upload nouvelles photos
      let newPhotoUrls = [];
      if (photos && photos.length > 0) {
        const uploadResults = await storageService.uploadMultiple(
          photos,
          `interventions/${interventionId}`
        );
        if (uploadResults.success) {
          newPhotoUrls = uploadResults.urls;
        }
      }

      // Mettre à jour
      const result = await interventionService.update(
        interventionId,
        {
          ...updates,
          photos: newPhotoUrls.length > 0 
            ? [...(updates.photos || []), ...newPhotoUrls]
            : updates.photos
        },
        user
      );

      if (result.success) {
        addToast({ 
          type: 'success', 
          message: 'Intervention mise à jour' 
        });
      }

      return result;
    } catch (error) {
      addToast({ 
        type: 'error', 
        message: 'Erreur lors de la mise à jour' 
      });
      return { success: false, error: error.message };
    }
  };

  const handleToggleRoomBlock = async (room, reason) => {
    try {
      const roomDoc = blockedRooms.find(r => r.room === room);
      
      if (roomDoc) {
        // Débloquer
        await updateDoc(doc(db, 'blockedRooms', roomDoc.id), {
          blocked: false,
          unblockedAt: serverTimestamp(),
          unblockedBy: user.uid
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
      }

      addToast({ 
        type: 'success', 
        message: roomDoc ? 'Chambre débloquée' : 'Chambre bloquée' 
      });

      return { success: true };
    } catch (error) {
      addToast({ 
        type: 'error', 
        message: 'Erreur lors du blocage/déblocage' 
      });
      return { success: false, error: error.message };
    }
  };

  // ========== HANDLERS UTILISATEURS ==========
  const handleOpenCreateUser = () => {
    setUserModalMode('create');
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setUserModalMode('edit');
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleOpenPasswordUser = (user) => {
    setUserModalMode('password');
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleUserModalSubmit = async (data) => {
    try {
      let result;

      if (userModalMode === 'create') {
        result = await userService.create(data);
        if (result.success) {
          addToast({ 
            type: 'success', 
            title: 'Utilisateur créé',
            message: 'Le compte a été créé avec succès' 
          });
        }
      } else if (userModalMode === 'edit') {
        result = await userService.update(selectedUser.id, data, user);
        if (result.success) {
          addToast({ 
            type: 'success', 
            message: 'Utilisateur mis à jour' 
          });
        }
      } else if (userModalMode === 'password') {
        result = await userService.updatePassword(selectedUser.id, data);
        if (result.success) {
          addToast({ 
            type: 'success', 
            title: 'Mot de passe modifié',
            message: 'Le mot de passe a été changé avec succès' 
          });
        }
      }

      if (result.success) {
        setIsUserModalOpen(false);
        setSelectedUser(null);
      }

      return result;
    } catch (error) {
      addToast({ 
        type: 'error', 
        message: 'Erreur lors de l\'opération' 
      });
      return { success: false, error: error.message };
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.id === user.uid) {
      addToast({ 
        type: 'error', 
        message: 'Vous ne pouvez pas vous désactiver vous-même' 
      });
      return { success: false };
    }

    if (!confirm(`Êtes-vous sûr de vouloir désactiver ${userToDelete.name} ?`)) {
      return { success: false };
    }

    try {
      const result = await userService.deactivate(userToDelete.id, user);
      
      if (result.success) {
        addToast({ 
          type: 'success', 
          message: 'Utilisateur désactivé' 
        });
      }

      return result;
    } catch (error) {
      addToast({ 
        type: 'error', 
        message: 'Erreur lors de la désactivation' 
      });
      return { success: false, error: error.message };
    }
  };

  // ========== CHARGEMENT ==========
  if (authLoading || loading) {
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

  // ========== STATS POUR ANALYTICS ==========
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

  // ========== RENDU ==========
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

            {/* Analytics */}
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

            {/* Gestion utilisateurs */}
            {currentView === 'users' && user.role === 'superadmin' && (
              <UsersManagementView
                users={users}
                onAddUser={handleOpenCreateUser}
                onEditUser={handleOpenEditUser}
                onDeleteUser={handleDeleteUser}
                onUpdateUserPassword={handleOpenPasswordUser}
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

                {/* Stats rapides */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Localisations</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {data.locations?.length || 0}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Techniciens</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {data.technicians?.length || 0}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fournisseurs</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {data.suppliers?.length || 0}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Équipements</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {data.equipment?.length || 0}
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

      {/* ========== MODALS ========== */}
      
      {/* Créer intervention */}
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
        
      {/* Détail intervention */}
      {selectedIntervention && (
        <InterventionDetailModal
          intervention={selectedIntervention}
          onClose={() => setSelectedIntervention(null)}
          onUpdateIntervention={handleUpdateIntervention}
          onToggleRoomBlock={handleToggleRoomBlock}
          user={user}
        />
      )}

      {/* Gestion données admin */}
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

      {/* Paramètres */}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
          onResetSettings={resetSettings}
        />
      )}

      {/* ✅ CORRECTION : Modal utilisateur unifiée */}
      {isUserModalOpen && (
        <UnifiedUserModal
          isOpen={isUserModalOpen}
          onClose={() => {
            setIsUserModalOpen(false);
            setSelectedUser(null);
          }}
          mode={userModalMode}
          user={selectedUser}
          onSubmit={handleUserModalSubmit}
          currentUser={user}
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

// App principale
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