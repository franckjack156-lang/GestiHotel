import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';

// ✨ NOUVEAU : Import du système de Toast optimisé
import { ToastContainer, useToast } from './components/common/Toast';
import { setGlobalToast } from './utils/toast';

// Analytics Firebase uniquement
import { setAnalyticsUser, analyticsEvents } from './config/firebase';
import ErrorBoundary from './components/common/ErrorBoundary';

// ✅ Hooks - TOUS en premier
import { useUnifiedData } from './hooks/useUnifiedData';
import { useSettings } from './hooks/useSettings';
import { useUserManagement } from './hooks/useUserManagement';

// ✨ PHASE 2: Hook de notifications
import { useNotifications } from './hooks/useNotifications';

// Layout
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import NotificationPanel from './components/Notifications/NotificationPrompt';
import AdvancedSearchView from './components/Search/AdvancedSearchView';

// Vues
import DashboardView from './components/Dashboard/DashboardView';
import InterventionsView from './components/Interventions/InterventionsView';
import AnalyticsView from './components/Analytics/AnalyticsView';
import AdvancedAnalytics from './components/Dashboard/AdvancedAnalytics';
import UsersManagementView from './components/Users/UsersManagementView';
import CalendarView from './components/Planning/CalendarView';
import ChatView from './components/Chat/ChatView';
import ExcelImportView from './components/Admin/ExcelImportView';
import RoomsManagementView from './components/Rooms/RoomsManagementView';

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

// ✨ PHASE 2: Composant de prompt pour notifications
import NotificationPrompt from './components/Notifications/NotificationPrompt';

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

// ✨ Import du toast global
import { toast } from './utils/toast';

// ✨ PHASE 2: Import du service de notifications
import { notificationService } from './services/notificationService';

const AppContent = () => {
  const { user, loading: authLoading, logout } = useAuth();
  
  // ✨ Initialiser le toast global
  const toastInstance = useToast();
  
  useEffect(() => {
    setGlobalToast(toastInstance);
  }, [toastInstance]);
  
  const { 
    currentView, 
    setCurrentView,
    isCreateInterventionModalOpen,
    setIsCreateInterventionModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen
  } = useApp();

  // ✨ PHASE 2: Hook de notifications
  const notifications = useNotifications();

  // ✅ Hooks de données
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

  // État local
  const [interventions, setInterventions] = useState([]);
  const [blockedRooms, setBlockedRooms] = useState([]);
  const [interventionsLoading, setInterventionsLoading] = useState(true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [selectedInterventionId, setSelectedInterventionId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ✨ PHASE 2: Logger le statut des notifications
  useEffect(() => {
    if (user && notifications.isEnabled) {
      console.log('✅ Notifications activées pour', user.email);
      console.log('📱 Token FCM:', notifications.token?.substring(0, 20) + '...');
    }
  }, [user, notifications.isEnabled, notifications.token]);

  // useEffect - Interventions
  useEffect(() => {
    if (!user) {
      setInterventions([]);
      setBlockedRooms([]);
      setInterventionsLoading(false);
      return;
    }

    let interventionsQuery = query(
      collection(db, 'interventions'),
      orderBy('createdAt', 'desc')
    );

    if (user.role === 'technician' && user.linkedTechnicianId) {
    console.log('🔍 Filtrage par technicien:', user.linkedTechnicianId);
    interventionsQuery = query(
      collection(db, 'interventions'),
      where('assignedTo', '==', user.linkedTechnicianId), // ← ID du document technicien
      orderBy('createdAt', 'desc')
    );
  } else if (user.role === 'technician') {
    // Si pas de lien technicien, aucune intervention
    setInterventions([]);
    setInterventionsLoading(false);
    return;
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

    const blockedRoomsQuery = query(
      collection(db, 'blockedRooms'),
      orderBy('blockedAt', 'desc')
    );

    const unsubBlockedRooms = onSnapshot(
      blockedRoomsQuery,
      (snapshot) => {
        const blockedRoomsData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          blockedRoomsData.push({
            id: doc.id,
            ...data,
            blockedAt: data.blockedAt?.toDate?.() || data.blockedAt,
            unblockedAt: data.unblockedAt?.toDate?.() || data.unblockedAt
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

  useEffect(() => {
    if (selectedInterventionId && interventions.length > 0) {
      const updated = interventions.find(i => i.id === selectedInterventionId);
      if (updated) {
        setSelectedIntervention(updated);
      }
    }
  }, [interventions, selectedInterventionId]);

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

  const handleInterventionClick = (intervention) => {
    setSelectedIntervention(intervention);
    setSelectedInterventionId(intervention.id);
  };

  const handleCloseInterventionModal = () => {
    setSelectedIntervention(null);
    setSelectedInterventionId(null);
  };

  const handleCreateIntervention = async (interventionData, photos) => {
    try {
      const photoUrls = [];
      if (photos && photos.length > 0) {
        for (const photo of photos) {
          const storageRef = ref(storage, `interventions/${Date.now()}_${photo.name}`);
          const snapshot = await uploadBytes(storageRef, photo);
          const downloadURL = await getDownloadURL(snapshot.ref);
          photoUrls.push(downloadURL);
        }
      }

      const interventionToAdd = {
        ...interventionData,
        photos: photoUrls,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email,
        status: 'todo',
        messages: [],
        suppliesNeeded: [],
        history: [{
          id: `history_${Date.now()}`,
          status: 'todo',
          date: new Date().toISOString(),
          by: user.uid,
          byName: user.name || user.email,
          comment: 'Intervention créée'
        }]
      };

      const docRef = await addDoc(collection(db, 'interventions'), interventionToAdd);

      // ✨ PHASE 2: Notifier le technicien assigné
      if (interventionData.assignedTo) {
        const locationText = interventionData.rooms 
          ? (interventionData.rooms.length > 1 
              ? `Chambres ${interventionData.rooms[0]}-${interventionData.rooms[interventionData.rooms.length-1]}` 
              : `Chambre ${interventionData.rooms[0]}`)
          : (interventionData.location || '');

        await notificationService.notifyNewIntervention(
          {
            ...interventionData,
            id: docRef.id,
            location: locationText
          },
          interventionData.assignedTo
        );

        toast.success('Intervention créée et technicien notifié');
      } else {
        toast.success('Intervention créée avec succès');
      }

      setIsCreateInterventionModalOpen(false);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur création intervention:', error);
      toast.error('Erreur lors de la création', { description: error.message });
      return { success: false, error: error.message };
    }
  };

  const handleUpdateIntervention = async (interventionId, updates, photos = []) => {
    try {
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

      if (photoUrls.length > 0) {
        const intervention = interventions.find(i => i.id === interventionId);
        updateData.photos = [...(intervention?.photos || []), ...photoUrls];
      }

      if (updates.status) {
        const intervention = interventions.find(i => i.id === interventionId);
        const currentHistory = intervention?.history || [];
        
        updateData.history = [
          ...currentHistory,
          {
            id: `history_${Date.now()}`,
            status: updates.status,
            date: new Date().toISOString(),
            by: user.uid,
            byName: user.name || user.email,
            comment: updates.comment || `Statut changé en ${updates.status}`
          }
        ];

        // ✨ PHASE 2: Notifier selon le changement de statut
        if (updates.status === 'completed' && intervention.createdBy !== user.uid) {
          await notificationService.notifyInterventionUpdate(
            intervention,
            intervention.createdBy,
            `L'intervention ${intervention.missionSummary} est terminée`
          );
        }
      }

      // ✨ PHASE 2: Notifier si réassignation
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
      console.error('❌ Erreur mise à jour intervention:', error);
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
      console.error('❌ Erreur blocage chambre:', error);
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
                onEditUser={handleEditUser}  // ← Pour OUVRIR le modal
                onUpdateUser={updateUser}  // ← ✅ AJOUTER : Pour SAUVEGARDER
                onDeleteUser={handleDeleteUser}
                onUpdateUserPassword={handleUpdateUserPassword}
                onActivateUser={activateUser}  // ← ✅ AJOUTER
                onResetPassword={resetPassword}  // ← ✅ AJOUTER
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
          onClose={handleCloseInterventionModal}
          onUpdate={async (updates, photos = []) => {
            const result = await handleUpdateIntervention(
              selectedIntervention.id, 
              updates, 
              photos
            );
            return result;
          }}
          onSendMessage={async (message, photos = []) => {
            try {
              let photoUrls = [];
              if (photos && photos.length > 0) {
                for (const photo of photos) {
                  const storageRef = ref(
                    storage, 
                    `interventions/${selectedIntervention.id}/messages/${Date.now()}_${photo.name}`
                  );
                  const snapshot = await uploadBytes(storageRef, photo);
                  const downloadURL = await getDownloadURL(snapshot.ref);
                  photoUrls.push(downloadURL);
                }
              }

              const interventionRef = doc(db, 'interventions', selectedIntervention.id);
              const interventionSnap = await getDoc(interventionRef);
              
              if (!interventionSnap.exists()) {
                throw new Error('Intervention non trouvée');
              }

              const currentData = interventionSnap.data();
              const currentMessages = currentData.messages || [];

              const newMessage = {
                id: `msg_${Date.now()}`,
                text: message,
                photos: photoUrls,
                senderId: user.uid,
                senderName: user.name || user.email,
                timestamp: new Date(),
                read: false
              };

              await updateDoc(interventionRef, {
                messages: [...currentMessages, newMessage],
                updatedAt: serverTimestamp(),
                updatedBy: user.uid
              });

              // ✨ PHASE 2: Notifier le destinataire du nouveau message
              const recipientId = selectedIntervention.assignedTo === user.uid 
                ? selectedIntervention.createdBy 
                : selectedIntervention.assignedTo;
              
              if (recipientId && recipientId !== user.uid) {
                await notificationService.notifyNewMessage(
                  selectedIntervention,
                  recipientId,
                  user.name || user.email,
                  message
                );
              }

              toast.success('Message envoyé');

              return { success: true };
            } catch (error) {
              console.error('❌ Erreur envoi message:', error);
              toast.error('Erreur lors de l\'envoi', { description: error.message });
              return { success: false, error: error.message };
            }
          }}
          onAddSupply={async (supply) => {
            try {
              const interventionRef = doc(db, 'interventions', selectedIntervention.id);
              const interventionSnap = await getDoc(interventionRef);
              
              if (!interventionSnap.exists()) {
                throw new Error('Intervention non trouvée');
              }

              const currentData = interventionSnap.data();
              const currentSupplies = currentData.suppliesNeeded || [];

              const newSupply = {
                id: `supply_${Date.now()}`,
                ...supply,
                ordered: false,
                addedAt: new Date(),
                addedBy: user.uid,
                addedByName: user.name || user.email
              };

              await updateDoc(interventionRef, {
                suppliesNeeded: [...currentSupplies, newSupply],
                updatedAt: serverTimestamp(),
                updatedBy: user.uid
              });

              toast.success(`${supply.name} ajouté à la liste`);

              return { success: true };
            } catch (error) {
              console.error('❌ Erreur ajout fourniture:', error);
              toast.error('Erreur lors de l\'ajout', { description: error.message });
              return { success: false, error: error.message };
            }
          }}
          onRemoveSupply={async (supplyIndex) => {
            try {
              const interventionRef = doc(db, 'interventions', selectedIntervention.id);
              const interventionSnap = await getDoc(interventionRef);
              
              if (!interventionSnap.exists()) {
                throw new Error('Intervention non trouvée');
              }

              const currentData = interventionSnap.data();
              const currentSupplies = currentData.suppliesNeeded || [];
              
              const updatedSupplies = currentSupplies.filter((_, index) => index !== supplyIndex);

              await updateDoc(interventionRef, {
                suppliesNeeded: updatedSupplies,
                updatedAt: serverTimestamp(),
                updatedBy: user.uid
              });

              toast.success('Fourniture supprimée');

              return { success: true };
            } catch (error) {
              console.error('❌ Erreur suppression fourniture:', error);
              toast.error('Erreur lors de la suppression', { description: error.message });
              return { success: false, error: error.message };
            }
          }}
          onToggleSupplyStatus={async (supplyIndex) => {
            try {
              const interventionRef = doc(db, 'interventions', selectedIntervention.id);
              const interventionSnap = await getDoc(interventionRef);
              
              if (!interventionSnap.exists()) {
                throw new Error('Intervention non trouvée');
              }

              const currentData = interventionSnap.data();
              const currentSupplies = currentData.suppliesNeeded || [];
              
              const updatedSupplies = currentSupplies.map((supply, index) => {
                if (index === supplyIndex) {
                  return { ...supply, ordered: !supply.ordered };
                }
                return supply;
              });

              await updateDoc(interventionRef, {
                suppliesNeeded: updatedSupplies,
                updatedAt: serverTimestamp(),
                updatedBy: user.uid
              });

              return { success: true };
            } catch (error) {
              console.error('❌ Erreur changement statut fourniture:', error);
              return { success: false, error: error.message };
            }
          }}
          onToggleRoomBlock={handleToggleRoomBlock}
          onAddLocation={handleAddDropdownItem}
          user={user}
          users={users}
          dropdowns={data}
          blockedRooms={blockedRooms}
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
          adminData={data}
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

      {/* ✨ NOUVEAU : Container de Toast optimisé */}
      <ToastContainer 
        toasts={toastInstance.toasts} 
        onRemove={toastInstance.removeToast} 
      />

      {/* ✨ PHASE 2: Prompt de notifications (affiché uniquement si utilisateur connecté) */}
      {user && <NotificationPrompt />}
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;