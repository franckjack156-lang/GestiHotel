import React, { useState } from 'react';
import { 
  X, MapPin, User, MessageSquare, Clock, Calendar, 
  Camera, MessageCircle, Send, Package, AlertCircle,
  Edit3, Save, Trash2, Home, Users, Hammer
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { arrayUnion, serverTimestamp } from 'firebase/firestore';

const InterventionDetailModal = ({ 
  intervention, 
  onClose, 
  onUpdateIntervention, 
  onToggleRoomBlock,
  user 
}) => {
  const [techComment, setTechComment] = useState(intervention?.techComment || '');
  const [newStatus, setNewStatus] = useState(intervention?.status || 'todo');
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [imageErrors, setImageErrors] = useState({});
  const { addToast } = useToast();

  if (!intervention) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'inprogress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'ordering': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'todo': return 'À faire';
      case 'inprogress': return 'En cours';
      case 'ordering': return 'En commande';
      case 'completed': return 'Terminée';
      default: return 'Annulée';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'normal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };

  const handleStatusUpdate = async () => {
    const result = await onUpdateIntervention(intervention.id, {
      techComment,
      status: newStatus,
      statusComment: `Statut changé à ${newStatus}`
    });
    
    if (result.success) {
      addToast({
        type: 'success',
        title: 'Statut mis à jour',
        message: 'L\'intervention a été mise à jour'
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

     const result = await onUpdateIntervention(intervention.id, {
      messages: arrayUnion({
        id: `msg_${Date.now()}`,
        text: newMessage.trim(),
        type: 'text',
        senderId: user.uid,
        senderName: user.name || user.email,
        timestamp: serverTimestamp(), // ✅ CORRECTION 2: serverTimestamp au lieu de new Date()
        read: false
      })
    });

    if (result.success) {
      setNewMessage('');
      addToast({
        type: 'success',
        title: 'Message envoyé',
        message: 'Votre message a été envoyé'
      });
    }
  };

  const handleBlockRoom = async () => {
    const reason = prompt('Raison du blocage de la chambre:');
    if (reason) {
      const result = await onToggleRoomBlock(intervention.location, reason);
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Chambre bloquée',
          message: 'La chambre a été bloquée'
        });
      }
    }
  };

  const handleImageError = (photoId) => {
    setImageErrors(prev => ({ ...prev, [photoId]: true }));
    console.error('❌ Erreur chargement image:', photoId);
  };

  const getPhotoUrl = (photo) => {
    if (typeof photo === 'string') return photo;
    if (photo && photo.url) return photo.url;
    return null;
  };

  const validPhotos = intervention.photos?.filter(photo => {
    const url = getPhotoUrl(photo);
    const photoId = typeof photo === 'string' ? photo : photo.id;
    return url && !imageErrors[photoId];
  }) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Intervention #{intervention.id.slice(-8).toUpperCase()}
              </h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <MapPin size={16} className="text-gray-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{intervention.location}</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                  {intervention.roomType}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(intervention.priority)}`}>
                  {intervention.priority}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation par onglets */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex gap-6 -mb-px">
              {[
                { id: 'details', label: 'Détails', icon: Home },
                { id: 'messages', label: 'Messages', icon: MessageCircle },
                { id: 'history', label: 'Historique', icon: Clock },
                { id: 'supplies', label: 'Fournitures', icon: Package }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Détails de l'intervention */}
              {activeTab === 'details' && (
                <>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Informations générales</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(intervention.status)}`}>
                          {getStatusText(intervention.status)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Priorité:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(intervention.priority)}`}>
                          {intervention.priority}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Créée le:</span>
                        <span className="ml-2 text-gray-800 dark:text-gray-200">
                          {intervention.createdAt?.toLocaleDateString?.('fr-FR') || 'Date inconnue'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Par:</span>
                        <span className="ml-2 text-gray-800 dark:text-gray-200">{intervention.createdByName}</span>
                      </div>
                      {intervention.assignedToName && (
                        <div className="col-span-2">
                          <span className="text-gray-600 dark:text-gray-400">Assignée à:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-200">{intervention.assignedToName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">Description</h3>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {intervention.missionSummary || intervention.description}
                    </p>
                  </div>

                  {/* Commentaire créateur */}
                  {intervention.missionComment && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={16} className="text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">Commentaire créateur</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 text-sm">{intervention.missionComment}</p>
                    </div>
                  )}

                  {/* Photos */}
                  {validPhotos.length > 0 && (
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-3">
                        <Camera size={18} className="text-gray-600 dark:text-gray-400" />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          Photos ({validPhotos.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {validPhotos.map((photo, index) => {
                          const photoUrl = getPhotoUrl(photo);
                          const photoId = typeof photo === 'string' ? photo : (photo.id || `photo-${index}`);
                          
                          return (
                            <div key={photoId} className="relative group">
                              <img
                                src={photoUrl}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                                onClick={() => window.open(photoUrl, '_blank')}
                                onError={() => handleImageError(photoId)}
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                  Agrandir
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {intervention.photos && intervention.photos.length > validPhotos.length && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          ⚠️ {intervention.photos.length - validPhotos.length} photo(s) n'ont pas pu être chargées
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Messages */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Conversation</h3>
                    
                    {/* Liste des messages avec scroll auto */}
                    <div 
                      ref={messagesEndRef} 
                      className="space-y-3 max-h-96 overflow-y-auto mb-4 scroll-smooth"
                    >
                      {intervention.messages
                        ?.sort((a, b) => {
                          const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
                          const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
                          return dateA - dateB;
                        })
                        .map((message, index) => (
                          <div
                            key={message.id || index}
                            className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.senderId === user.uid
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              <p className="text-sm break-words">{message.text}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {message.senderName} • {
                                  message.timestamp instanceof Date 
                                    ? message.timestamp.toLocaleString('fr-FR')
                                    : new Date(message.timestamp).toLocaleString('fr-FR')
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                      
                      {(!intervention.messages || intervention.messages.length === 0) && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                          Aucun message pour le moment
                        </p>
                      )}
                    </div>

                    {/* Champ de message */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Tapez votre message..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send size={16} />
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Historique */}
              {activeTab === 'history' && (
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                    Historique des modifications
                  </h3>
                  <div className="space-y-3">
                    {intervention.history
                      ?.sort((a, b) => {
                        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                        return dateB - dateA; // Plus récent en premier
                      })
                      .map((event, index) => (
                        <div 
                          key={event.id || index} 
                          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition"
                        >
                          {/* Timeline dot */}
                          <div className="flex-shrink-0 mt-2">
                            <div className={`w-3 h-3 rounded-full ${
                              event.status === 'completed' ? 'bg-green-500' :
                              event.status === 'inprogress' ? 'bg-blue-500' :
                              event.status === 'cancelled' ? 'bg-red-500' :
                              event.status === 'ordering' ? 'bg-orange-500' :
                              'bg-gray-400'
                            }`}></div>
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Status badge */}
                            {event.status && (
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(event.status)}`}>
                                {getStatusText(event.status)}
                              </span>
                            )}

                            {/* Commentaire */}
                            <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">
                              {event.comment}
                            </p>

                            {/* Champs modifiés (optionnel) */}
                            {event.fields && event.fields.length > 0 && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Modifié: {event.fields.join(', ')}
                              </div>
                            )}

                            {/* Meta info */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                              <span className="font-medium">{event.byName}</span>
                              <span>•</span>
                              <span>
                                {event.date?.toDate 
                                  ? event.date.toDate().toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : new Date(event.date).toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {(!intervention.history || intervention.history.length === 0) && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        Aucun historique disponible
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Fournitures */}
              {activeTab === 'supplies' && (
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Fournitures nécessaires</h3>
                  <div className="space-y-3">
                    {intervention.suppliesNeeded?.map((supply, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{supply.name}</p>
                          {supply.quantity && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">Quantité: {supply.quantity}</p>
                          )}
                          {supply.comment && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{supply.comment}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {supply.addedAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue'}
                        </span>
                      </div>
                    ))}
                    
                    {(!intervention.suppliesNeeded || intervention.suppliesNeeded.length === 0) && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        Aucune fourniture nécessaire
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne des actions */}
            <div className="space-y-6">
              {(user.role === 'technician' || user.role === 'manager' || user.role === 'superadmin') && (
                <>
                  {/* Commentaire technicien */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={18} className="text-orange-600 dark:text-orange-400" />
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100">Commentaire technicien</h3>
                    </div>
                    <textarea
                      value={techComment}
                      onChange={(e) => setTechComment(e.target.value)}
                      placeholder="Travail effectué, observations, recommandations..."
                      className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white min-h-24"
                    />
                  </div>

                  {/* Changement de statut */}
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Changer le statut
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    >
                      <option value="todo">À faire</option>
                      <option value="inprogress">En cours</option>
                      <option value="ordering">En commande</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                    
                    <button
                      onClick={handleStatusUpdate}
                      className="w-full mt-3 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      Mettre à jour
                    </button>
                  </div>
                </>
              )}

              {/* Actions rapides */}
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Actions rapides</h3>
                <div className="space-y-2">
                  {user.role !== 'technician' && (
                    <button
                      onClick={handleBlockRoom}
                      className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                      <AlertCircle size={16} />
                      Bloquer chambre
                    </button>
                  )}
                  
                  <button
                    onClick={() => window.print()}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition flex items-center justify-center gap-2"
                  >
                    <Edit3 size={16} />
                    Imprimer
                  </button>
                </div>
              </div>

              {/* Informations techniques */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Informations techniques</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ID:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-mono text-xs">{intervention.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dernière modification:</span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {intervention.updatedAt?.toLocaleDateString?.('fr-FR') || 'Inconnue'}
                    </span>
                  </div>
                  {intervention.estimatedDuration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Durée estimée:</span>
                      <span className="text-gray-800 dark:text-gray-200">{intervention.estimatedDuration} min</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterventionDetailModal;