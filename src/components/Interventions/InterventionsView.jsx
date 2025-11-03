// src/components/Interventions/InterventionsView.jsx - VERSION OPTIMISÉE PHASE 1
import React, { useState, useMemo } from 'react';
import { Search, Plus, MapPin, Camera, AlertCircle, Wrench, Filter, Eye, Home, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const InterventionsView = ({ 
  interventions = [],
  onInterventionClick, 
  onCreateClick,
  searchTerm = '',
  onSearchChange,
  filterStatus = 'all',
  onFilterChange,
  dropdowns = {},
  // ✨ NOUVEAU Phase 1: Props pour pagination
  hasMore = false,
  onLoadMore,
  isLoadingMore = false
}) => {
  const { user } = useAuth();
  const [showAllInterventions, setShowAllInterventions] = useState(false);

  // ✅ Helper pour récupérer le label depuis les dropdowns
  const getRoomTypeLabel = (value) => {
    if (!value) return 'Non spécifié';
    const roomType = dropdowns.roomTypes?.find(rt => rt.value === value);
    return roomType?.name || value;
  };

  const getPriorityLabel = (value) => {
    if (!value) return '';
    const priority = dropdowns.priorities?.find(p => p.value === value);
    return priority?.name || value;
  };

  // ✅ Fonction pour formater l'affichage principal (support multi-chambres)
  const getMainDisplay = (intervention) => {
    const roomTypeLabel = getRoomTypeLabel(intervention.roomType);
    
    // Support nouveau format multi-chambres (rooms array)
    if (intervention.roomType === 'chambre' && intervention.rooms && intervention.rooms.length > 0) {
      if (intervention.rooms.length === 1) {
        return `${roomTypeLabel} ${intervention.rooms[0]}`;
      } else {
        return `${roomTypeLabel}s ${intervention.rooms[0]} - ${intervention.rooms[intervention.rooms.length - 1]} (${intervention.rooms.length})`;
      }
    }
    
    // Support format intermédiaire (locations array)
    if (intervention.roomType === 'chambre' && intervention.locations && intervention.locations.length > 0) {
      if (intervention.locations.length === 1) {
        return `${roomTypeLabel} ${intervention.locations[0]}`;
      } else {
        return `${roomTypeLabel}s ${intervention.locations[0]} - ${intervention.locations[intervention.locations.length - 1]} (${intervention.locations.length})`;
      }
    }
    
    // Support ancien format (location string) - rétrocompatibilité
    if (intervention.roomType === 'chambre' && intervention.location) {
      return `${roomTypeLabel} ${intervention.location}`;
    }
    
    return roomTypeLabel;
  };

  // ✨ FILTRAGE INTELLIGENT - Phase 1 optimisée
  const filteredInterventions = useMemo(() => {
    let result = interventions;

    // 1️⃣ Filtrage automatique par technicien assigné (CORRIGÉ ✅)
    if (user?.linkedTechnicianId && !showAllInterventions) {
      result = result.filter(intervention => {
        // Vérifier si l'intervention est assignée à ce technicien
        // On vérifie à la fois linkedTechnicianId et uid pour plus de flexibilité
        return intervention.assignedTo === user.linkedTechnicianId || 
               intervention.assignedTo === user.uid;
      });
    }

    // 2️⃣ Filtrage par recherche (support multi-formats)
    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(intervention => {
        if (!intervention) return false;
        
        // Support ancien format (location string)
        const oldLocation = (intervention.location || '').toLowerCase();
        
        // Support format intermédiaire (locations array)
        const newLocations = intervention.locations 
          ? intervention.locations.join(' ').toLowerCase() 
          : '';
        
        // Support format actuel (rooms array)
        const rooms = intervention.rooms
          ? intervention.rooms.join(' ').toLowerCase()
          : '';
        
        // Recherche dans tous les champs pertinents
        return oldLocation.includes(search) ||
               newLocations.includes(search) ||
               rooms.includes(search) ||
               (intervention.missionSummary?.toLowerCase() || '').includes(search) ||
               (intervention.description?.toLowerCase() || '').includes(search) ||
               (intervention.roomType?.toLowerCase() || '').includes(search) ||
               (intervention.assignedToName?.toLowerCase() || '').includes(search) ||
               (intervention.createdByName?.toLowerCase() || '').includes(search);
      });
    }
    
    // 3️⃣ Filtrage par statut
    if (filterStatus !== 'all') {
      result = result.filter(intervention => intervention.status === filterStatus);
    }
    
    return result;
  }, [interventions, user, showAllInterventions, searchTerm, filterStatus]);

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
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'normal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* ✨ Badge de filtrage technicien */}
      {user?.linkedTechnicianId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="text-blue-600 dark:text-blue-400" size={20} />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {showAllInterventions 
                    ? 'Affichage de toutes les interventions' 
                    : 'Vos interventions assignées'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {showAllInterventions 
                    ? `${interventions.length} interventions au total`
                    : `${filteredInterventions.length} intervention(s) qui vous sont assignées`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAllInterventions(!showAllInterventions)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center gap-2"
            >
              {showAllInterventions ? (
                <>
                  <Filter size={16} />
                  Voir mes interventions uniquement
                </>
              ) : (
                <>
                  <Eye size={16} />
                  Voir toutes les interventions
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* En-tête avec recherche et filtres */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par chambre, description, technicien..."
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
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {intervention.roomType === 'chambre' && intervention.rooms && intervention.rooms.length > 1 ? (
                    <Home size={20} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  ) : (
                    <MapPin size={20} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  )}
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {getMainDisplay(intervention)}
                  </h3>
                  {intervention.priority && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(intervention.priority)}`}>
                      {getPriorityLabel(intervention.priority)}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {intervention.missionSummary || 'Aucune description'}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {intervention.createdAt?.toLocaleDateString?.('fr-FR') || 'Date inconnue'}
                  </span>
                  {intervention.assignedToName && (
                    <span>Assignée à {intervention.assignedToName}</span>
                  )}
                </div>
              </div>
              
              <div className="text-right ml-4 flex-shrink-0 space-y-2">
                <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(intervention.status)}`}>
                  {getStatusText(intervention.status)}
                </span>
                
                {intervention.photos && intervention.photos.length > 0 && (
                  <div className="flex items-center justify-end gap-1 text-gray-500 dark:text-gray-400">
                    <Camera size={16} />
                    <span className="text-sm font-medium">{intervention.photos.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* ✨ NOUVEAU Phase 1: Bouton "Charger plus" avec pagination */}
        {hasMore && filteredInterventions.length > 0 && (
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 
                     rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 
                     hover:bg-indigo-50 dark:hover:bg-indigo-900/10
                     transition text-gray-600 dark:text-gray-400 font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {isLoadingMore ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                Chargement...
              </>
            ) : (
              <>
                <ChevronDown size={20} />
                Charger plus d'interventions
              </>
            )}
          </button>
        )}
        
        {/* Message si aucune intervention */}
        {filteredInterventions.length === 0 && (
          <div className="text-center py-12">
            <MapPin size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              Aucune intervention trouvée
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              {searchTerm || filterStatus !== 'all' || (user?.linkedTechnicianId && !showAllInterventions)
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