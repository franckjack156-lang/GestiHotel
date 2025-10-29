import React, { useState, useMemo } from 'react';
import { 
  Home, Search, Filter, MapPin, AlertCircle, Clock, 
  CheckCircle, XCircle, Lock, Unlock, Calendar, Eye,
  TrendingUp, BarChart3, Info, ExternalLink, Plus
} from 'lucide-react';
import RoomBlockingModal from './RoomBlockingModal';

/**
 * RoomsManagementView - Gestion complète des chambres
 * 
 * NOUVEAUTÉS :
 * - Bouton "Bloquer une chambre" dans le header
 * - Modal de blocage accessible depuis la liste
 * - Support du blocage sans intervention
 */
const RoomsManagementView = ({ 
  blockedRooms = [],
  interventions = [],
  onToggleRoomBlock,
  onInterventionClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  
  // ✅ NOUVEAUX ÉTATS pour le modal
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockModalMode, setBlockModalMode] = useState('block');
  const [blockModalRoom, setBlockModalRoom] = useState('');

  // Extraire toutes les chambres uniques
  const allRooms = useMemo(() => {
    const roomsSet = new Set();
    
    blockedRooms.forEach(br => {
      if (br.room) roomsSet.add(br.room);
    });
    
    interventions.forEach(i => {
      if (i.location && i.roomType === 'chambre') {
        roomsSet.add(i.location);
      }
    });
    
    return Array.from(roomsSet).map(roomName => {
      const blockInfo = blockedRooms.find(br => br.room === roomName && br.blocked);
      const roomInterventions = interventions.filter(i => i.location === roomName);
      const activeInterventions = roomInterventions.filter(i => 
        i.status === 'todo' || i.status === 'inprogress' || i.status === 'ordering'
      );
      
      return {
        name: roomName,
        isBlocked: !!blockInfo,
        blockInfo: blockInfo || null,
        totalInterventions: roomInterventions.length,
        activeInterventions: activeInterventions.length,
        lastIntervention: roomInterventions.length > 0 
          ? roomInterventions.sort((a, b) => {
              const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
              const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
              return dateB - dateA;
            })[0]
          : null
      };
    }).sort((a, b) => {
      if (a.isBlocked && !b.isBlocked) return -1;
      if (!a.isBlocked && b.isBlocked) return 1;
      return a.name.localeCompare(b.name, 'fr', { numeric: true });
    });
  }, [blockedRooms, interventions]);

  // Filtrer les chambres
  const filteredRooms = useMemo(() => {
    let filtered = allRooms;

    if (searchTerm.trim()) {
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus === 'blocked') {
      filtered = filtered.filter(room => room.isBlocked);
    } else if (filterStatus === 'available') {
      filtered = filtered.filter(room => !room.isBlocked);
    }

    return filtered;
  }, [allRooms, searchTerm, filterStatus]);

  // Statistiques
  const stats = {
    total: allRooms.length,
    blocked: allRooms.filter(r => r.isBlocked).length,
    available: allRooms.filter(r => !r.isBlocked).length,
    withActiveInterventions: allRooms.filter(r => r.activeInterventions > 0).length
  };

  // Interventions de la chambre sélectionnée
  const roomInterventions = useMemo(() => {
    if (!selectedRoom) return [];
    
    let roomInters = interventions.filter(i => i.location === selectedRoom.name);
    
    if (historyFilter === 'completed') {
      roomInters = roomInters.filter(i => i.status === 'completed');
    } else if (historyFilter === 'inprogress') {
      roomInters = roomInters.filter(i => 
        i.status === 'todo' || i.status === 'inprogress' || i.status === 'ordering'
      );
    }
    
    return roomInters.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB - dateA;
    });
  }, [selectedRoom, interventions, historyFilter]);

  // ✅ NOUVEAU : Handler pour ouvrir le modal de blocage
  const handleOpenBlockModal = (room = null, mode = 'block') => {
    if (room) {
      setBlockModalRoom(room.name);
      setBlockModalMode(room.isBlocked ? 'unblock' : 'block');
    } else {
      setBlockModalRoom('');
      setBlockModalMode('block');
    }
    setIsBlockModalOpen(true);
  };

  // ✅ NOUVEAU : Handler pour bloquer/débloquer
  const handleToggleBlock = async (roomName, reason) => {
    if (onToggleRoomBlock) {
      const result = await onToggleRoomBlock(roomName, reason);
      if (result?.success) {
        setIsBlockModalOpen(false);
        setBlockModalRoom('');
      }
      return result;
    }
    return { success: false };
  };

  const formatDate = (date) => {
    if (!date) return 'Date inconnue';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'Date invalide';
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatShortDate = (date) => {
    if (!date) return 'Date inconnue';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'Date invalide';
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'inprogress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'todo': return 'À faire';
      case 'inprogress': return 'En cours';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'normal': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-green-600 dark:text-green-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Gestion des Chambres
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vue d'ensemble et gestion des chambres et suites
          </p>
        </div>

        {/* ✅ NOUVEAU : Bouton "Bloquer une chambre" */}
        <button
          onClick={() => handleOpenBlockModal(null, 'block')}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <Lock size={18} />
          Bloquer une chambre
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Total chambres</span>
            <Home size={20} className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Bloquées</span>
            <Lock size={20} className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{stats.blocked}</p>
          {stats.blocked > 0 && (
            <p className="text-xs opacity-90 mt-1">À débloquer</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Disponibles</span>
            <CheckCircle size={20} className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{stats.available}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Interventions actives</span>
            <AlertCircle size={20} className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">{stats.withActiveInterventions}</p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher une chambre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Toutes ({stats.total})</option>
          <option value="blocked">Bloquées ({stats.blocked})</option>
          <option value="available">Disponibles ({stats.available})</option>
        </select>
      </div>

      {/* Liste des chambres */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Liste */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <MapPin size={18} />
              Chambres ({filteredRooms.length})
            </h3>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredRooms.map((room) => (
                <div
                  key={room.name}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedRoom?.name === room.name
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <button
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowHistory(true);
                      }}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <Home size={18} className="text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-gray-800 dark:text-white">
                        {room.name}
                      </span>
                    </button>
                    
                    {/* ✅ NOUVEAU : Bouton rapide pour bloquer/débloquer */}
                    <button
                      onClick={() => handleOpenBlockModal(room)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                      title={room.isBlocked ? 'Débloquer' : 'Bloquer'}
                    >
                      {room.isBlocked ? (
                        <Unlock size={16} className="text-green-600 dark:text-green-400" />
                      ) : (
                        <Lock size={16} className="text-red-600 dark:text-red-400" />
                      )}
                    </button>
                  </div>

                  {room.isBlocked && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2 mb-2">
                      <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                        🚫 Bloquée
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-2">
                        {room.blockInfo?.reason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{room.totalInterventions} intervention(s)</span>
                    {room.activeInterventions > 0 && (
                      <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                        {room.activeInterventions} active(s)
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {filteredRooms.length === 0 && (
                <div className="text-center py-8">
                  <Home size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune chambre trouvée
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite - Détails */}
        <div className="lg:col-span-2">
          {selectedRoom ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* En-tête de la chambre */}
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
                    <Home size={28} />
                    {selectedRoom.name}
                  </h2>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {selectedRoom.isBlocked ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                        <Lock size={14} />
                        Chambre bloquée
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                        <Unlock size={14} />
                        Disponible
                      </span>
                    )}
                    
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedRoom.totalInterventions} intervention(s) au total
                    </span>
                  </div>
                </div>

                {/* ✅ Bouton débloquer si bloquée */}
                {selectedRoom.isBlocked && (
                  <button
                    onClick={() => handleOpenBlockModal(selectedRoom, 'unblock')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Unlock size={18} />
                    Débloquer
                  </button>
                )}
              </div>

              {/* Informations de blocage */}
              {selectedRoom.isBlocked && selectedRoom.blockInfo && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Informations de blocage
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 font-medium min-w-24">Raison :</span>
                      <span className="text-red-700 dark:text-red-300">{selectedRoom.blockInfo.reason}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 font-medium min-w-24">Bloquée par :</span>
                      <span className="text-red-700 dark:text-red-300">{selectedRoom.blockInfo.blockedByName}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 dark:text-red-400 font-medium min-w-24">Date :</span>
                      <span className="text-red-700 dark:text-red-300">
                        {formatDate(selectedRoom.blockInfo.blockedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistiques de la chambre */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {selectedRoom.totalInterventions}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {selectedRoom.activeInterventions}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">En cours</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {selectedRoom.totalInterventions - selectedRoom.activeInterventions}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">Terminées</p>
                </div>
              </div>

              {/* Historique des interventions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <Clock size={18} />
                    Historique des interventions
                  </h3>
                  
                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">Toutes</option>
                    <option value="inprogress">En cours</option>
                    <option value="completed">Terminées</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {roomInterventions.length > 0 ? (
                    roomInterventions.map((intervention) => (
                      <div
                        key={intervention.id}
                        onClick={() => onInterventionClick && onInterventionClick(intervention)}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-gray-800 dark:text-white flex-1">
                            {intervention.missionSummary}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(intervention.status)}`}>
                            {getStatusText(intervention.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatShortDate(intervention.createdAt)}
                          </span>
                          
                          {intervention.priority && (
                            <span className={`font-medium ${getPriorityColor(intervention.priority)}`}>
                              {intervention.priority === 'urgent' ? '🔥 Urgent' :
                               intervention.priority === 'high' ? '⚠️ Haute' :
                               intervention.priority === 'normal' ? '📋 Normale' : '📌 Basse'}
                            </span>
                          )}
                          
                          {onInterventionClick && (
                            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                              <ExternalLink size={12} />
                              Voir détails
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Clock size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {historyFilter === 'all' 
                          ? 'Aucune intervention enregistrée'
                          : historyFilter === 'completed'
                          ? 'Aucune intervention terminée'
                          : 'Aucune intervention en cours'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Home size={64} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                Sélectionnez une chambre
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Cliquez sur une chambre dans la liste pour voir ses détails et son historique
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-2">💡 Fonctionnalités</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Bloquer une chambre libre</strong> : Cliquez sur "Bloquer une chambre" en haut à droite</li>
              <li>• <strong>Bloquer depuis la liste</strong> : Cliquez sur l'icône 🔒 à côté du nom de la chambre</li>
              <li>• <strong>Débloquer</strong> : Sélectionnez une chambre bloquée puis cliquez sur "Débloquer"</li>
              <li>• <strong>Voir l'historique</strong> : Toutes les interventions passées et en cours sont affichées</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ✅ MODAL DE BLOCAGE */}
      {isBlockModalOpen && (
        <RoomBlockingModal
          isOpen={isBlockModalOpen}
          onClose={() => {
            setIsBlockModalOpen(false);
            setBlockModalRoom('');
          }}
          onConfirm={handleToggleBlock}
          defaultRoom={blockModalRoom}
          defaultReason={
            blockModalMode === 'unblock' && selectedRoom?.blockInfo 
              ? selectedRoom.blockInfo.reason 
              : ''
          }
          isBlocking={blockModalMode === 'block'}
          blockedRooms={blockedRooms}
        />
      )}
    </div>
  );
};

export default RoomsManagementView;