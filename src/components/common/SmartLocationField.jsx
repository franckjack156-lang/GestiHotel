// src/components/common/SmartLocationField.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Check, X, Loader } from 'lucide-react';

/**
 * Champ de localisation intelligent avec :
 * - Suggestions en temps réel
 * - Détection des doublons
 * - Ajout rapide de nouvelles localisations
 * - État de la chambre (libre/bloquée)
 */
const SmartLocationField = ({ 
  value, 
  onChange, 
  locations = [], 
  blockedRooms = [],
  onAddLocation,
  required = false,
  placeholder = "Ex: Chambre 206, Suite 301...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [canAddNew, setCanAddNew] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fermer les suggestions au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Synchroniser avec la prop value
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Filtrer les suggestions
  useEffect(() => {
    if (!inputValue || inputValue.length < 2) {
      setFilteredSuggestions([]);
      setCanAddNew(false);
      return;
    }

    const term = inputValue.toLowerCase().trim();
    const filtered = locations.filter(loc => 
      loc.name.toLowerCase().includes(term)
    ).slice(0, 8); // Limiter à 8 suggestions

    setFilteredSuggestions(filtered);

    // Vérifier si on peut ajouter une nouvelle localisation
    const exactMatch = locations.some(loc => 
      loc.name.toLowerCase() === term
    );
    setCanAddNew(inputValue.trim().length >= 3 && !exactMatch);
  }, [inputValue, locations]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (location) => {
    setInputValue(location.name);
    onChange(location.name);
    setShowSuggestions(false);
  };

  const handleAddNew = async () => {
    if (!canAddNew || !inputValue.trim()) return;

    setIsAdding(true);
    
    try {
      const result = await onAddLocation({
        name: inputValue.trim(),
        value: inputValue.trim().toLowerCase().replace(/\s+/g, '-'),
        category: 'locations'
      });

      if (result.success) {
        onChange(inputValue.trim());
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Erreur ajout localisation:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const getRoomStatus = () => {
    if (!inputValue) return null;
    
    const blocked = blockedRooms.find(room => 
      room.room === inputValue && room.blocked
    );

    if (blocked) {
      return {
        status: 'blocked',
        label: 'Chambre bloquée',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        icon: '🚫'
      };
    }

    return {
      status: 'available',
      label: 'Chambre libre',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      icon: '✅'
    };
  };

  const roomStatus = getRoomStatus();

  return (
    <div className={`relative ${className}`}>
      {/* Champ de saisie */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Dropdown des suggestions */}
      {showSuggestions && (inputValue.length >= 2) && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {/* Suggestions existantes */}
          {filteredSuggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                Suggestions ({filteredSuggestions.length})
              </div>
              {filteredSuggestions.map((location, index) => {
                const isBlocked = blockedRooms.some(room => 
                  room.room === location.name && room.blocked
                );

                return (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(location)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="text-gray-800 dark:text-white">
                        {location.name}
                      </span>
                    </div>
                    {isBlocked && (
                      <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 px-2 py-0.5 rounded-full">
                        Bloquée
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Bouton "Ajouter nouveau" */}
          {canAddNew && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={handleAddNew}
                disabled={isAdding}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  {isAdding ? (
                    <Loader size={16} className="text-indigo-600 animate-spin" />
                  ) : (
                    <Plus size={16} className="text-indigo-600 dark:text-indigo-400" />
                  )}
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {isAdding ? 'Ajout en cours...' : `Ajouter "${inputValue.trim()}"`}
                  </span>
                </div>
                <Check size={16} className="text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition" />
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 px-3 mt-1">
                Cette localisation sera ajoutée à la liste
              </p>
            </div>
          )}

          {/* Aucune suggestion */}
          {filteredSuggestions.length === 0 && !canAddNew && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              <MapPin size={32} className="mx-auto mb-2 opacity-50" />
              <p>Aucune suggestion trouvée</p>
              <p className="text-xs mt-1">
                {inputValue.length < 3 
                  ? 'Tapez au moins 3 caractères' 
                  : 'Continuez à taper pour ajouter une nouvelle localisation'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* État de la chambre */}
      {roomStatus && inputValue.trim().length > 0 && (
        <div className={`mt-2 p-3 rounded-lg border ${roomStatus.color.replace('text-', 'border-')}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{roomStatus.icon}</span>
            <span className={`text-sm font-medium ${roomStatus.color}`}>
              {roomStatus.label}
            </span>
          </div>
          {roomStatus.status === 'blocked' && (
            <p className={`text-xs mt-1 ${roomStatus.color.split(' ')[0]}`}>
              Intervention en cours dans cette chambre
            </p>
          )}
        </div>
      )}

      {/* Aide contextuelle */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        💡 Tapez au moins 2 caractères pour voir les suggestions. 
        Si la localisation n'existe pas, vous pourrez l'ajouter directement.
      </div>
    </div>
  );
};

export default SmartLocationField;