// Service de gestion des données hors ligne
export const offlineService = {
  // Sauvegarder des données localement
  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde hors ligne:', error);
      return false;
    }
  },

  // Charger des données sauvegardées
  loadData(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Erreur chargement données hors ligne:', error);
      return defaultValue;
    }
  },

  // ✅ AJOUT : Obtenir les actions en attente
  getPendingActions() {
    return this.loadData('pendingActions', []);
  },

  // Sauvegarder une action en attente
  savePendingAction(action) {
    const pendingActions = this.getPendingActions();
    const newAction = {
      ...action,
      id: `pending_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    pendingActions.push(newAction);
    this.saveData('pendingActions', pendingActions);
    return newAction;
  },

  // Charger les actions en attente (alias pour compatibilité)
  loadPendingActions() {
    return this.getPendingActions();
  },

  // Supprimer une action en attente
  removePendingAction(actionId) {
    const pendingActions = this.getPendingActions();
    const filteredActions = pendingActions.filter(action => action.id !== actionId);
    this.saveData('pendingActions', filteredActions);
    return true;
  },

  // ✅ AJOUT : Vider les actions en attente
  clearPendingActions() {
    this.saveData('pendingActions', []);
    return true;
  },

  // Vider toutes les données hors ligne
  clearAllData() {
    try {
      localStorage.removeItem('pendingActions');
      localStorage.removeItem('offlineInterventions');
      localStorage.removeItem('offlineBlockedRooms');
      return true;
    } catch (error) {
      console.error('Erreur suppression données hors ligne:', error);
      return false;
    }
  }
};