// src/App.jsx - VERSION CORRIGÉE FINALE

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  arrayUnion,
  Timestamp  
} from 'firebase/firestore';
import { db } from './config/firebase';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Analytics
import { setAnalyticsUser, analyticsEvents } from './config/firebase';
import ErrorBoundary from './components/common/ErrorBoundary';

// Hooks
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
import UsersManagementView from './components/Users/UsersManagementView';

// Modals
import AuthScreen from './components/Auth/AuthScreen';
import LoadingSpinner from './components/common/LoadingSpinner';
import Toast from './components/common/Toast';
import UnifiedAdminModal from './components/Admin/UnifiedAdminModal';
import CreateInterventionModal from './components/Interventions/CreateInterventionModal';
import InterventionDetailModal from './components/Interventions/InterventionDetailModal';
import SettingsModal from './components/Settings/SettingsModal';
import UnifiedUserModal from './components/Users/UnifiedUserModal';

// Services
import { 
  interventionService, 
  userService,
  storageService 
} from './services/index';

// ========================================
// 🎯 HELPER: CRÉER UNE ENTRÉE D'HISTORIQUE
// ========================================
const createHistoryEntry = (status, comment, currentUser, fields = []) => ({
  id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  status: status || 'updated',
  date:  serverTimestamp(), 
  by: currentUser.uid,
  byName: currentUser.name || currentUser.email,
  comment: comment || 'Modification effectuée',
  fields: fields
});

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

  // Hooks de données
  const {
    data,
    loading: dataLoading,
    addItem,
    updateItem,
    deleteItem,
    toggleActive,
    getActiveItems
  } = useUnifiedData(user);

  const { settings, updateSettings, resetSettings } = useSettings(user);

  // États locaux
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
  
  const [userModalMode, setUserModalMode] = useState('create');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // ========================================
  // 📊 CHARGEMENT DES DONNÉES
  // ========================================
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('🔄 Chargement des données pour:', user.email);

    const unsubscribers = [];

    // ✅ INTERVENTIONS
    try {
      const interventionsQuery = query(
        collection(db, 'interventions'),
        orderBy('createdAt', 'desc')
      );
      
      const unsubInterventions = onSnapshot(
        interventionsQuery,
        (snapshot) => {
          const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            
            // Helper pour convertir les timestamps
            const convertTimestamp = (ts) => {
              if (!ts) return new Date();
              if (ts.toDate) return ts.toDate();
              if (ts instanceof Date) return ts;
              return new Date(ts);
            };

            return {
              id: doc.id,
              ...docData,
              createdAt: convertTimestamp(docData.createdAt),
              updatedAt: docData.updatedAt ? convertTimestamp(docData.updatedAt) : null,
              
              // Conversion messages
              messages: (docData.messages || []).map(msg => ({
                ...msg,
                timestamp: convertTimestamp(msg.timestamp)
              })),
              
              // Conversion history
              history: (docData.history || []).map(entry => ({
                ...entry,
                date: convertTimestamp(entry.date)
              }))
            };
          });

          console.log('✅ Interventions chargées:', data.length);
          setInterventions(data);
        },
        (error) => {
          console.error('❌ Erreur interventions:', error);
          addToast({ type: 'error', message: 'Erreur chargement interventions' });
        }
      );
      unsubscribers.push(unsubInterventions);
    } catch (error) {
      console.error('❌ Erreur setup interventions:', error);
    }

    // ✅ UTILISATEURS
    try {
      const usersQuery = query(collection(db, 'users'));
      
      const unsubUsers = onSnapshot(
        usersQuery,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('✅ Utilisateurs chargés:', data.length);
          setUsers(data);
        },
        (error) => {
          console.error('❌ Erreur utilisateurs:', error);
        }
      );
      unsubscribers.push(unsubUsers);
    } catch (error) {
      console.error('❌ Erreur setup utilisateurs:', error);
    }

    // ✅ CHAMBRES BLOQUÉES
    try {
      const roomsQuery = query(
        collection(db, 'blockedRooms'),
        where('blocked', '==', true)
      );
      
      const unsubRooms = onSnapshot(
        roomsQuery,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('✅ Chambres bloquées chargées:', data.length);
          setBlockedRooms(data);
        },
        (error) => {
          console.error('❌ Erreur chambres bloquées:', error);
        }
      );
      unsubscribers.push(unsubRooms);
    } catch (error) {
      console.error('❌ Erreur setup chambres:', error);
    }

    setLoading(false);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, addToast]);

  // ========================================
  // 📈 ANALYTICS
  // ========================================
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

  // ========================================
  // 🛠️ HANDLERS INTERVENTIONS
  // ========================================

  const handleInterventionClick = (intervention) => {
    setSelectedIntervention(intervention);
  };

  const handleCreateIntervention = async (interventionData, photos) => {
    try {
      // Créer l'historique initial
      const initialHistory = createHistoryEntry(
        'todo',
        'Intervention créée',
        user
      );

      // Créer l'intervention
      const intervention = {
        ...interventionData,
        status: 'todo',
        photos: [],
        messages: [],
        suppliesNeeded: [],
        history: [initialHistory],
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email
      };

      const result = await interventionService.create(intervention, user);

      if (!result.success) {
        throw new Error(result.error || 'Erreur création intervention');
      }

      const interventionId = result.id;

      // Upload des photos si présentes
      if (photos && photos.length > 0) {
        const uploadResults = await storageService.uploadMultiple(
          photos,
          `interventions/${interventionId}`
        );

        if (uploadResults.success && uploadResults.urls.length > 0) {
          await updateDoc(doc(db, 'interventions', interventionId), {
            photos: uploadResults.urls,
            history: arrayUnion(createHistoryEntry(
              'todo',
              `${uploadResults.urls.length} photo(s) ajoutée(s)`,
              user
            ))
          });
        }
      }

      setIsCreateInterventionModalOpen(false);
      addToast({ 
        type: 'success', 
        title: 'Intervention créée',
        message: photos && photos.length > 0 
          ? `Intervention créée avec ${photos.length} photo(s)` 
          : 'Nouvelle intervention ajoutée avec succès'
      });

      return { success: true, id: interventionId };
    } catch (error) {
      console.error('❌ Erreur création intervention:', error);
      addToast({ 
        type: 'error', 
        message: 'Erreur lors de la création de l\'intervention' 
      });
      return { success: false, error: error.message };
    }
  };

  const handleUpdateIntervention = async (interventionId, updates, photos = []) => {
    try {
      console.log('🔄 Mise à jour intervention:', interventionId, updates);

      // Récupérer l'intervention actuelle
      const interventionSnap = await getDocs(query(
        collection(db, 'interventions'),
        where('__name__', '==', interventionId)
      ));
      
      const currentIntervention = interventionSnap.docs[0]?.data();

      // Upload des nouvelles photos
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

      // Construire le commentaire d'historique
      let historyComment = '';
      const changedFields = [];

      // Analyser les changements
      if (updates.status && updates.status !== currentIntervention?.status) {
        const statusLabels = {
          todo: 'À faire',
          inprogress: 'En cours',
          ordering: 'En commande',
          completed: 'Terminée',
          cancelled: 'Annulée'
        };
        historyComment = `Statut changé: ${statusLabels[currentIntervention?.status] || 'Inconnu'} → ${statusLabels[updates.status]}`;
        changedFields.push('status');
      } else if (updates.assignedTo && updates.assignedTo !== currentIntervention?.assignedTo) {
        historyComment = `Réassignée à ${updates.assignedToName || 'un technicien'}`;
        changedFields.push('assignedTo');
      } else if (updates.techComment && updates.techComment !== currentIntervention?.techComment) {
        historyComment = 'Commentaire technicien mis à jour';
        changedFields.push('techComment');
      } else if (updates.priority && updates.priority !== currentIntervention?.priority) {
        historyComment = `Priorité changée: ${updates.priority}`;
        changedFields.push('priority');
      } else if (newPhotoUrls.length > 0) {
        historyComment = `${newPhotoUrls.length} photo(s) ajoutée(s)`;
        changedFields.push('photos');
      } else {
        historyComment = 'Intervention mise à jour';
      }

      // Préparer les données de mise à jour
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: user.name || user.email
      };

      // Ajouter les photos avec arrayUnion
      if (newPhotoUrls.length > 0) {
        updateData.photos = arrayUnion(...newPhotoUrls);
      }

      // Ajouter l'entrée d'historique
      const historyEntry = createHistoryEntry(
        updates.status || currentIntervention?.status || 'updated',
        historyComment,
        user,
        changedFields
      );

      updateData.history = arrayUnion(historyEntry);

      console.log('📝 Données de mise à jour:', updateData);

      // Effectuer la mise à jour
      await updateDoc(doc(db, 'interventions', interventionId), updateData);

      console.log('✅ Intervention mise à jour avec succès');

      addToast({ 
        type: 'success', 
        message: 'Intervention mise à jour avec succès' 
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur mise à jour intervention:', error);
      addToast({ 
        type: 'error', 
        message: `Erreur: ${error.message}` 
      });
      return { success: false, error: error.message };
    }
  };

  // ✅ NOUVEAU: Handler pour les messages
  const handleAddMessage = async (interventionId, messageText) => {
    try {
      if (!messageText.trim()) {
        addToast({ type: 'warning', message: 'Le message ne peut pas être vide' });
        return { success: false };
      }

      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: messageText.trim(),
        type: 'text',
        senderId: user.uid,
        senderName: user.name || user.email,
        timestamp: serverTimestamp(),
        read: false
      };

      // Mettre à jour avec arrayUnion
      await updateDoc(doc(db, 'interventions', interventionId), {
        messages: arrayUnion(message),
        history: arrayUnion(createHistoryEntry(
          null,
          `Nouveau message de ${user.name || user.email}`,
          user,
          ['messages']
        ))
      });

      console.log('✅ Message ajouté avec succès');
      
      addToast({ 
        type: 'success', 
        message: 'Message envoyé' 
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur ajout message:', error);
      addToast({ 
        type: 'error', 
        message: 'Erreur lors de l\'envoi du message' 
      });
      return { success: false, error: error.message };
    }
  };

  const handleToggleRoomBlock = async (room, reason) => {
    try {
      const roomDoc = blockedRooms.find(r => r.room === room);
      
      if (roomDoc) {
        await updateDoc(doc(db, 'blockedRooms', roomDoc.id), {
          blocked: false,
          unblockedAt: serverTimestamp(),
          unblockedBy: user.uid
        });
      } else {
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

  // ========================================
  // 👤 HANDLERS UTILISATEURS
  // ========================================

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

  // ========================================
  // 🎨 CHARGEMENT & RENDU
  // ========================================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Stats pour analytics
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
            {/* VUES */}
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
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Localisations</div>
                    <div className="text-2xl font-bold">{data.locations?.length || 0}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Techniciens</div>
                    <div className="text-2xl font-bold">{data.technicians?.length || 0}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fournisseurs</div>
                    <div className="text-2xl font-bold">{data.suppliers?.length || 0}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Équipements</div>
                    <div className="text-2xl font-bold">{data.equipment?.length || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Notifications */}
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
          onAddMessage={handleAddMessage}
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

// ========================================
// 🎯 APP PRINCIPALE
// ========================================
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