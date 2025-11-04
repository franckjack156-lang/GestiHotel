// src/components/layout/EstablishmentSwitcher.jsx
// Composant pour changer d'établissement dans le header
import React, { useState, useRef, useEffect } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { useMultiEstablishments } from '../../hooks/useMultiEstablishments';

const EstablishmentSwitcher = ({ user }) => {
  const {
    userEstablishments,
    currentEstablishment,
    switchEstablishment,
    hasMultipleEstablishments,
    loading
  } = useMultiEstablishments(user);

  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSwitch = async (establishmentId) => {
    if (establishmentId === currentEstablishment?.id || switching) return;

    setSwitching(true);
    const result = await switchEstablishment(establishmentId);
    
    if (result.success) {
      setIsOpen(false);
      // Recharger la page pour rafraîchir toutes les données
      window.location.reload();
    } else {
      alert('Erreur lors du changement d\'établissement');
    }
    
    setSwitching(false);
  };

  // Si loading ou pas d'établissement, ne rien afficher
  if (loading || !currentEstablishment) return null;

  // Si un seul établissement, afficher juste le nom (pas de dropdown)
  if (!hasMultipleEstablishments) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <Building2 size={18} className="text-indigo-600 dark:text-indigo-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
          {currentEstablishment.name}
        </span>
      </div>
    );
  }

  // Plusieurs établissements : afficher le sélecteur
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition disabled:opacity-50"
      >
        <Building2 size={18} className="text-indigo-600 dark:text-indigo-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
          {currentEstablishment.name}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-2">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Changer d'établissement
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {userEstablishments.map(establishment => {
              const isCurrent = establishment.id === currentEstablishment.id;
              
              return (
                <button
                  key={establishment.id}
                  onClick={() => handleSwitch(establishment.id)}
                  disabled={isCurrent || switching}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 ${
                    isCurrent ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${
                      isCurrent 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {establishment.name}
                    </p>
                    {establishment.address && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {establishment.address}
                      </p>
                    )}
                  </div>
                  
                  {isCurrent && (
                    <Check size={18} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {userEstablishments.length} établissement{userEstablishments.length > 1 ? 's' : ''} disponible{userEstablishments.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstablishmentSwitcher;