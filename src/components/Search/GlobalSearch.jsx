// src/components/Search/GlobalSearch.jsx
// ✅ Recherche globale style Ctrl+K

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Clock, MapPin, User, FileText, Home, Zap } from 'lucide-react';

/**
 * Recherche globale à la Spotlight/Command Palette
 * 
 * Raccourcis:
 * - Ctrl+K ou Cmd+K : Ouvrir
 * - Escape : Fermer
 * - Flèches : Navigation
 * - Enter : Sélection
 */
const GlobalSearch = ({ 
  isOpen, 
  onClose, 
  interventions = [],
  users = [],
  rooms = [],
  onSelectIntervention,
  onSelectUser,
  onSelectRoom
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Focus automatique à l'ouverture
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Recherche dans tous les éléments
  const results = useMemo(() => {
    if (!query.trim()) {
      // Afficher les interventions récentes si pas de recherche
      return {
        interventions: interventions.slice(0, 5),
        users: [],
        rooms: [],
        total: Math.min(interventions.length, 5)
      };
    }

    const searchLower = query.toLowerCase().trim();

    // Recherche interventions
    const foundInterventions = interventions.filter(i => 
      (i.missionSummary?.toLowerCase() || '').includes(searchLower) ||
      (i.description?.toLowerCase() || '').includes(searchLower) ||
      (i.location?.toLowerCase() || '').includes(searchLower) ||
      (i.locations?.some(loc => String(loc).toLowerCase().includes(searchLower))) ||
      (i.assignedToName?.toLowerCase() || '').includes(searchLower) ||
      i.id?.toLowerCase().includes(searchLower)
    ).slice(0, 5);

    // Recherche utilisateurs
    const foundUsers = users.filter(u =>
      (u.name?.toLowerCase() || '').includes(searchLower) ||
      (u.email?.toLowerCase() || '').includes(searchLower)
    ).slice(0, 3);

    // Recherche chambres
    const foundRooms = rooms.filter(r =>
      String(r.name || r).toLowerCase().includes(searchLower)
    ).slice(0, 5);

    return {
      interventions: foundInterventions,
      users: foundUsers,
      rooms: foundRooms,
      total: foundInterventions.length + foundUsers.length + foundRooms.length
    };
  }, [query, interventions, users, rooms]);

  // Liste plate de tous les résultats pour navigation clavier
  const allResults = useMemo(() => {
    const items = [];
    
    results.interventions.forEach(i => items.push({ type: 'intervention', data: i }));
    results.users.forEach(u => items.push({ type: 'user', data: u }));
    results.rooms.forEach(r => items.push({ type: 'room', data: r }));
    
    return items;
  }, [results]);

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(allResults[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allResults, onClose]);

  // Scroll automatique vers l'élément sélectionné
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (item) => {
    if (item.type === 'intervention') {
      onSelectIntervention?.(item.data);
    } else if (item.type === 'user') {
      onSelectUser?.(item.data);
    } else if (item.type === 'room') {
      onSelectRoom?.(item.data);
    }
    onClose();
    setQuery('');
    setSelectedIndex(0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'text-gray-600';
      case 'inprogress': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Overlay pour fermer */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal de recherche */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[60vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Barre de recherche */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search size={20} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Rechercher une intervention, un utilisateur, une chambre..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Résultats */}
        <div ref={resultsRef} className="flex-1 overflow-y-auto">
          {allResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {query.trim() ? 'Aucun résultat trouvé' : 'Commencez à taper pour rechercher'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {/* Interventions */}
              {results.interventions.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Interventions ({results.interventions.length})
                  </div>
                  {results.interventions.map((intervention, idx) => {
                    const globalIndex = allResults.findIndex(
                      r => r.type === 'intervention' && r.data.id === intervention.id
                    );
                    return (
                      <button
                        key={intervention.id}
                        onClick={() => handleSelect({ type: 'intervention', data: intervention })}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                          selectedIndex === globalIndex ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-indigo-600' : ''
                        }`}
                      >
                        <FileText size={18} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {intervention.missionSummary}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {intervention.location || intervention.locations?.[0]}
                            </span>
                            <span>•</span>
                            <span className={getStatusColor(intervention.status)}>
                              {intervention.status}
                            </span>
                            <span>•</span>
                            <span>{formatDate(intervention.createdAt)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Utilisateurs */}
              {results.users.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Utilisateurs ({results.users.length})
                  </div>
                  {results.users.map((user) => {
                    const globalIndex = allResults.findIndex(
                      r => r.type === 'user' && r.data.id === user.id
                    );
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSelect({ type: 'user', data: user })}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                          selectedIndex === globalIndex ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-indigo-600' : ''
                        }`}
                      >
                        <User size={18} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email} • {user.role}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Chambres */}
              {results.rooms.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Chambres ({results.rooms.length})
                  </div>
                  {results.rooms.map((room, idx) => {
                    const globalIndex = allResults.findIndex(
                      r => r.type === 'room' && (r.data.name === room.name || r.data === room)
                    );
                    const roomName = room.name || room;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect({ type: 'room', data: room })}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                          selectedIndex === globalIndex ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-indigo-600' : ''
                        }`}
                      >
                        <Home size={18} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Chambre {roomName}
                          </p>
                          {room.isBlocked && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              🔒 Bloquée
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer avec raccourcis */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">↑↓</kbd>
              Naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Enter</kbd>
              Sélectionner
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Esc</kbd>
              Fermer
            </span>
          </div>
          <span>{results.total} résultat(s)</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook pour gérer l'ouverture/fermeture avec Ctrl+K
 */
export const useGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
};

export default GlobalSearch;