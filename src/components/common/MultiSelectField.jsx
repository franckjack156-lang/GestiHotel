// src/components/common/MultiSelectField.jsx
import React, { useState } from 'react';
import { X, Plus, Search, AlertTriangle } from 'lucide-react';

/**
 * MultiSelectField - Composant générique pour sélection multiple
 * 
 * Réutilisable pour chambres, intervenants, ou tout autre liste
 */
const MultiSelectField = ({
  label,
  value = [], // Array de valeurs sélectionnées
  onChange,
  options = [], // Array d'options disponibles {value, label}
  placeholder = "Saisir ou sélectionner...",
  addPlaceholder = "Ex: 705 ou 705-710",
  required = false,
  disabled = false,
  allowCustom = false, // Permettre ajout de valeurs personnalisées
  allowRange = false, // Permettre les plages (ex: 705-710)
  renderBadge, // Fonction custom pour afficher un badge
  warningCheck, // Fonction pour vérifier et afficher des warnings
  icon: Icon
}) => {
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filtrer les options disponibles
  const availableOptions = options.filter(opt => {
    // Ne pas afficher les options déjà sélectionnées
    if (value.includes(opt.value)) return false;
    
    // Filtrer par recherche
    if (searchTerm) {
      return opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
             opt.value.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });

  // Obtenir le label d'une valeur
  const getLabel = (val) => {
    const option = options.find(opt => opt.value === val);
    return option?.label || val;
  };

  // Ajouter des valeurs
  const handleAdd = (valuesToAdd) => {
    const newValues = valuesToAdd.filter(v => !value.includes(v));
    if (newValues.length > 0) {
      onChange([...value, ...newValues]);
    }
  };

  // Ajouter depuis l'input
  const handleAddFromInput = () => {
    if (!inputValue.trim()) return;

    let valuesToAdd = [];

    // Support des plages (ex: 705-710)
    if (allowRange && inputValue.includes('-')) {
      const [start, end] = inputValue.split('-').map(s => s.trim());
      const startNum = parseInt(start);
      const endNum = parseInt(end);

      if (!isNaN(startNum) && !isNaN(endNum) && startNum <= endNum) {
        for (let i = startNum; i <= endNum; i++) {
          valuesToAdd.push(i.toString());
        }
      } else {
        valuesToAdd.push(inputValue.trim());
      }
    } 
    // Support des listes (ex: 705,706,707)
    else if (inputValue.includes(',')) {
      valuesToAdd = inputValue.split(',').map(s => s.trim()).filter(s => s);
    } 
    // Valeur unique
    else {
      valuesToAdd.push(inputValue.trim());
    }

    handleAdd(valuesToAdd);
    setInputValue('');
  };

  // Ajouter depuis la dropdown
  const handleSelectFromDropdown = (val) => {
    handleAdd([val]);
    setShowDropdown(false);
    setSearchTerm('');
  };

  // Supprimer une valeur
  const handleRemove = (val) => {
    onChange(value.filter(v => v !== val));
  };

  // Supprimer tout
  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Zone d'ajout */}
      <div className="space-y-2">
        {/* Input + bouton */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFromInput();
                }
              }}
              placeholder={addPlaceholder}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddFromInput}
            disabled={disabled || !inputValue.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>

        {/* Dropdown de sélection */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left flex items-center justify-between dark:bg-gray-700 dark:text-white text-sm"
          >
            <span className="text-gray-600 dark:text-gray-400">
              {placeholder} ({availableOptions.length} disponibles)
            </span>
            <Search size={14} className="text-gray-400" />
          </button>

          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-auto">
              {/* Recherche */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Liste */}
              <div className="py-1">
                {availableOptions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    {searchTerm ? 'Aucun résultat' : 'Tout est déjà sélectionné'}
                  </div>
                ) : (
                  availableOptions.map((opt) => {
                    const warning = warningCheck ? warningCheck(opt.value) : null;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectFromDropdown(opt.value)}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-sm ${
                          warning ? 'opacity-75' : ''
                        }`}
                      >
                        <span className="dark:text-white">{opt.label}</span>
                        {warning && (
                          <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {warning}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Aide */}
        {(allowRange || allowCustom) && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 {allowRange && 'Plages (705-710) ou '}listes (705,706,707) supportées
          </p>
        )}
      </div>

      {/* Liste des valeurs sélectionnées */}
      {value.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Sélectionnés ({value.length})
            </span>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Tout supprimer
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {value.map((val, index) => {
              const warning = warningCheck ? warningCheck(val) : null;
              
              // Badge personnalisé ou par défaut
              if (renderBadge) {
                return (
                  <React.Fragment key={`badge-${val}-${index}`}>
                    {renderBadge(val, () => handleRemove(val), warning)}
                  </React.Fragment>
                );
              }

              return (
                <div
                  key={`badge-${val}-${index}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${
                    warning
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                      : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
                  }`}
                  title={warning || ''}
                >
                  {Icon && <Icon size={14} className={warning ? 'text-orange-600' : 'text-indigo-600'} />}
                  <span className={`text-sm font-medium ${
                    warning ? 'text-orange-700 dark:text-orange-300' : 'text-indigo-700 dark:text-indigo-300'
                  }`}>
                    {getLabel(val)}
                  </span>
                  {warning && <AlertTriangle size={12} className="text-orange-600" />}
                  <button
                    type="button"
                    onClick={() => handleRemove(val)}
                    disabled={disabled}
                    className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectField;