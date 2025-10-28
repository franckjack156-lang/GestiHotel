import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config/firebase';

// ✅ IMPORT CORRIGÉ - Depuis services/index.js
import { 
  authService, 
  interventionService, 
  storageService, 
  userService 
} from './services';

// Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import DashboardView from './components/Dashboard/DashboardView';
import InterventionsView from './components/Interventions/InterventionsView';
import LogementsView from './components/Logements/LogementsView';
import UsersView from './components/Users/UsersView';
import SettingsView from './components/Settings/SettingsView';
import LoginForm from './components/Auth/LoginForm';
import CreateInterventionModal from './components/Interventions/CreateInterventionModal';
import InterventionDetailModal from './components/Interventions/InterventionDetailModal';
import UnifiedUserModal from './components/Users/UnifiedUserModal';
import Toast from './components/Common/Toast';
import { Loader2 } from 'lucide-react';

function App() {
  // État
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [logements, setLogements] = useState([]);
  const [users, setUsers] = useState([]);
  const [isCreateInterventionModalOpen, setIsCreateInterventionModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);

  // Toast system
  const addToast = (toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), toast.duration || 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await authService.getUserData(authUser.uid);
          if (userDoc) {
            setUser({ ...userDoc, uid: authUser.uid });
          } else {
            setUser(null);
            await authService.logout();
          }
        } catch (error) {
          console.error('Erreur récupération utilisateur:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Interventions listener
  useEffect(() => {
    if (!user) return;
    let q;
    if (user.role === 'admin') {
      q = query(collection(db, 'interventions'), orderBy('createdAt', 'desc'));
    } else if (user.role === 'technician') {
      q = query(collection(db, 'interventions'), where('assignedTo', '==', user.uid), orderBy('createdAt', 'desc'));
    } else {
      return;
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInterventions(data);
    }, (error) => {
      console.error('Erreur listener interventions:', error);
      addToast({ type: 'error', message: 'Erreur de synchronisation' });
    });
    return () => unsubscribe();
  }, [user]);

  // Logements listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'logements'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogements(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Users listener
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const q = query(collection(db, 'users'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Handlers - Interventions
  const handleCreateIntervention = async (interventionData, photos) => {
    try {
      let photoUrls = [];
      if (photos && photos.length > 0) {
        const tempId = `temp_${Date.now()}`;
        const uploadResults = await storageService.uploadMultiple(photos, `interventions/${tempId}`);
        if (uploadResults.success) {
          photoUrls = uploadResults.urls;
        }
      }
      const intervention = {
        ...interventionData,
        status: 'todo',
        photos: photoUrls,
        messages: [],
        suppliesNeeded: [],
        history: [{
          id: `history_${Date.now()}`,
          status: 'todo',
          date: new Date(),
          by: user.uid,
          byName: user.name || user.email,
          comment: photoUrls.length > 0 ? `Intervention créée avec ${photoUrls.length} photo(s)` : 'Intervention créée',
          fields: []
        }],
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email
      };
      const docRef = await addDoc(collection(db, 'interventions'), intervention);
      setIsCreateInterventionModalOpen(false);
      addToast({ type: 'success', title: 'Intervention créée', message: photoUrls.length > 0 ? `Intervention créée avec ${photoUrls.length} photo(s)` : 'Nouvelle intervention ajoutée' });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erreur création intervention:', error);
      addToast({ type: 'error', message: 'Erreur lors de la création' });
      return { success: false, error: error.message };
    }
  };

  const handleSendMessage = (intervention) => async (messageText, photos = []) => {
    if (!messageText.trim() && photos.length === 0) return { success: false };
    try {
      const interventionRef = doc(db, 'interventions', intervention.id);
      const interventionSnap = await getDoc(interventionRef);
      if (!interventionSnap.exists()) throw new Error('Intervention non trouvée');
      const currentData = interventionSnap.data();
      const currentMessages = currentData.messages || [];
      let photoUrls = [];
      if (photos && photos.length > 0) {
        const uploadResults = await storageService.uploadMultiple(photos, `interventions/${intervention.id}/messages`);
        if (uploadResults.success) photoUrls = uploadResults.urls;
      }
      const newMessageObj = {
        id: `msg_${Date.now()}`,
        text: messageText.trim(),
        type: photoUrls.length > 0 ? 'photo' : 'text',
        photos: photoUrls,
        senderId: user.uid,
        senderName: user.name || user.email,
        timestamp: new Date(),
        read: false
      };
      await updateDoc(interventionRef, {
        messages: [...currentMessages, newMessageObj],
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      addToast({ type: 'success', title: 'Message envoyé', message: photoUrls.length > 0 ? `Message envoyé avec ${photoUrls.length} photo(s)` : 'Message envoyé' });
      return { success: true };
    } catch (error) {
      console.error('Erreur envoi message:', error);
      addToast({ type: 'error', message: 'Erreur lors de l\'envoi' });
      return { success: false, error: error.message };
    }
  };

  const handleUpdateIntervention = (intervention) => async (updates, photos = []) => {
    try {
      const interventionRef = doc(db, 'interventions', intervention.id);
      const interventionSnap = await getDoc(interventionRef);
      if (!interventionSnap.exists()) throw new Error('Intervention non trouvée');
      const currentData = interventionSnap.data();
      const currentHistory = currentData.history || [];
      let newPhotoUrls = [];
      if (photos && photos.length > 0) {
        const uploadResults = await storageService.uploadMultiple(photos, `interventions/${intervention.id}`);
        if (uploadResults.success) newPhotoUrls = uploadResults.urls;
      }
      let historyComment = '';
      let newStatus = updates.status;
      if (updates.status) {
        const statusLabels = { todo: 'À faire', inprogress: 'En cours', ordering: 'En commande', completed: 'Terminée', cancelled: 'Annulée' };
        historyComment = `Statut changé à "${statusLabels[updates.status]}"`;
      } else if (updates.assignedTo) {
        historyComment = `Réassignée à ${updates.assignedToName || 'un technicien'}`;
      } else if (updates.techComment) {
        historyComment = 'Commentaire technicien mis à jour';
      } else if (newPhotoUrls.length > 0) {
        historyComment = `${newPhotoUrls.length} photo(s) ajoutée(s)`;
      } else {
        historyComment = 'Intervention mise à jour';
      }
      const newHistoryEntry = {
        id: `history_${Date.now()}`,
        status: newStatus || currentData.status,
        date: new Date(),
        by: user.uid,
        byName: user.name || user.email,
        comment: historyComment,
        fields: Object.keys(updates)
      };
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedByName: user.name || user.email,
        history: [...currentHistory, newHistoryEntry]
      };
      if (newPhotoUrls.length > 0) {
        const currentPhotos = currentData.photos || [];
        updateData.photos = [...currentPhotos, ...newPhotoUrls];
      }
      await updateDoc(interventionRef, updateData);
      addToast({ type: 'success', message: historyComment });
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour intervention:', error);
      addToast({ type: 'error', message: 'Erreur lors de la mise à jour' });
      return { success: false, error: error.message };
    }
  };

  const handleAddSupply = (intervention) => async (supply) => {
    try {
      const interventionRef = doc(db, 'interventions', intervention.id);
      const interventionSnap = await getDoc(interventionRef);
      if (!interventionSnap.exists()) throw new Error('Intervention non trouvée');
      const currentData = interventionSnap.data();
      const currentSupplies = currentData.suppliesNeeded || [];
      const currentHistory = currentData.history || [];
      const newSupply = { ...supply, ordered: false, addedAt: new Date(), addedBy: user.uid, addedByName: user.name || user.email };
      const newHistoryEntry = {
        id: `history_${Date.now()}`,
        status: currentData.status,
        date: new Date(),
        by: user.uid,
        byName: user.name || user.email,
        comment: `Fourniture ajoutée: ${supply.name}`,
        fields: ['suppliesNeeded']
      };
      await updateDoc(interventionRef, {
        suppliesNeeded: [...currentSupplies, newSupply],
        history: [...currentHistory, newHistoryEntry],
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      addToast({ type: 'success', message: 'Fourniture ajoutée' });
      return { success: true };
    } catch (error) {
      console.error('Erreur ajout fourniture:', error);
      addToast({ type: 'error', message: 'Erreur lors de l\'ajout' });
      return { success: false, error: error.message };
    }
  };

  const handleRemoveSupply = (intervention) => async (index) => {
    try {
      const interventionRef = doc(db, 'interventions', intervention.id);
      const interventionSnap = await getDoc(interventionRef);
      if (!interventionSnap.exists()) throw new Error('Intervention non trouvée');
      const currentData = interventionSnap.data();
      const currentSupplies = currentData.suppliesNeeded || [];
      const currentHistory = currentData.history || [];
      const removedSupply = currentSupplies[index];
      const updatedSupplies = currentSupplies.filter((_, i) => i !== index);
      const newHistoryEntry = {
        id: `history_${Date.now()}`,
        status: currentData.status,
        date: new Date(),
        by: user.uid,
        byName: user.name || user.email,
        comment: `Fourniture retirée: ${removedSupply.name}`,
        fields: ['suppliesNeeded']
      };
      await updateDoc(interventionRef, {
        suppliesNeeded: updatedSupplies,
        history: [...currentHistory, newHistoryEntry],
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      addToast({ type: 'success', message: 'Fourniture retirée' });
      return { success: true };
    } catch (error) {
      console.error('Erreur retrait fourniture:', error);
      addToast({ type: 'error', message: 'Erreur lors du retrait' });
      return { success: false, error: error.message };
    }
  };

  const handleToggleSupplyStatus = (intervention) => async (index) => {
    try {
      const interventionRef = doc(db, 'interventions', intervention.id);
      const interventionSnap = await getDoc(interventionRef);
      if (!interventionSnap.exists()) throw new Error('Intervention non trouvée');
      const currentData = interventionSnap.data();
      const currentSupplies = currentData.suppliesNeeded || [];
      const currentHistory = currentData.history || [];
      const updatedSupplies = [...currentSupplies];
      updatedSupplies[index] = { ...updatedSupplies[index], ordered: !updatedSupplies[index].ordered };
      const newHistoryEntry = {
        id: `history_${Date.now()}`,
        status: currentData.status,
        date: new Date(),
        by: user.uid,
        byName: user.name || user.email,
        comment: `Fourniture ${updatedSupplies[index].ordered ? 'commandée' : 'non commandée'}: ${updatedSupplies[index].name}`,
        fields: ['suppliesNeeded']
      };
      await updateDoc(interventionRef, {
        suppliesNeeded: updatedSupplies,
        history: [...currentHistory, newHistoryEntry],
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur toggle fourniture:', error);
      return { success: false, error: error.message };
    }
  };

  const handleDeleteIntervention = async (interventionId) => {
    try {
      await deleteDoc(doc(db, 'interventions', interventionId));
      addToast({ type: 'success', message: 'Intervention supprimée' });
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression intervention:', error);
      addToast({ type: 'error', message: 'Erreur lors de la suppression' });
      return { success: false, error: error.message };
    }
  };

  // Handlers - Logements
  const handleCreateLogement = async (logementData) => {
    try {
      const logement = { ...logementData, createdAt: serverTimestamp(), createdBy: user.uid, createdByName: user.name || user.email };
      await addDoc(collection(db, 'logements'), logement);
      addToast({ type: 'success', message: 'Logement créé' });
      return { success: true };
    } catch (error) {
      console.error('Erreur création logement:', error);
      addToast({ type: 'error', message: 'Erreur lors de la création' });
      return { success: false, error: error.message };
    }
  };

  const handleUpdateLogement = async (logementId, updates) => {
    try {
      await updateDoc(doc(db, 'logements', logementId), { ...updates, updatedAt: serverTimestamp(), updatedBy: user.uid, updatedByName: user.name || user.email });
      addToast({ type: 'success', message: 'Logement mis à jour' });
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour logement:', error);
      addToast({ type: 'error', message: 'Erreur lors de la mise à jour' });
      return { success: false, error: error.message };
    }
  };

  const handleDeleteLogement = async (logementId) => {
    try {
      await deleteDoc(doc(db, 'logements', logementId));
      addToast({ type: 'success', message: 'Logement supprimé' });
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression logement:', error);
      addToast({ type: 'error', message: 'Erreur lors de la suppression' });
      return { success: false, error: error.message };
    }
  };

  // Handlers - Users
  const handleUserModalSubmit = async (data) => {
    try {
      let result;
      if (userModalMode === 'create') {
        result = await userService.create(data);
        if (result.success) {
          addToast({ type: 'success', title: 'Utilisateur créé', message: `Le compte de ${data.name} a été créé` });
          setIsUserModalOpen(false);
          setSelectedUser(null);
          return { success: true };
        }
      } else if (userModalMode === 'edit') {
        await updateDoc(doc(db, 'users', selectedUser.id), { ...data, updatedAt: serverTimestamp(), updatedBy: user.uid, updatedByName: user.name || user.email });
        addToast({ type: 'success', message: `Profil de ${data.name} mis à jour` });
        setIsUserModalOpen(false);
        setSelectedUser(null);
        return { success: true };
      } else if (userModalMode === 'password') {
        result = await userService.updatePassword(selectedUser.id, data);
        if (result.success) {
          addToast({ type: 'success', title: 'Mot de passe modifié', message: `Mot de passe de ${selectedUser.name} changé` });
          setIsUserModalOpen(false);
          setSelectedUser(null);
          return { success: true };
        }
      }
      throw new Error(result?.error || 'Opération échouée');
    } catch (error) {
      console.error('Erreur opération utilisateur:', error);
      addToast({ type: 'error', title: 'Erreur', message: error.message || 'Erreur' });
      return { success: false, error: error.message };
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const result = await userService.delete(userId);
      if (result.success) {
        addToast({ type: 'success', message: 'Utilisateur supprimé' });
        return { success: true };
      }
      throw new Error(result.error || 'Erreur de suppression');
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      addToast({ type: 'error', message: error.message || 'Erreur' });
      return { success: false, error: error.message };
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { active: !currentStatus, updatedAt: serverTimestamp(), updatedBy: user.uid });
      addToast({ type: 'success', message: `Utilisateur ${!currentStatus ? 'activé' : 'désactivé'}` });
      return { success: true };
    } catch (error) {
      console.error('Erreur toggle utilisateur:', error);
      addToast({ type: 'error', message: 'Erreur' });
      return { success: false, error: error.message };
    }
  };

  // Auth handlers
  const handleLogin = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      if (!result.success) {
        addToast({ type: 'error', message: result.error || 'Erreur de connexion' });
        return result;
      }
      addToast({ type: 'success', title: 'Connexion réussie', message: `Bienvenue ${result.user.name}!` });
      return result;
    } catch (error) {
      console.error('Erreur login:', error);
      addToast({ type: 'error', message: 'Erreur de connexion' });
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setCurrentView('dashboard');
      addToast({ type: 'success', message: 'Déconnexion réussie' });
    } catch (error) {
      console.error('Erreur logout:', error);
      addToast({ type: 'error', message: 'Erreur' });
    }
  };

  // Render
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginForm onLogin={handleLogin} />
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={handleLogout} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          {currentView === 'dashboard' && <DashboardView interventions={interventions} logements={logements} users={users} user={user} />}
          {currentView === 'interventions' && <InterventionsView interventions={interventions} logements={logements} users={users} user={user} onCreateIntervention={() => setIsCreateInterventionModalOpen(true)} onSelectIntervention={setSelectedIntervention} onDeleteIntervention={handleDeleteIntervention} />}
          {currentView === 'logements' && <LogementsView logements={logements} user={user} onCreateLogement={handleCreateLogement} onUpdateLogement={handleUpdateLogement} onDeleteLogement={handleDeleteLogement} />}
          {currentView === 'users' && user.role === 'admin' && <UsersView users={users} currentUser={user} onCreateUser={() => { setUserModalMode('create'); setSelectedUser(null); setIsUserModalOpen(true); }} onEditUser={(u) => { setUserModalMode('edit'); setSelectedUser(u); setIsUserModalOpen(true); }} onChangePassword={(u) => { setUserModalMode('password'); setSelectedUser(u); setIsUserModalOpen(true); }} onDeleteUser={handleDeleteUser} onToggleUserStatus={handleToggleUserStatus} />}
          {currentView === 'settings' && <SettingsView user={user} />}
        </main>
      </div>
      {isCreateInterventionModalOpen && <CreateInterventionModal onClose={() => setIsCreateInterventionModalOpen(false)} onSubmit={handleCreateIntervention} logements={logements} users={users.filter(u => u.role === 'technician' && u.active)} user={user} />}
      {selectedIntervention && <InterventionDetailModal intervention={selectedIntervention} onClose={() => setSelectedIntervention(null)} onUpdate={handleUpdateIntervention(selectedIntervention)} onSendMessage={handleSendMessage(selectedIntervention)} onAddSupply={handleAddSupply(selectedIntervention)} onRemoveSupply={handleRemoveSupply(selectedIntervention)} onToggleSupplyStatus={handleToggleSupplyStatus(selectedIntervention)} user={user} users={users} />}
      {isUserModalOpen && <UnifiedUserModal mode={userModalMode} user={selectedUser} onClose={() => { setIsUserModalOpen(false); setSelectedUser(null); }} onSubmit={handleUserModalSubmit} />}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}

export default App;