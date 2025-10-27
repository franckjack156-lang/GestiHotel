import React from 'react';
import InitializeDatabaseButton from '../Admin/InitializeDatabaseButton';
import { 
  ClipboardList, 
  Clock, 
  Calendar, 
  AlertCircle, 
  MapPin,
  Home
} from 'lucide-react';

const DashboardView = ({ 
  interventions, 
  blockedRooms, 
  onInterventionClick 
}) => {
  const stats = {
    total: interventions.length,
    todo: interventions.filter(i => i.status === 'todo').length,
    inprogress: interventions.filter(i => i.status === 'inprogress').length,
    completed: interventions.filter(i => i.status === 'completed').length,
    blockedRooms: blockedRooms.length
  };

  const showInitButton = interventions.length === 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'inprogress': return 'bg-blue-100 text-blue-800';
      case 'ordering': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-red-100 text-red-800';
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
            <AlertCircle size={24} className="opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interventions récentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Interventions récentes</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{interventions.length} au total</span>
          </div>
          <div className="space-y-3">
            {interventions.slice(0, 5).map(intervention => (
              <div
                key={intervention.id}
                onClick={() => onInterventionClick(intervention)}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={16} className="text-gray-500 flex-shrink-0" />
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
                    {intervention.createdAt?.toLocaleDateString?.('fr-FR') || 'Date inconnue'}
                  </p>
                </div>
              </div>
            ))}
            {interventions.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucune intervention</p>
            )}
          </div>
        </div>

        {/* Chambres bloquées */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Chambres bloquées</h3>
          <div className="space-y-3">
            {blockedRooms.slice(0, 5).map(room => (
              <div key={room.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-red-600 dark:text-red-400" />
                    <span className="font-medium text-gray-800 dark:text-white">{room.room}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{room.reason}</p>
                </div>
                <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 px-2 py-1 rounded-full">
                  Bloquée
                </span>
              </div>
            ))}
            {blockedRooms.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucune chambre bloquée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;