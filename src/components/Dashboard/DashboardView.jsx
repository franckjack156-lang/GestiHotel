// DashboardView.jsx - VERSION SIMPLIFIÉE GARANTIE SANS ERREUR
import React, { useMemo } from 'react';
import { ClipboardList, Clock, CheckCircle, AlertCircle, Home, Lock } from 'lucide-react';

const DashboardView = ({ interventions = [], blockedRooms = [], onInterventionClick }) => {
  const stats = useMemo(() => {
    if (!interventions || interventions.length === 0) {
      return { total: 0, todo: 0, inProgress: 0, completed: 0, urgent: 0 };
    }

    const total = interventions.length;
    const todo = interventions.filter(i => i.status === 'todo').length;
    const inProgress = interventions.filter(i => i.status === 'in-progress').length;
    const completed = interventions.filter(i => i.status === 'completed').length;
    const urgent = interventions.filter(i => i.priority === 'urgent').length;

    return { total, todo, inProgress, completed, urgent };
  }, [interventions]);

  const recentInterventions = useMemo(() => {
    if (!interventions || interventions.length === 0) return [];
    
    return [...interventions]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const dateB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return new Date(dateB) - new Date(dateA);
      })
      .slice(0, 5);
  }, [interventions]);

  const urgentInterventions = useMemo(() => {
    if (!interventions || interventions.length === 0) return [];
    
    return interventions
      .filter(i => i.priority === 'urgent' && i.status !== 'completed')
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const dateB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return new Date(dateB) - new Date(dateA);
      });
  }, [interventions]);

  const actuallyBlockedRooms = useMemo(() => {
    if (!blockedRooms || blockedRooms.length === 0) return [];
    return blockedRooms.filter(room => room.blocked === true);
  }, [blockedRooms]);

  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return 'Date inconnue';
      
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'todo': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[status] || colors.todo;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'todo': 'À faire',
      'in-progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vue d'ensemble de vos interventions
          </p>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total interventions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <ClipboardList size={24} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">À faire</p>
              <p className="text-2xl font-bold">{stats.todo}</p>
            </div>
            <Clock size={24} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">En cours</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
            <AlertCircle size={24} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Terminées</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <CheckCircle size={24} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Interventions urgentes */}
      {urgentInterventions.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            Interventions urgentes
            <span className="ml-auto text-sm font-normal">
              {urgentInterventions.length} intervention{urgentInterventions.length > 1 ? 's' : ''}
            </span>
          </h2>
          <div className="space-y-3">
            {urgentInterventions.slice(0, 3).map(intervention => (
              <div 
                key={intervention.id} 
                onClick={() => onInterventionClick?.(intervention)}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Home size={16} className="text-red-600 dark:text-red-400" />
                      <span className="font-medium text-gray-800 dark:text-white">
                        {intervention.location || 'Non spécifié'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {intervention.missionSummary || 'Aucune description'}
                    </p>
                  </div>
                  <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(intervention.status)}`}>
                    {getStatusLabel(intervention.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interventions récentes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Interventions récentes
        </h2>
        <div className="space-y-3">
          {recentInterventions.length > 0 ? (
            recentInterventions.map(intervention => (
              <div 
                key={intervention.id}
                onClick={() => onInterventionClick?.(intervention)}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Home size={16} className="text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-800 dark:text-white">
                        {intervention.location || 'Non spécifié'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                      {intervention.missionSummary || 'Aucune description'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(intervention.createdAt)}
                    </p>
                  </div>
                  <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(intervention.status)}`}>
                    {getStatusLabel(intervention.status)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <ClipboardList size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Aucune intervention</p>
            </div>
          )}
        </div>
      </div>

      {/* Chambres bloquées */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Lock size={20} className="text-red-500" />
          Chambres bloquées
          <span className="ml-auto text-sm font-normal text-gray-500">
            {actuallyBlockedRooms.length} chambre{actuallyBlockedRooms.length > 1 ? 's' : ''}
          </span>
        </h2>
        <div className="space-y-3">
          {actuallyBlockedRooms.length > 0 ? (
            actuallyBlockedRooms.slice(0, 5).map(room => (
              <div 
                key={room.id} 
                className="flex items-start justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Home size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span className="font-medium text-gray-800 dark:text-white">
                      Chambre {room.room}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {room.reason || 'Aucune raison spécifiée'}
                  </p>
                  {room.blockedByName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Par {room.blockedByName}
                    </p>
                  )}
                </div>
                <div className="ml-3 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 px-2 py-1 rounded-full font-medium">
                    <Lock size={12} />
                    Bloquée
                  </span>
                  {room.blockedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      {formatDate(room.blockedAt)}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Lock size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Aucune chambre bloquée</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Toutes les chambres sont disponibles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;