// src/components/Search/AdvancedSearchView.jsx
import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Calendar, MapPin, User } from 'lucide-react';

const AdvancedSearchView = ({ 
  interventions = [], 
  users = [], 
  data = {},
  onInterventionClick 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
    dateFrom: '',
    dateTo: '',
    location: '',
    missionType: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filtrage avancé
  const filteredInterventions = useMemo(() => {
    let result = interventions;

    // Recherche textuelle
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(intervention =>
        intervention.location?.toLowerCase().includes(term) ||
        intervention.missionSummary?.toLowerCase().includes(term) ||
        intervention.description?.toLowerCase().includes(term) ||
        intervention.assignedToName?.toLowerCase().includes(term)
      );
    }

    // Filtres
    if (filters.status !== 'all') {
      result = result.filter(i => i.status === filters.status);
    }

    if (filters.priority !== 'all') {
      result = result.filter(i => i.priority === filters.priority);
    }

    if (filters.assignedTo !== 'all') {
      result = result.filter(i => i.assignedTo === filters.assignedTo);
    }

    if (filters.missionType !== 'all') {
      result = result.filter(i => i.missionType === filters.missionType);
    }

    if (filters.location) {
      result = result.filter(i => 
        i.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filtres de date
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(i => 
        i.createdAt && new Date(i.createdAt) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      result = result.filter(i => 
        i.createdAt && new Date(i.createdAt) <= toDate
      );
    }

    return result;
  }, [interventions, searchTerm, filters]);

  const resetFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      assignedTo: 'all',
      dateFrom: '',
      dateTo: '',
      location: '',
      missionType: 'all'
    });
    setSearchTerm('');
  };

  const activeFiltersCount = Object.values(filters).filter(v => 
    v !== 'all' && v !== ''
  ).length;

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Recherche Avancée
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Trouvez rapidement vos interventions avec des filtres précis
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par localisation, description, technicien..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
            showFilters || activeFiltersCount > 0
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
          }`}
        >
          <Filter size={20} />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="bg-white text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Filtres avancés
            </h3>
            <button
              onClick={resetFilters}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <X size={16} />
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous</option>
                <option value="todo">À faire</option>
                <option value="inprogress">En cours</option>
                <option value="ordering">En commande</option>
                <option value="completed">Terminée</option>
              </select>
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priorité
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Toutes</option>
                <option value="urgent">Urgent</option>
                <option value="high">Haute</option>
                <option value="normal">Normale</option>
                <option value="low">Basse</option>
              </select>
            </div>

            {/* Technicien */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Technicien
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous</option>
                {users.filter(u => u.role === 'technician').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Type de mission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de mission
              </label>
              <select
                value={filters.missionType}
                onChange={(e) => setFilters({ ...filters, missionType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous</option>
                {(data.missionTypes || []).map(type => (
                  <option key={type.id} value={type.value}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* Date début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date début
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Date fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date fin
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Localisation */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Localisation
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="Ex: Chambre 206, Suite..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Résultats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Résultats ({filteredInterventions.length})
          </h3>
        </div>

        {filteredInterventions.length > 0 ? (
          <div className="space-y-3">
            {filteredInterventions.map(intervention => (
              <div
                key={intervention.id}
                onClick={() => onInterventionClick(intervention)}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={16} className="text-gray-500" />
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {intervention.location}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(intervention.status)}`}>
                        {getStatusText(intervention.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {intervention.missionSummary}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {intervention.assignedToName || 'Non assigné'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {intervention.createdAt?.toLocaleDateString?.('fr-FR') || 'Date inconnue'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Search size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Aucune intervention trouvée
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchView;