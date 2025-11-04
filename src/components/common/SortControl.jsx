// src/components/common/SortControl.jsx
// ✅ Tri personnalisable pour listes

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Composant de contrôle de tri
 * 
 * Usage:
 * <SortControl
 *   value={sortConfig}
 *   onChange={setSortConfig}
 *   options={sortOptions}
 * />
 */
const SortControl = ({ value, onChange, options, className = '' }) => {
  const currentOption = options.find(opt => opt.value === value.field);
  
  const handleFieldChange = (field) => {
    onChange({ field, direction: value.direction || 'desc' });
  };
  
  const handleDirectionToggle = () => {
    onChange({ 
      field: value.field, 
      direction: value.direction === 'asc' ? 'desc' : 'asc' 
    });
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Sélection du champ */}
      <select
        value={value.field}
        onChange={(e) => handleFieldChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            Trier par {option.label}
          </option>
        ))}
      </select>

      {/* Direction */}
      <button
        onClick={handleDirectionToggle}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center gap-2"
        title={value.direction === 'asc' ? 'Croissant' : 'Décroissant'}
      >
        {value.direction === 'asc' ? (
          <ArrowUp size={16} className="text-indigo-600 dark:text-indigo-400" />
        ) : (
          <ArrowDown size={16} className="text-indigo-600 dark:text-indigo-400" />
        )}
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {value.direction === 'asc' ? 'Croissant' : 'Décroissant'}
        </span>
      </button>
    </div>
  );
};

/**
 * Options de tri par défaut pour les interventions
 */
export const INTERVENTION_SORT_OPTIONS = [
  { value: 'createdAt', label: 'date de création' },
  { value: 'updatedAt', label: 'dernière modification' },
  { value: 'priority', label: 'priorité' },
  { value: 'status', label: 'statut' },
  { value: 'location', label: 'chambre' },
  { value: 'assignedToName', label: 'intervenant' },
];

/**
 * Fonction de tri pour les interventions
 */
export const sortInterventions = (interventions, sortConfig) => {
  if (!interventions || !sortConfig) return interventions;

  const { field, direction } = sortConfig;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...interventions].sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];

    // Gestion spéciale des dates
    if (field === 'createdAt' || field === 'updatedAt') {
      valueA = valueA instanceof Date ? valueA : new Date(valueA);
      valueB = valueB instanceof Date ? valueB : new Date(valueB);
      return (valueA - valueB) * multiplier;
    }

    // Gestion des priorités
    if (field === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      valueA = priorityOrder[valueA] || 0;
      valueB = priorityOrder[valueB] || 0;
      return (valueA - valueB) * multiplier;
    }

    // Gestion des statuts
    if (field === 'status') {
      const statusOrder = { 
        todo: 1, 
        inprogress: 2, 
        ordering: 3, 
        completed: 4, 
        cancelled: 5 
      };
      valueA = statusOrder[valueA] || 0;
      valueB = statusOrder[valueB] || 0;
      return (valueA - valueB) * multiplier;
    }

    // Gestion des locations (chambres)
    if (field === 'location') {
      // Support multi-chambres
      if (Array.isArray(a.locations)) valueA = a.locations[0] || '';
      if (Array.isArray(b.locations)) valueB = b.locations[0] || '';
      
      valueA = String(valueA || '');
      valueB = String(valueB || '');
      return valueA.localeCompare(valueB, 'fr', { numeric: true }) * multiplier;
    }

    // Tri alphabétique par défaut
    valueA = String(valueA || '');
    valueB = String(valueB || '');
    return valueA.localeCompare(valueB, 'fr') * multiplier;
  });
};

/**
 * Hook pour gérer le tri
 */
export const useSortedData = (data, initialSort = { field: 'createdAt', direction: 'desc' }) => {
  const [sortConfig, setSortConfig] = React.useState(initialSort);
  
  const sortedData = React.useMemo(() => {
    return sortInterventions(data, sortConfig);
  }, [data, sortConfig]);

  return { sortedData, sortConfig, setSortConfig };
};

export default SortControl;