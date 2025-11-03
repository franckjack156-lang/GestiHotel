// src/components/Search/AdvancedSearch.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  X,
  Filter,
  Clock,
  Bookmark,
  Download,
  Share2,
  Sliders,
  Calendar,
  User,
  MapPin,
  Tag,
  Star,
  Camera,
  FileSignature,
  AlertCircle,
  TrendingUp,
  Save,
  Trash2
} from 'lucide-react';
import { useDebounce } from '../../hooks/useOptimizedFirestore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Recherche avancée avec :
 * - Recherche full-text instantanée
 * - Filtres multiples
 * - Sauvegarde de recherches
 * - Suggestions intelligentes
 * - Export des résultats
 */
const AdvancedSearch = ({
  data = [],
  onSearch,
  onFilterChange,
  onExport,
  searchableFields = ['missionSummary', 'description', 'rooms', 'assignedToName'],
  filterConfig = {},
  savedSearches = [],
  onSaveSearch,
  onDeleteSearch,
  onLoadSearch,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [results, setResults] = useState(data);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const debouncedQuery = useDebounce(query, 300);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Charger les recherches récentes du localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Sauvegarder les recherches récentes
  const saveToRecent = useCallback((searchQuery) => {
    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5);
    
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Recherche full-text
  const performSearch = useCallback((searchQuery, filters = {}) => {
    if (!searchQuery && Object.keys(filters).length === 0) {
      setResults(data);
      return data;
    }

    let filtered = [...data];

    // Recherche textuelle
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return searchableFields.some(field => {
          const value = item[field];
          if (Array.isArray(value)) {
            return value.some(v => 
              String(v).toLowerCase().includes(lowerQuery)
            );
          }
          return String(value || '').toLowerCase().includes(lowerQuery);
        });
      });
    }

    // Appliquer les filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return;

      filtered = filtered.filter(item => {
        const itemValue = item[key];

        if (Array.isArray(value)) {
          // Filtre multiple
          if (Array.isArray(itemValue)) {
            return value.some(v => itemValue.includes(v));
          }
          return value.includes(itemValue);
        }

        if (typeof value === 'object' && value.start && value.end) {
          // Filtre de date
          const itemDate = new Date(itemValue);
          return itemDate >= value.start && itemDate <= value.end;
        }

        return itemValue === value;
      });
    });

    setResults(filtered);
    onSearch?.(filtered, searchQuery, filters);
    return filtered;
  }, [data, searchableFields, onSearch]);

  // Générer des suggestions
  const generateSuggestions = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const suggestions = [];

    // Suggestions de chambres
    const rooms = new Set();
    data.forEach(item => {
      if (item.rooms) {
        item.rooms.forEach(room => {
          if (room.toLowerCase().includes(lowerQuery)) {
            rooms.add(room);
          }
        });
      }
    });

    // Suggestions de missions
    const missions = new Set();
    data.forEach(item => {
      if (item.missionSummary?.toLowerCase().includes(lowerQuery)) {
        missions.add(item.missionSummary);
      }
    });

    // Suggestions de techniciens
    const technicians = new Set();
    data.forEach(item => {
      if (item.assignedToName?.toLowerCase().includes(lowerQuery)) {
        technicians.add(item.assignedToName);
      }
    });

    // Construire les suggestions
    Array.from(rooms).slice(0, 3).forEach(room => {
      suggestions.push({
        type: 'room',
        icon: MapPin,
        label: room,
        value: room,
        count: data.filter(i => i.rooms?.includes(room)).length
      });
    });

    Array.from(missions).slice(0, 3).forEach(mission => {
      suggestions.push({
        type: 'mission',
        icon: Star,
        label: mission,
        value: mission,
        count: 1
      });
    });

    Array.from(technicians).slice(0, 2).forEach(tech => {
      suggestions.push({
        type: 'technician',
        icon: User,
        label: tech,
        value: tech,
        count: data.filter(i => i.assignedToName === tech).length
      });
    });

    setSuggestions(suggestions.slice(0, 8));
  }, [data]);

  // Effet de recherche avec debounce
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, activeFilters);
      generateSuggestions(debouncedQuery);
      saveToRecent(debouncedQuery);
    } else {
      setResults(data);
      setSuggestions([]);
    }
  }, [debouncedQuery, activeFilters, data, performSearch, generateSuggestions, saveToRecent]);

  // Gérer le changement de recherche
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
  };

  // Sélectionner une suggestion
  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.label);
    setShowSuggestions(false);
    performSearch(suggestion.label, activeFilters);
  };

  // Ajouter/retirer un filtre
  const handleFilterChange = (filterKey, value) => {
    const updated = { ...activeFilters };
    
    if (value === null || value === undefined || value === '') {
      delete updated[filterKey];
    } else {
      updated[filterKey] = value;
    }
    
    setActiveFilters(updated);
    onFilterChange?.(updated);
    performSearch(query, updated);
  };

  // Réinitialiser
  const handleReset = () => {
    setQuery('');
    setActiveFilters({});
    setResults(data);
    setShowSuggestions(false);
    onFilterChange?.({});
  };

  // Sauvegarder la recherche
  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    
    onSaveSearch?.({
      name: searchName,
      query,
      filters: activeFilters,
      tags: selectedTags,
      savedAt: new Date()
    });
    
    setSearchName('');
    setShowSaveModal(false);
  };

  // Charger une recherche sauvegardée
  const handleLoadSearch = (search) => {
    setQuery(search.query || '');
    setActiveFilters(search.filters || {});
    setSelectedTags(search.tags || []);
    performSearch(search.query, search.filters);
  };

  // Click outside pour fermer les suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre de recherche principale */}
      <div className="relative">
        <div className="flex gap-2">
          {/* Input de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Rechercher une intervention, chambre, technicien..."
              className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white transition-all"
            />
            {query && (
              <button
                onClick={handleReset}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Boutons d'action */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-all ${
              showFilters || Object.keys(activeFilters).length > 0
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-600 dark:text-indigo-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Filter size={20} />
            {Object.keys(activeFilters).length > 0 && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            disabled={!query && Object.keys(activeFilters).length === 0}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sauvegarder cette recherche"
          >
            <Bookmark size={20} />
          </button>

          {results.length > 0 && (
            <button
              onClick={() => onExport?.(results)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Exporter les résultats"
            >
              <Download size={20} />
            </button>
          )}
        </div>

        {/* Suggestions */}
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {/* Recherches récentes */}
            {recentSearches.length > 0 && !query && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <Clock size={14} />
                  Recherches récentes
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(search);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-3"
                  >
                    <Search size={16} className="text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <TrendingUp size={14} />
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} className="text-gray-400" />
                        <div>
                          <div className="text-gray-700 dark:text-gray-300 font-medium">
                            {suggestion.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {suggestion.type === 'room' && 'Chambre'}
                            {suggestion.type === 'mission' && 'Mission'}
                            {suggestion.type === 'technician' && 'Technicien'}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 group-hover:text-gray-600">
                        {suggestion.count} résultat{suggestion.count > 1 ? 's' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6 animate-slideDown">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sliders size={20} />
              Filtres avancés
            </h3>
            {Object.keys(activeFilters).length > 0 && (
              <button
                onClick={() => {
                  setActiveFilters({});
                  onFilterChange?.({});
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                <X size={16} />
                Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtre Statut */}
            <FilterSelect
              label="Statut"
              icon={AlertCircle}
              value={activeFilters.status || []}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: 'todo', label: 'À faire', color: 'gray' },
                { value: 'inprogress', label: 'En cours', color: 'blue' },
                { value: 'completed', label: 'Terminée', color: 'green' },
                { value: 'cancelled', label: 'Annulée', color: 'red' }
              ]}
              multiple
            />

            {/* Filtre Priorité */}
            <FilterSelect
              label="Priorité"
              icon={Star}
              value={activeFilters.priority || []}
              onChange={(value) => handleFilterChange('priority', value)}
              options={[
                { value: 'urgent', label: 'Urgent', color: 'red' },
                { value: 'high', label: 'Haute', color: 'orange' },
                { value: 'normal', label: 'Normale', color: 'blue' },
                { value: 'low', label: 'Basse', color: 'gray' }
              ]}
              multiple
            />

            {/* Filtre Assigné à */}
            <FilterSelect
              label="Assigné à"
              icon={User}
              value={activeFilters.assignedTo}
              onChange={(value) => handleFilterChange('assignedTo', value)}
              options={Array.from(new Set(data.map(i => i.assignedToName).filter(Boolean))).map(name => ({
                value: name,
                label: name
              }))}
            />

            {/* Filtre Type de localisation */}
            <FilterSelect
              label="Type de localisation"
              icon={MapPin}
              value={activeFilters.roomType || []}
              onChange={(value) => handleFilterChange('roomType', value)}
              options={[
                { value: 'chambre', label: 'Chambre' },
                { value: 'commun', label: 'Espace commun' },
                { value: 'exterieur', label: 'Extérieur' },
                { value: 'autre', label: 'Autre' }
              ]}
              multiple
            />

            {/* Avec photos */}
            <FilterCheckbox
              label="Avec photos"
              icon={Camera}
              checked={activeFilters.hasPhotos || false}
              onChange={(checked) => handleFilterChange('hasPhotos', checked)}
            />

            {/* Avec signature */}
            <FilterCheckbox
              label="Avec signature"
              icon={FileSignature}
              checked={activeFilters.hasSignature || false}
              onChange={(checked) => handleFilterChange('hasSignature', checked)}
            />
          </div>

          {/* Filtre de date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Période
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={activeFilters.dateRange?.start ? format(activeFilters.dateRange.start, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const start = e.target.value ? new Date(e.target.value) : null;
                  handleFilterChange('dateRange', start ? {
                    ...activeFilters.dateRange,
                    start
                  } : null);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                value={activeFilters.dateRange?.end ? format(activeFilters.dateRange.end, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const end = e.target.value ? new Date(e.target.value) : null;
                  handleFilterChange('dateRange', end ? {
                    ...activeFilters.dateRange,
                    end
                  } : null);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Recherches sauvegardées */}
      {savedSearches.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Bookmark size={14} />
            Recherches sauvegardées:
          </span>
          {savedSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => handleLoadSearch(search)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center gap-2 group"
            >
              {search.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSearch?.(search);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Résultats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {results.length} résultat{results.length > 1 ? 's' : ''}
          {query && ` pour "${query}"`}
        </span>
      </div>

      {/* Modal de sauvegarde */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Sauvegarder cette recherche
            </h3>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Nom de la recherche..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!searchName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={16} />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Composant de filtre select
 */
const FilterSelect = ({ label, icon: Icon, value, onChange, options, multiple = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (optionValue) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      const updated = current.includes(optionValue)
        ? current.filter(v => v !== optionValue)
        : [...current, optionValue];
      onChange(updated.length > 0 ? updated : null);
    } else {
      onChange(optionValue === value ? null : optionValue);
      setIsOpen(false);
    }
  };

  const selectedCount = Array.isArray(value) ? value.length : (value ? 1 : 0);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
        <Icon size={16} />
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-left dark:bg-gray-700 dark:text-white flex items-center justify-between"
      >
        <span className="truncate">
          {selectedCount > 0 ? `${selectedCount} sélectionné${selectedCount > 1 ? 's' : ''}` : 'Tous'}
        </span>
        <Filter size={16} className="text-gray-400" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = multiple 
                ? (Array.isArray(value) && value.includes(option.value))
                : value === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                  }`}
                >
                  <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                  {isSelected && <X size={16} className="text-indigo-600" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Composant de filtre checkbox
 */
const FilterCheckbox = ({ label, icon: Icon, checked, onChange }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <Icon size={16} className="text-gray-400" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
    </label>
  );
};

export default AdvancedSearch;