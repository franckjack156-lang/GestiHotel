// src/components/Search/AdvancedSearchView.jsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar,
  MapPin,
  User,
  Tag,
  Download,
  RefreshCw,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

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
    roomType: 'all',
    location: '',
    dateRange: 'all', // today, week, month, custom
    startDate: '',
    endDate: '',
    missionType: 'all',
    creator: 'all'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc'); // date-asc, date-desc, priority, status

  // ✅ Filtrage intelligent
  const filteredResults = useMemo(() => {
    let results = [...interventions];

    // Recherche textuelle dans plusieurs champs
    if (searchTerm.trim().length >= 2) {
      const term = searchTerm.toLowerCase();
      results = results.filter(intervention =>
        intervention.location?.toLowerCase().includes(term) ||
        intervention.missionSummary?.toLowerCase().includes(term) ||
        intervention.missionComment?.toLowerCase().includes(term) ||
        intervention.assignedToName?.toLowerCase().includes(term) ||
        intervention.createdByName?.toLowerCase().includes(term) ||
        intervention.id?.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (filters.status !== 'all') {
      results = results.filter(i => i.status === filters.status);
    }

    // Filtre par priorité
    if (filters.priority !== 'all') {
      results = results.filter(i => i.priority === filters.priority);
    }

    // Filtre par technicien
    if (filters.assignedTo !== 'all') {
      results = results.filter(i => i.assignedTo === filters.assignedTo);
    }

    // Filtre par type de local
    if (filters.roomType !== 'all') {
      results = results.filter(i => i.roomType === filters.roomType);
    }

    // Filtre par localisation
    if (filters.location.trim()) {
      const locationTerm = filters.location.toLowerCase();
      results = results.filter(i =>
        i.location?.toLowerCase().includes(locationTerm)
      );
    }

    // Filtre par type de mission
    if (filters.missionType !== 'all') {
      results = results.filter(i => i.missionType === filters.missionType);
    }

    // Filtre par créateur
    if (filters.creator !== 'all') {
      results = results.filter(i => i.creator === filters.creator);
    }

    // Filtre par plage de dates
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      results = results.filter(intervention => {
        const interventionDate = intervention.createdAt instanceof Date
          ? intervention.createdAt
          : new Date(intervention.createdAt);

        switch (filters.dateRange) {
          case 'today':
            return interventionDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return interventionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return interventionDate >= monthAgo;
          case 'custom':
            if (filters.startDate && filters.endDate) {
              const start = new Date(filters.startDate);
              const end = new Date(filters.endDate);
              return interventionDate >= start && interventionDate <= end;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Tri
    results.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);

      switch (sortBy) {
        case 'date-asc':
          return aDate - bDate;
        case 'date-desc':
          return bDate - aDate;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
          return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
        case 'status':
          const statusOrder = { todo: 0, inprogress: 1, ordering: 2, completed: 3 };
          return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        default:
          return bDate - aDate;
      }
    });

    return results;
  }, [interventions, searchTerm, filters, sortBy]);

  // ✅ Statistiques des résultats
  const stats = useMemo(() => ({
    total: filteredResults.length,
    todo: filteredResults.filter(i => i.status === 'todo').length,
    inProgress: filteredResults.filter(i => i.status === 'inprogress').length,
    completed: filteredResults.filter(i => i.status === 'completed').length,
    urgent: filteredResults.filter(i => i.priority === 'urgent').length
  }), [filteredResults]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      assignedTo: 'all',
      roomType: 'all',
      location: '',
      dateRange: 'all',
      startDate: '',
      endDate: '',
      missionType: 'all',
      creator: 'all'
    });
    setSearchTerm('');
  };

  const exportResults = () => {
    const csv = [
      ['ID', 'Date', 'Localisation', 'Mission', 'Statut', 'Priorité', 'Technicien'].join(','),
      ...filteredResults.map(i => [
        i.id.slice(-8),
        i.createdAt?.toLocaleDateString?.('fr-FR') || '',
        i.location,
        i.missionSummary,
        i.status,
        i.priority,
        i.assignedToName || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recherche-${Date.now()}.csv`;
    a.click();
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      inprogress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      ordering: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    };
    return colors[status] || colors.todo;
  };

  const getStatusText = (status) => {
    const texts = {
      todo: 'À faire',
      inprogress: 'En cours',
      ordering: 'En commande',
      completed: 'Terminée'
    };
    return texts[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    };
    return colors[priority] || colors.normal;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Recherche Avancée
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''} sur {interventions.length} intervention{interventions.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetFilters}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Réinitialiser
          </button>
          <button
            onClick={exportResults}
            disabled={filteredResults.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">À faire</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.todo}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">En cours</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Terminées</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Urgentes</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.urgent}</div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par localisation, mission, technicien, ID..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Filtres rapides */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire</option>
            <option value="inprogress">En cours</option>
            <option value="ordering">En commande</option>
            <option value="completed">Terminées</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Toutes priorités</option>
            <option value="urgent">Urgent</option>
            <option value="high">Haute</option>
            <option value="normal">Normale</option>
            <option value="low">Basse</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Toutes dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="custom">Personnalisé</option>
          </select>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
          >
            <Filter size={18} />
            Filtres avancés
            {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Technicien assigné
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) => updateFilter('assignedTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous les techniciens</option>
                {users.filter(u => u.role === 'technician').map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de local
              </label>
              <select
                value={filters.roomType}
                onChange={(e) => updateFilter('roomType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous les types</option>
                {data.roomTypes?.map(type => (
                  <option key={type.id} value={type.value}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de mission
              </label>
              <select
                value={filters.missionType}
                onChange={(e) => updateFilter('missionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous les types</option>
                {data.missionTypes?.map(type => (
                  <option key={type.id} value={type.value}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Localisation
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                placeholder="Ex: Chambre 101"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {filters.dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => updateFilter('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => updateFilter('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tri */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''}
        </p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="date-desc">Plus récent</option>
          <option value="date-asc">Plus ancien</option>
          <option value="priority">Par priorité</option>
          <option value="status">Par statut</option>
        </select>
      </div>

      {/* Résultats */}
      <div className="space-y-4">
        {filteredResults.length > 0 ? (
          filteredResults.map(intervention => (
            <div
              key={intervention.id}
              onClick={() => onInterventionClick(intervention)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition cursor-pointer border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <MapPin size={18} className="text-gray-500 flex-shrink-0" />
                    <span className="font-semibold text-gray-800 dark:text-white text-lg">
                      {intervention.location}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                      {intervention.roomType}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(intervention.priority)}`}>
                      {intervention.priority}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {intervention.missionSummary}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {intervention.createdAt?.toLocaleDateString?.('fr-FR') || 'Date inconnue'}
                    </span>
                    {intervention.assignedToName && (
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {intervention.assignedToName}
                      </span>
                    )}
                    <span>#{intervention.id.slice(-8).toUpperCase()}</span>
                  </div>
                </div>

                <div className="ml-4 flex-shrink-0">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(intervention.status)}`}>
                    {getStatusText(intervention.status)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Search size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchView;