import React from 'react';
import { Search, Plus, MapPin, Camera } from 'lucide-react';

const InterventionsView = ({ 
  interventions = [], // ✅ Valeur par défaut
  onInterventionClick, 
  onCreateClick,
  searchTerm = '', // ✅ Valeur par défaut
  onSearchChange,
  filterStatus = 'all', // ✅ Valeur par défaut
  onFilterChange 
}) => {
  // ✅ Validation des données avec des vérifications de sécurité
  const filteredInterventions = interventions.filter(intervention => {
    // Vérifier que l'intervention existe
    if (!intervention) return false;
    
    // Recherche avec vérifications de sécurité
    const matchesSearch = 
      (intervention.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (intervention.missionSummary?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (intervention.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    // Filtre par statut
    const matchesStatus = filterStatus === 'all' || intervention.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: interventions.length,
    todo: interventions.filter(i => i?.status === 'todo').length,
    inprogress: interventions.filter(i => i?.status === 'inprogress').length,
    ordering: interventions.filter(i => i?.status === 'ordering').length,
    completed: interventions.filter(i => i?.status === 'completed').length,
    cancelled: interventions.filter(i => i?.status === 'cancelled').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'inprogress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'ordering': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'normal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et filtres */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par localisation ou description..."
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange && onFilterChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous ({statusCounts.all})</option>
            <option value="todo">À faire ({statusCounts.todo})</option>
            <option value="inprogress">En cours ({statusCounts.inprogress})</option>
            <option value="ordering">En commande ({statusCounts.ordering})</option>
            <option value="completed">Terminées ({statusCounts.completed})</option>
            <option value="cancelled">Annulées ({statusCounts.cancelled})</option>
          </select>
          
          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nouvelle intervention</span>
            </button>
          )}
        </div>
      </div>

      {/* Liste des interventions */}
      <div className="grid gap-4">
        {filteredInterventions.map(intervention => (
          <div
            key={intervention.id}
            onClick={() => onInterventionClick && onInterventionClick(intervention)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition cursor-pointer group border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <MapPin size={18} className="text-gray-500 flex-shrink-0" />
                  <span className="font-semibold text-gray-800 dark:text-white text-lg">
                    {intervention.location || 'Sans localisation'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                    {intervention.roomType || 'Non spécifié'}
                  </span>
                  {intervention.priority && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(intervention.priority)}`}>
                      {intervention.priority}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {intervention.missionSummary || intervention.description || 'Pas de description'}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>#{intervention.id.slice(-8).toUpperCase()}</span>
                  <span>
                    Créée le {intervention.createdAt?.toLocaleDateString?.('fr-FR') || 'Date inconnue'}
                  </span>
                  {intervention.assignedToName && (
                    <span>Assignée à {intervention.assignedToName}</span>
                  )}
                </div>
              </div>
              
              <div className="text-right ml-4 flex-shrink-0">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(intervention.status)}`}>
                  {getStatusText(intervention.status)}
                </span>
                
                {intervention.photos && intervention.photos.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-gray-500 dark:text-gray-400">
                    <Camera size={14} />
                    <span className="text-xs">{intervention.photos.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredInterventions.length === 0 && (
          <div className="text-center py-12">
            <MapPin size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              Aucune intervention trouvée
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Essayez de modifier vos critères de recherche' 
                : 'Créez votre première intervention'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterventionsView;