// src/components/Rooms/RoomBlockingModal.jsx
import React, { useState } from 'react';
import { Lock, Unlock, AlertCircle, X } from 'lucide-react';
import SmartLocationField from '../common/SmartLocationField';

/**
 * Modal pour bloquer/débloquer une chambre
 * Peut être utilisé depuis :
 * - La fiche intervention (avec chambre pré-remplie)
 * - La vue chambres (chambre manuelle)
 * 
 * ✅ AMÉLIORATION : Utilise SmartLocationField pour les suggestions intelligentes
 */
const RoomBlockingModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  defaultRoom = '',
  defaultReason = '',
  isBlocking = true, // true = bloquer, false = débloquer
  blockedRooms = [],
  locations = [], // ✅ NOUVEAU : Liste des localisations existantes
  onAddLocation // ✅ NOUVEAU : Fonction pour ajouter une nouvelle localisation
}) => {
  const [room, setRoom] = useState(defaultRoom);
  const [reason, setReason] = useState(defaultReason);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!room.trim()) {
      alert('Le numéro de chambre est obligatoire');
      return;
    }

    if (isBlocking && !reason.trim()) {
      alert('La raison du blocage est obligatoire');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 RoomBlockingModal - Appel de onConfirm:', { 
        room: room.trim(), 
        reason: reason.trim(),
        isBlocking 
      });
      
      const result = await onConfirm(room.trim(), reason.trim());
      
      console.log('📥 RoomBlockingModal - Résultat reçu:', result);
      
      if (result?.success) {
        onClose();
        setRoom('');
        setReason('');
      } else {
        console.error('❌ RoomBlockingModal - Échec:', result);
        alert(result?.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('❌ RoomBlockingModal - Erreur:', error);
      alert('Une erreur est survenue lors de l\'opération');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ✅ CORRECTION : Vérifier si la chambre est déjà bloquée avec blocked === true
  const isRoomBlocked = blockedRooms.some(br => 
    br.room === room && br.blocked === true
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${
                isBlocking 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : 'bg-green-100 dark:bg-green-900/30'
              }`}>
                {isBlocking ? (
                  <Lock className="text-red-600 dark:text-red-400" size={24} />
                ) : (
                  <Unlock className="text-green-600 dark:text-green-400" size={24} />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {isBlocking ? 'Bloquer une chambre' : 'Débloquer la chambre'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isBlocking 
                    ? 'Marquer la chambre comme indisponible' 
                    : 'Remettre la chambre en service'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Numéro de chambre avec suggestions intelligentes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Numéro de chambre *
            </label>
            
            {/* ✅ SI chambre pré-remplie (depuis fiche intervention) : affichage simple */}
            {defaultRoom ? (
              <input
                type="text"
                value={room}
                disabled
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white opacity-75 cursor-not-allowed"
              />
            ) : (
              /* ✅ SI pas de chambre pré-remplie : utiliser SmartLocationField */
              <SmartLocationField
                value={room}
                onChange={(value) => setRoom(value)}
                locations={locations}
                blockedRooms={blockedRooms}
                onAddLocation={onAddLocation}
                required={true}
                placeholder="Ex: 206, Suite 305..."
              />
            )}
          </div>

          {/* Alerte si chambre déjà bloquée */}
          {isBlocking && room && isRoomBlocked && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium">⚠️ Attention</p>
                <p>Cette chambre est déjà bloquée</p>
              </div>
            </div>
          )}

          {/* Raison (si blocage) */}
          {isBlocking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Raison du blocage *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Réparation en cours, Dégât des eaux, En travaux..."
                rows={4}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none disabled:opacity-50"
                required={isBlocking}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Cette information sera visible dans les interventions
              </p>
            </div>
          )}

          {/* Info déblocage */}
          {!isBlocking && defaultReason && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-medium">Raison du blocage :</span>
                <br />
                {defaultReason}
              </p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isBlocking
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  {isBlocking ? <Lock size={18} /> : <Unlock size={18} />}
                  <span>{isBlocking ? 'Bloquer' : 'Débloquer'}</span>
                </>
              )}
            </button>
          </div>

          {/* Warning */}
          {isBlocking && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-xs text-red-700 dark:text-red-300">
                ⚠️ <strong>Important :</strong> Une chambre bloquée ne sera pas disponible 
                pour les réservations et apparaîtra comme indisponible dans le système.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default RoomBlockingModal;