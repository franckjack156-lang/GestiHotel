import React, { useMemo } from 'react';
import InitializeDatabaseButton from '../Admin/InitializeDatabaseButton';
import { 
  ClipboardList, 
  Clock, 
  Calendar, 
  AlertCircle, 
  MapPin,
  Home,
  Lock
} from 'lucide-react';

const DashboardView = ({ 
  interventions, 
  blockedRooms, 
  onInterventionClick 
}) => {
  // ✅ CORRECTION : Filtrer uniquement les chambres avec blocked === true
  const actuallyBlockedRooms = useMemo(() => {
    return blockedRooms.filter(br => br.blocked === true);
  }, [blockedRooms]);

  const stats = {
    total: interventions.length,
    todo: interventions.filter(i => i.status === 'todo').length,
    inprogress: interventions.filter(i => i.status === 'inprogress').length,
    completed: interventions.filter(i => i.status === 'completed').length,
    blockedRooms: actuallyBlockedRooms.length // ✅ Utiliser le tableau filtré
  };

  const showInitButton = interventions.length === 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'inprogress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'ordering': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'todo': return 'À faire';
      case 'inprogress': return 'En cours';
      case 'ordering': return 'En commande';
      case 'completed': return 'Terminée';
      default: return 'Annulée';
    }
  };

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
            <Calendar size={24} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Chambres bloquées</p>
              <p className="text-2xl font-bold">{stats.blockedRooms}</p>
            </div>
            <Lock size={24} className="opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interventions récentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ClipboardList size={20} />
              Interventions récentes
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{interventions.length} au total</span>
          </div>
          <div className="space-y-3">
            {interventions.slice(0, 5).map(intervention => (
              <div
                key={intervention.id}
                onClick={() => onInterventionClick(intervention)}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition group border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-800 dark:text-white truncate">
                      {intervention.location}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {intervention.missionSummary || intervention.description}
                  </p>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(intervention.status)}`}>
                    {getStatusText(intervention.status)}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(intervention.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {interventions.length === 0 && (
              <div className="text-center py-12">
                <ClipboardList size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Aucune intervention</p>
              </div>
            )}
          </div>
        </div>

        {/* Chambres bloquées */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Lock size={20} />
              Chambres bloquées
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {actuallyBlockedRooms.length} bloquée{actuallyBlockedRooms.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {/* ✅ CORRECTION : Utiliser actuallyBlockedRooms */}
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
    </div>
  );
};

export default DashboardView;