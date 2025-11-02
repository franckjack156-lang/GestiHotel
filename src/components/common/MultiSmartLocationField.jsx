// src/components/common/MultiSmartLocationField.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, X, Search, AlertTriangle, Check, Loader } from 'lucide-react';

/**
 * MultiSmartLocationField - Composant UNIVERSEL de sélection multiple
 * 
 * Peut être utilisé pour :
 * ✅ Chambres (avec suggestions intelligentes)
 * ✅ Intervenants/Techniciens
 * ✅ Fournisseurs
 * ✅ Équipements
 * ✅ N'importe quelle liste
 * 
 * Fonctionnalités :
 * ✅ Suggestions dès 1 caractère tapé
 * ✅ Sélection multiple avec badges
 * ✅ Support des plages : "705-710" → ajoute 705,706,707,708,709,710
 * ✅ Support multiple : "705,706,707" → ajoute les 3
 * ✅ Warnings personnalisables (chambres bloquées, etc.)
 * ✅ Ajout de nouvelles valeurs à la volée
 */
const MultiSmartLocationField = ({
  label = "Sélection",
  value = [], // Array de valeurs sélectionnées
  onChange, // Callback(newArray)
  options = [], // Array d'objets {value, label} ou strings
  
  // Fonctionnalités optionnelles
  onAddNew, // Fonction pour ajouter une nouvelle valeur (si undefined, pas d'ajout)
  warningCheck, // Fonction(value) => string|null pour afficher des warnings
  
  // Comportement
  required = false,
  disabled = false,
  allowRange = false, // Permettre les plages (705-710)
  allowMultiple = true, // Permettre format multiple (705,706,707)
  allowCustom = false, // Permettre l'ajout de valeurs personnalisées
  
  // Affichage
  placeholder = "Rechercher ou saisir...",
  addPlaceholder = "Ex: valeur1, valeur2",
  icon: Icon = Search,
  error,
  
  // Style personnalisé des badges
  getBadgeColor, // Fonction(value) => classe CSS pour personnaliser la couleur du badge
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Normaliser les options en array d'objets (mémoïsé pour éviter les re-calculs)
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return {
        value: opt.value || opt.id || opt,
        label: opt.label || opt.name || opt.value || opt.id || opt
      };
    });
  }, [options]);

  // Calculer les suggestions de manière synchrone avec useMemo au lieu de useEffect
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue || inputValue.length < 1) {
      return [];
    }

    const term = inputValue.toLowerCase().trim();
    
    // Filtrer les options non encore sélectionnées
    const results = normalizedOptions
      .filter(opt => {
        // Ne pas suggérer les valeurs déjà sélectionnées
        if (value.includes(opt.value)) return false;
        
        const labelLower = opt.label.toLowerCase();
        const valueLower = opt.value.toString().toLowerCase();
        
        // Priorité 1: Commence par le terme (exactement)
        if (labelLower.startsWith(term) || valueLower.startsWith(term)) {
          return true;
        }
        
        // Priorité 2: Contient le terme après un espace (début de mot)
        if (labelLower.includes(' ' + term) || valueLower.includes(' ' + term)) {
          return true;
        }
        
        // Priorité 3: Contient le terme n'importe où (pour les numéros de chambre notamment)
        if (labelLower.includes(term) || valueLower.includes(term)) {
          return true;
        }
        
        return false;
      })
      .slice(0, 8); // Limiter à 8 suggestions
    
    // Trier par pertinence: ceux qui commencent par le terme en premier
    return results.sort((a, b) => {
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      const aValue = a.value.toString().toLowerCase();
      const bValue = b.value.toString().toLowerCase();
      
      const aStartsWithLabel = aLabel.startsWith(term);
      const bStartsWithLabel = bLabel.startsWith(term);
      const aStartsWithValue = aValue.startsWith(term);
      const bStartsWithValue = bValue.startsWith(term);
      
      // Priorité aux résultats qui commencent par le terme
      if ((aStartsWithLabel || aStartsWithValue) && !(bStartsWithLabel || bStartsWithValue)) return -1;
      if (!(aStartsWithLabel || aStartsWithValue) && (bStartsWithLabel || bStartsWithValue)) return 1;
      
      // Sinon, ordre alphabétique
      return aLabel.localeCompare(bLabel);
    });
  }, [inputValue, normalizedOptions, JSON.stringify(value)]); // Utiliser JSON.stringify pour une comparaison stable

  // Fermer les suggestions au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parser l'input pour gérer les formats multiples
  const parseInput = (input) => {
    const trimmed = input.trim();
    const values = [];

    // Format plage : "705-710" (si allowRange)
    if (allowRange && trimmed.includes('-')) {
      const parts = trimmed.split('-').map(s => s.trim());
      if (parts.length === 2) {
        const [start, end] = parts;
        const startNum = parseInt(start);
        const endNum = parseInt(end);

        if (!isNaN(startNum) && !isNaN(endNum) && startNum < endNum) {
          for (let i = startNum; i <= endNum; i++) {
            values.push(i.toString());
          }
          return values;
        }
      }
    }
    
    // Format multiple : "705,706,707" (si allowMultiple)
    if (allowMultiple && trimmed.includes(',')) {
      trimmed.split(',').forEach(val => {
        const cleaned = val.trim();
        if (cleaned) values.push(cleaned);
      });
      return values;
    }
    
    // Format simple : "705"
    if (trimmed) {
      values.push(trimmed);
    }

    return values;
  };

  // Obtenir le label d'une valeur
  const getLabel = (val) => {
    const option = normalizedOptions.find(opt => opt.value === val);
    return option?.label || val;
  };

  // Ajouter une ou plusieurs valeurs
  const handleAdd = async () => {
    if (!inputValue.trim()) return;

    const valuesToAdd = parseInput(inputValue);
    const newValues = [];
    const valuesToCreate = [];

    for (const val of valuesToAdd) {
      // Skip si déjà sélectionnée
      if (value.includes(val)) continue;

      // Vérifier si la valeur existe dans les options (recherche plus flexible)
      const matchingOption = normalizedOptions.find(opt => {
        const optValueStr = opt.value.toString().toLowerCase();
        const optLabelStr = opt.label.toLowerCase();
        const valStr = val.toLowerCase();
        
        // Match exact sur value ou label
        return optValueStr === valStr || optLabelStr === valStr;
      });

      if (matchingOption) {
        // Utiliser la valeur exacte de l'option trouvée
        newValues.push(matchingOption.value);
      } else if (allowCustom || onAddNew) {
        valuesToCreate.push(val);
      }
    }

    // Créer les nouvelles valeurs si nécessaire
    if (valuesToCreate.length > 0 && onAddNew) {
      setIsAdding(true);
      
      for (const val of valuesToCreate) {
        try {
          const result = await onAddNew(val);
          
          if (result?.success) {
            newValues.push(val);
          }
        } catch (error) {
          console.error('Erreur ajout valeur:', error);
        }
      }
      
      setIsAdding(false);
    } else if (valuesToCreate.length > 0 && allowCustom) {
      // Ajout direct sans validation
      newValues.push(...valuesToCreate);
    }

    // Mettre à jour la sélection
    if (newValues.length > 0) {
      onChange([...value, ...newValues]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  // Sélectionner depuis les suggestions
  const handleSelectSuggestion = (option) => {
    if (!value.includes(option.value)) {
      onChange([...value, option.value]);
    }
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Retirer une valeur
  const handleRemove = (valueToRemove) => {
    onChange(value.filter(v => v !== valueToRemove));
  };

  // Gestion de la touche Entrée
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Si une suggestion est affichée, l'utiliser
      if (filteredSuggestions.length > 0) {
        handleSelectSuggestion(filteredSuggestions[0]);
      } else {
        handleAdd();
      }
    }
  };

  // Déterminer la couleur du badge
  const getBadgeStyle = (val) => {
    // Vérifier s'il y a un warning
    const warning = warningCheck ? warningCheck(val) : null;
    
    // Utiliser la fonction personnalisée si fournie
    if (getBadgeColor) {
      return getBadgeColor(val, warning);
    }
    
    // Couleur par défaut basée sur warning
    if (warning) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';
    }
    
    return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700';
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Badges des valeurs sélectionnées */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          {value.map((val) => {
            const warning = warningCheck ? warningCheck(val) : null;
            const badgeStyle = getBadgeStyle(val);
            
            return (
              <div
                key={val}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${badgeStyle}`}
                title={warning || undefined}
              >
                <Icon size={14} />
                <span>{getLabel(val)}</span>
                {warning && <AlertTriangle size={14} />}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(val)}
                    className="hover:bg-black/10 dark:hover:bg-white/10 rounded p-0.5 transition"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Champ de recherche/ajout */}
      <div className="relative">
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={disabled || isAdding}
            className={`w-full pl-10 pr-24 py-3 border rounded-lg transition ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
            } focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          
          {/* Bouton Ajouter */}
          {inputValue.trim() && (
            <button
              type="button"
              onClick={handleAdd}
              disabled={disabled || isAdding}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Ajouter
                </>
              )}
            </button>
          )}
        </div>

        {/* Dropdown des suggestions */}
        {showSuggestions && inputValue.length >= 1 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto"
          >
            {filteredSuggestions.length > 0 ? (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                  Suggestions ({filteredSuggestions.length})
                </div>
                {filteredSuggestions.map((opt) => {
                  const warning = warningCheck ? warningCheck(opt.value) : null;
                  
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectSuggestion(opt)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-gray-400" />
                        <span className="text-gray-900 dark:text-white font-medium">
                          {opt.label}
                        </span>
                        {warning && (
                          <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            {warning}
                          </span>
                        )}
                      </div>
                      <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                <Icon size={32} className="mx-auto mb-2 opacity-50" />
                <p>Aucune suggestion trouvée</p>
                {(allowCustom || onAddNew) && (
                  <p className="text-xs mt-1">
                    Appuyez sur Entrée ou cliquez sur "Ajouter"
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertTriangle size={14} />
          {error}
        </p>
      )}

      {/* Aide contextuelle */}
      {(allowRange || allowMultiple) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>💡 Formats acceptés :</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li><strong>Unique</strong> : valeur1</li>
            {allowRange && <li><strong>Plage</strong> : 705-710 (pour les nombres)</li>}
            {allowMultiple && <li><strong>Multiple</strong> : valeur1,valeur2,valeur3</li>}
          </ul>
        </div>
      )}

      {/* Résumé */}
      {value.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {value.length} élément{value.length > 1 ? 's' : ''} sélectionné{value.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default MultiSmartLocationField;