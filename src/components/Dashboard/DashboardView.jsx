import React, { useMemo } from 'react';
import { ClipboardList, Clock, CheckCircle, AlertCircle, Home, Lock } from 'lucide-react';
import ExportButton from '../common/ExportButton';
import InitializeDatabaseButton from './InitializeDatabaseButton';

const DashboardView = ({ interventions, blockedRooms, onInterventionClick }) => {
  const showInitButton = false;

  const stats = useMemo(() => {
    const total = interventions.length;
    const todo = interventions.filter(i => i.status === 'todo').length;
    const inProgress = interventions.filter(i => i.status === 'in-progress').length;
    const completed = interventions.filter(i => i.status === 'completed').length;
    const urgent = interventions.filter(i => i.priority === 'urgent').length;

    return { total, todo, inProgress, completed, urgent };
  }, [interventions]);

  const recentInterventions = useMemo(() => {
    return [...interventions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [interventions]);

  const urgentInterventions = useMemo(() => {
    return interventions
      .filter(i => i.priority === 'urgent' && i.status !== 'completed')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [interventions]);

  const actuallyBlockedRooms = useMemo(() => {
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

  return (
    <div className="space-y-6">
      {showInitButton && <InitializeDatabaseButton />}
      
      {/* ✅ En-tête avec bouton Export */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vue d'ensemble de vos interventions
          </p>
        </div>
        
        {/* ✅ Bouton Export */}
        <ExportButton
          data={interventions}
          type="dashboard"
          options={{
            title: 'Rapport tableau de bord',
            includeStats: true
          }}
        />
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
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Terminées</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <CheckCircle size={24} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Urgentes</p>
              <p className="text-2xl font-bold">{stats.urgent}</p>
            </div>
            <AlertCircle size={24} className="opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interventions récentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <ClipboardList size={20} />
            Interventions récentes
            <span className="ml-auto text-sm font-normal text-gray-500">
              {recentInterventions.length} dernière{recentInterventions.length > 1 ? 's' : ''}
            </span>
          </h2>
          <div className="space-y-3">
            {recentInterventions.map(intervention => (
              <div
                key={intervention.id}
                onClick={() => onInterventionClick(intervention)}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-800 dark:text-white text-sm">
                    {intervention.missionSummary}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    intervention.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    intervention.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {intervention.status === 'completed' ? 'Terminée' :
                     intervention.status === 'in-progress' ? 'En cours' : 'À faire'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span>{formatDate(intervention.createdAt)}</span>
                  <span>•</span>
                  <span>{intervention.rooms?.join(', ') || 'Non spécifié'}</span>
                </div>
              </div>
            ))}
            {recentInterventions.length === 0 && (
              <div className="text-center py-12">
                <ClipboardList size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Aucune intervention</p>
              </div>
            )}
          </div>
        </div>

        {/* Interventions urgentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" />
            Interventions urgentes
            <span className="ml-auto text-sm font-normal text-gray-500">
              {urgentInterventions.length} urgente{urgentInterventions.length > 1 ? 's' : ''}
            </span>
          </h2>
          <div className="space-y-3">
            {urgentInterventions.slice(0, 5).map(intervention => (
              <div
                key={intervention.id}
                onClick={() => onInterventionClick(intervention)}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:border-red-300 dark:hover:border-red-600 cursor-pointer transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-800 dark:text-white text-sm">
                    {intervention.missionSummary}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                    Urgent
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span>{formatDate(intervention.createdAt)}</span>
                  <span>•</span>
                  <span>{intervention.rooms?.join(', ') || 'Non spécifié'}</span>
                </div>
              </div>
            ))}
            {urgentInterventions.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle size={48} className="text-green-300 dark:text-green-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Aucune intervention urgente</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Tout est sous contrôle !
                </p>
              </div>
            )}
          </div>
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
          {actuallyBlockedRooms.slice(0, 5).map(room => (
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
          ))}
          {actuallyBlockedRooms.length === 0 && (
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