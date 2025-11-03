import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, Calendar, User, MapPin, FileText, Package, MessageSquare, 
  Image as ImageIcon, Send, Paperclip, Trash2, Check, Clock, 
  ChevronDown, ChevronUp, Wrench, AlertCircle, CheckCircle2, 
  Loader2, Home, Lock, Unlock, Edit3, Save 
} from 'lucide-react';
import RoomBlockingModal from '../Rooms/RoomBlockingModal';

// ✅ FONCTION HELPER POUR FORMATER LES TIMESTAMPS
const formatTimestamp = (timestamp) => {
  try {
    if (!timestamp) return 'Date inconnue';
    
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return 'Date invalide';
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return 'Date invalide';
  }
};

const formatShortDate = (timestamp) => {
  try {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return '';
  }
};

const InterventionDetailModal = ({ 
  intervention, 
  onClose, 
  onUpdate, 
  onSendMessage,
  user,
  users = [],
  dropdowns = {},
  onAddSupply,
  onRemoveSupply,
  onToggleSupplyStatus,
  onToggleRoomBlock,
  blockedRooms = [],
  onAddLocation
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [newMessage, setNewMessage] = useState('');
  const [newSupply, setNewSupply] = useState({ name: '', quantity: '', unit: 'pièce' });
  const [techComment, setTechComment] = useState(intervention?.techComment || '');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRoomBlockModalOpen, setIsRoomBlockModalOpen] = useState(false);
  
  // ✨ NOUVEAUX ÉTATS pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    missionSummary: intervention?.missionSummary || '',
    missionComment: intervention?.missionComment || '',
    assignedTo: intervention?.assignedTo || '',
    location: intervention?.location || '',
    roomType: intervention?.roomType || '',
    missionType: intervention?.missionType || '',
    interventionType: intervention?.interventionType || '',
    priority: intervention?.priority || ''
  });
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ✅ NOUVEAU : Support multi-chambres avec fallback
  const rooms = useMemo(() => {
  return intervention?.locations || [];
}, [intervention?.locations]);

// Affichage
{rooms.length === 1 ? (
  <span>{rooms[0]}</span>
) : rooms.length > 1 ? (
  <div>
    <span className="font-bold">{rooms.length} chambres</span>
    <span className="text-sm text-gray-500 ml-2">
      ({rooms.slice(0, 3).join(', ')}{rooms.length > 3 ? '...' : ''})
    </span>
  </div>
) : (
  'Non spécifié'
)}

  const primaryRoom = intervention?.location;

  // ✅ MODIFIÉ : Vérifier si AU MOINS UNE chambre est bloquée
  const isAnyRoomBlocked = useMemo(() => {
    if (!rooms.length || !blockedRooms?.length) return false;
    
    return rooms.some(room => 
      blockedRooms.some(br => br.room === room && br.blocked === true)
    );
  }, [blockedRooms, rooms]);

  // ✅ NOUVEAU : Liste des chambres bloquées
  const blockedRoomsList = useMemo(() => {
    if (!rooms.length || !blockedRooms?.length) return [];
    
    return rooms.filter(room =>
      blockedRooms.some(br => br.room === room && br.blocked === true)
    );
  }, [blockedRooms, rooms]);

  // ✅ MODIFIÉ : Récupérer les infos de la première chambre bloquée
  const currentBlockedRoom = useMemo(() => {
    if (blockedRoomsList.length === 0) return null;
    return blockedRooms.find(br => br.room === blockedRoomsList[0] && br.blocked === true);
  }, [blockedRooms, blockedRoomsList]);

  // Pour la compatibilité avec l'ancien code
  const isCurrentRoomBlocked = isAnyRoomBlocked;

  // ✅ Scroll auto vers les nouveaux messages
  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, intervention?.messages]);

  // ✅ Synchroniser techComment avec l'intervention
  useEffect(() => {
    setTechComment(intervention?.techComment || '');
  }, [intervention?.techComment]);

  // ✨ NOUVEAU : Réinitialiser les données éditées quand l'intervention change
  useEffect(() => {
    if (intervention) {
      setEditedData({
        missionSummary: intervention.missionSummary || '',
        missionComment: intervention.missionComment || '',
        assignedTo: intervention.assignedTo || '',
        location: intervention.location || '',
        roomType: intervention.roomType || '',
        missionType: intervention.missionType || '',
        interventionType: intervention.interventionType || '',
        priority: intervention.priority || ''
      });
      setIsEditing(false);
    }
  }, [intervention]);

  // ✅ Récupérer les informations du technicien assigné
  const assignedUser = users.find(u => u.id === (isEditing ? editedData.assignedTo : intervention?.assignedTo));
  const assignedName = intervention?.assignedToName || assignedUser?.name || 'Non assigné';

  // ✅ Fonctions pour obtenir les labels depuis les dropdowns
  const getRoomTypeLabel = (value) => {
    if (!value) return 'Non spécifié';
    const roomType = dropdowns.roomTypes?.find(rt => rt.value === value);
    return roomType?.name || value;
  };

  const getMissionTypeLabel = (value) => {
    if (!value) return 'Non spécifié';
    const missionType = dropdowns.missionTypes?.find(mt => mt.value === value);
    return missionType?.name || value;
  };

  const getInterventionTypeLabel = (value) => {
    if (!value) return 'Non spécifié';
    const interventionType = dropdowns.interventionTypes?.find(it => it.value === value);
    return interventionType?.name || value;
  };

  const getPriorityLabel = (value) => {
    if (!value) return 'Normale';
    const priority = dropdowns.priorities?.find(p => p.value === value);
    return priority?.name || value;
  };

  // ✨ NOUVEAU : Sauvegarder les modifications
  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
      const result = await onUpdate(editedData);
      
      if (result?.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✨ NOUVEAU : Annuler les modifications
  const handleCancelEdit = () => {
    setEditedData({
      missionSummary: intervention.missionSummary || '',
      missionComment: intervention.missionComment || '',
      assignedTo: intervention.assignedTo || '',
      location: intervention.location || '',
      roomType: intervention.roomType || '',
      missionType: intervention.missionType || '',
      interventionType: intervention.interventionType || '',
      priority: intervention.priority || ''
    });
    setIsEditing(false);
  };

  // ✅ SIMPLIFIÉ : Handler qui laisse le parent gérer la mise à jour
  const handleToggleRoomBlock = async (room, reason) => {
    console.log('🔧 handleToggleRoomBlock appelé:', { room, reason, isCurrentRoomBlocked });
    
    if (onToggleRoomBlock) {
      const result = await onToggleRoomBlock(room, reason);
      
      console.log('📥 Résultat de onToggleRoomBlock:', result);
      
      if (result?.success) {
        // ✅ Fermer le modal - le parent va mettre à jour blockedRooms via Firebase
        setIsRoomBlockModalOpen(false);
        
        console.log('✅ Modal fermé, attente de la mise à jour Firebase...');
      } else {
        console.warn('⚠️ Échec du toggle:', result);
      }
      
      return result;
    }
    return { success: false };
  };

  // ✅ Gestion des photos
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedPhotos(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ Envoi de message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedPhotos.length === 0) return;

    setIsSubmitting(true);
    
    try {
      const result = await onSendMessage(newMessage, selectedPhotos);
      
      if (result?.success) {
        setNewMessage('');
        setSelectedPhotos([]);
        setPreviewPhotos([]);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Mise à jour du statut
  const handleUpdateStatus = async (newStatus) => {
    setIsSubmitting(true);
    try {
      await onUpdate({ status: newStatus });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Mise à jour du commentaire technicien
  const handleUpdateTechComment = async () => {
    if (techComment === intervention?.techComment) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate({ techComment });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Ajout de photos supplémentaires
  const handleAddPhotos = async () => {
    if (selectedPhotos.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const result = await onUpdate({}, selectedPhotos);
      
      if (result?.success) {
        setSelectedPhotos([]);
        setPreviewPhotos([]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Gestion des fournitures
  const handleAddSupply = () => {
    if (!newSupply.name.trim()) return;
    onAddSupply(newSupply);
    setNewSupply({ name: '', quantity: '', unit: 'pièce' });
  };

  // ✅ Configuration des statuts
  const statusConfig = {
    todo: { label: 'À faire', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: Clock },
    inprogress: { label: 'En cours', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Wrench },
    ordering: { label: 'En commande', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: Package },
    completed: { label: 'Terminée', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
    cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: X }
  };

  const currentStatus = statusConfig[intervention?.status] || statusConfig.todo;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ========== HEADER ========== */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {intervention?.missionSummary || 'Intervention'}
            </h2>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color}`}>
                <StatusIcon className="w-4 h-4" />
                {currentStatus.label}
              </span>
              {isCurrentRoomBlocked && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  <Lock size={14} />
                  {blockedRoomsList.length > 1 
                    ? `${blockedRoomsList.length} chambres bloquées` 
                    : 'Chambre bloquée'
                  }
                </span>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatShortDate(intervention?.createdAt)}
              </span>
              {intervention?.roomType && (
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2 py-1 bg-white dark:bg-gray-700 rounded-full flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  {getRoomTypeLabel(intervention.roomType)}
                </span>
              )}
            </div>
          </div>
          
          {/* ✨ MODIFIÉ : Ajout des boutons d'édition */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {/* Bouton Modifier/Sauvegarder (visible seulement pour superadmin) */}
            {user?.role === 'superadmin' && activeTab === 'details' && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Enregistrer
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition font-medium disabled:opacity-50"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 font-medium"
                  >
                    <Edit3 size={18} />
                    Modifier
                  </button>
                )}
              </>
            )}
            
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* ========== TABS ========== */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <div className="flex px-6 overflow-x-auto">
            {[
              { id: 'details', label: 'Détails', icon: FileText },
              { id: 'messages', label: 'Messages', icon: MessageSquare, badge: intervention?.messages?.length || 0 },
              { id: 'supplies', label: 'Fournitures', icon: Package, badge: intervention?.suppliesNeeded?.length || 0 },
              { id: 'photos', label: 'Photos', icon: ImageIcon, badge: intervention?.photos?.length || 0 }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (isEditing && tab.id !== 'details') {
                      handleCancelEdit();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========== CONTENT ========== */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB DÉTAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* ✨ NOUVEAU : Avertissement mode édition */}
              {isEditing && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium mb-1">🛡️ Mode édition activé</p>
                      <p>Vous modifiez les données de base de l'intervention. Ces changements seront enregistrés dans l'historique.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ✨ Résumé de la mission (éditable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Résumé de la mission
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.missionSummary}
                    onChange={(e) => setEditedData({...editedData, missionSummary: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Réparation climatisation chambre 101"
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {intervention?.missionSummary || 'Non spécifié'}
                  </p>
                )}
              </div>

              {/* ✅ NOUVEAU : Gestion multi-chambres */}
              {intervention?.roomType === 'chambre' && rooms.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Home className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="font-semibold text-amber-900 dark:text-amber-100">
                          {rooms.length === 1 ? (
                            <>Gestion de la chambre {rooms[0]}</>
                          ) : (
                            <>Gestion de {rooms.length} chambres</>
                          )}
                        </p>
                        {rooms.length > 1 && (
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            {rooms.join(', ')}
                          </p>
                        )}
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          {isCurrentRoomBlocked 
                            ? `🚫 ${blockedRoomsList.length} ${blockedRoomsList.length > 1 ? 'chambres bloquées' : 'chambre bloquée'}`
                            : '✅ Toutes les chambres sont disponibles'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Bouton bloquer/débloquer la première chambre */}
                    {!isEditing && (user?.role === 'manager' || user?.role === 'superadmin') && primaryRoom && (
                      <button
                        onClick={() => setIsRoomBlockModalOpen(true)}
                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                          isCurrentRoomBlocked
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {isCurrentRoomBlocked ? (
                          <>
                            <Unlock size={16} />
                            Débloquer
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            Bloquer
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Afficher les infos de blocage pour chaque chambre bloquée */}
                  {isCurrentRoomBlocked && blockedRoomsList.length > 0 && !isEditing && (
                    <div className="mt-3 space-y-2">
                      {blockedRoomsList.map((room, index) => {
                        const blockedInfo = blockedRooms.find(br => br.room === room && br.blocked === true);
                        return (
                          <div key={index} className="p-3 bg-white dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                              Chambre {room}
                            </p>
                            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                              <strong>Raison :</strong> {blockedInfo?.reason || 'Non spécifiée'}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Bloquée par {blockedInfo?.blockedByName || 'Inconnu'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Informations principales */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ✅ MODIFIÉ : Localisation avec support multi-chambres */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Localisation</div>
                      {isEditing ? (
                        <select
                          value={editedData.location}
                          onChange={(e) => setEditedData({...editedData, location: e.target.value})}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="">Sélectionner...</option>
                          {dropdowns.locations?.map((loc, index) => (
                            <option key={index} value={typeof loc === 'object' ? loc.value : loc}>
                              {typeof loc === 'object' ? loc.label : loc}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="font-medium text-gray-900 dark:text-white">
                          {rooms.length === 1 ? (
                            <span>{rooms[0] || 'Non spécifié'}</span>
                          ) : rooms.length > 1 ? (
                            <div>
                              <span className="font-bold">{rooms.length} chambres</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                ({rooms.slice(0, 3).join(', ')}{rooms.length > 3 ? '...' : ''})
                              </span>
                            </div>
                          ) : (
                            'Non spécifié'
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assigné à */}
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigné à</div>
                      {isEditing ? (
                        <select
                          value={editedData.assignedTo}
                          onChange={(e) => setEditedData({...editedData, assignedTo: e.target.value})}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="">Sélectionner...</option>
                          {users?.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="font-medium text-gray-900 dark:text-white">
                          {assignedName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type de local */}
                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Type de local</div>
                      {isEditing ? (
                        <select
                          value={editedData.roomType}
                          onChange={(e) => setEditedData({...editedData, roomType: e.target.value})}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="">Sélectionner...</option>
                          {dropdowns.roomTypes?.map((rt, index) => (
                            <option key={index} value={typeof rt === 'object' ? rt.value : rt}>
                              {typeof rt === 'object' ? rt.label || rt.name : rt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getRoomTypeLabel(intervention?.roomType)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type de mission */}
                  {(intervention?.missionType || isEditing) && (
                    <div className="flex items-start gap-3">
                      <Wrench className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Type de mission</div>
                        {isEditing ? (
                          <select
                            value={editedData.missionType}
                            onChange={(e) => setEditedData({...editedData, missionType: e.target.value})}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                          >
                            <option value="">Sélectionner...</option>
                            {dropdowns.missionTypes?.map((mt, index) => (
                              <option key={index} value={typeof mt === 'object' ? mt.value : mt}>
                                {typeof mt === 'object' ? mt.label || mt.name : mt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="font-medium text-gray-900 dark:text-white">
                            {getMissionTypeLabel(intervention.missionType)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Type d'intervention */}
                  {(intervention?.interventionType || isEditing) && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Type d'intervention</div>
                        {isEditing ? (
                          <select
                            value={editedData.interventionType}
                            onChange={(e) => setEditedData({...editedData, interventionType: e.target.value})}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                          >
                            <option value="">Sélectionner...</option>
                            {dropdowns.interventionTypes?.map((it, index) => (
                              <option key={index} value={typeof it === 'object' ? it.value : it}>
                                {typeof it === 'object' ? it.label || it.name : it}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="font-medium text-gray-900 dark:text-white">
                            {getInterventionTypeLabel(intervention.interventionType)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Priorité */}
                  {(intervention?.priority || isEditing) && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Priorité</div>
                        {isEditing ? (
                          <select
                            value={editedData.priority}
                            onChange={(e) => setEditedData({...editedData, priority: e.target.value})}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                          >
                            <option value="low">Basse</option>
                            <option value="normal">Normale</option>
                            <option value="high">Haute</option>
                            <option value="urgent">Urgente</option>
                          </select>
                        ) : (
                          <div className="font-medium text-gray-900 dark:text-white">
                            {getPriorityLabel(intervention.priority)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Créateur */}
                  {intervention?.creatorName && !isEditing && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Créé par</div>
                        <div className="text-gray-900 dark:text-white">
                          {intervention.creatorName}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Commentaire (full width) */}
                <div className="flex items-start gap-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Commentaire</div>
                    {isEditing ? (
                      <textarea
                        value={editedData.missionComment}
                        onChange={(e) => setEditedData({...editedData, missionComment: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Description détaillée de l'intervention..."
                      />
                    ) : (
                      <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {intervention?.missionComment || 'Aucun commentaire'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              {!isEditing && (user?.role === 'manager' || user?.role === 'superadmin') && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Actions rapides</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['todo', 'inprogress', 'ordering', 'completed'].map(status => {
                      const config = statusConfig[status];
                      const Icon = config.icon;
                      return (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(status)}
                          disabled={isSubmitting || intervention?.status === status}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            intervention?.status === status
                              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-400 dark:hover:bg-blue-900/20'
                          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Commentaire technicien */}
              {!isEditing && (user?.role === 'technician' || user?.role === 'manager' || user?.role === 'superadmin') && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Commentaire technicien</h3>
                  <textarea
                    value={techComment}
                    onChange={(e) => setTechComment(e.target.value)}
                    placeholder="Ajouter des notes techniques..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                    disabled={isSubmitting}
                  />
                  {techComment !== intervention?.techComment && (
                    <button
                      onClick={handleUpdateTechComment}
                      disabled={isSubmitting}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Enregistrer
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Historique */}
              {!isEditing && (
                <div>
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">Historique</h3>
                    {isHistoryExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {isHistoryExpanded && (
                    <div className="space-y-3">
                      {intervention?.history?.length > 0 ? (
                        intervention.history.slice().reverse().map((event, index) => {
                          const config = statusConfig[event.status] || statusConfig.todo;
                          const Icon = config.icon;
                          return (
                            <div key={event.id || index} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className={`p-2 rounded-lg ${config.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">{event.comment}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  Par {event.byName} • {formatTimestamp(event.date)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm italic">Aucun historique</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB MESSAGES */}
          {activeTab === 'messages' && (
            <div className="flex flex-col h-[60vh]">
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                {intervention?.messages?.length > 0 ? (
                  intervention.messages.map((msg, index) => {
                    const isOwn = msg.senderId === user?.uid;
                    return (
                      <div key={msg.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          {!isOwn && (
                            <div className="text-xs font-medium mb-1 opacity-75">{msg.senderName}</div>
                          )}
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                          {msg.photos && msg.photos.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {msg.photos.map((photo, idx) => (
                                <img 
                                  key={idx}
                                  src={photo} 
                                  alt={`Photo ${idx + 1}`}
                                  className="rounded cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(photo, '_blank')}
                                />
                              ))}
                            </div>
                          )}
                          <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {formatTimestamp(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <MessageSquare className="w-12 h-12 mb-3" />
                    <p>Aucun message</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Écrire un message..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isSubmitting}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSubmitting || (!newMessage.trim() && selectedPhotos.length === 0)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'supplies' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSupply.name}
                  onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                  placeholder="Nom de la fourniture"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  value={newSupply.quantity}
                  onChange={(e) => setNewSupply({ ...newSupply, quantity: e.target.value })}
                  placeholder="Qté"
                  className="w-20 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <select
                  value={newSupply.unit}
                  onChange={(e) => setNewSupply({ ...newSupply, unit: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="pièce">pièce</option>
                  <option value="mètre">mètre</option>
                  <option value="litre">litre</option>
                  <option value="kg">kg</option>
                </select>
                <button
                  onClick={handleAddSupply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {intervention?.suppliesNeeded?.length > 0 ? (
                  intervention.suppliesNeeded.map((supply, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <button
                        onClick={() => onToggleSupplyStatus(index)}
                        className={`p-1 rounded ${
                          supply.ordered ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <div className="flex-1">
                        <div className={supply.ordered ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}>
                          {supply.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {supply.quantity} {supply.unit}
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveSupply(index)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Package className="w-12 h-12 mb-3" />
                    <p>Aucune fourniture</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Paperclip className="w-5 h-5" />
                  Sélectionner des photos
                </button>
                {selectedPhotos.length > 0 && (
                  <button
                    onClick={handleAddPhotos}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Upload...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5" />
                        Ajouter ({selectedPhotos.length})
                      </>
                    )}
                  </button>
                )}
              </div>

              {previewPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previewPhotos.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img src={preview} alt={`Preview ${index}`} className="w-full h-32 object-cover rounded-lg" />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {intervention?.photos?.length > 0 ? (
                  intervention.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg shadow-md cursor-pointer hover:shadow-xl transition-shadow"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                    <ImageIcon className="w-12 h-12 mb-3" />
                    <p>Aucune photo</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ✅ Modal de blocage */}
      {isRoomBlockModalOpen && primaryRoom && !isEditing && (
        <RoomBlockingModal
          isOpen={isRoomBlockModalOpen}
          onClose={() => setIsRoomBlockModalOpen(false)}
          onConfirm={handleToggleRoomBlock}
          defaultRoom={primaryRoom}
          defaultReason={currentBlockedRoom?.reason || ''}
          isBlocking={!isCurrentRoomBlocked}
          blockedRooms={blockedRooms}
          locations={dropdowns.locations}
          onAddLocation={onAddLocation}
        />
      )}
    </div>
  );
};

export default InterventionDetailModal;