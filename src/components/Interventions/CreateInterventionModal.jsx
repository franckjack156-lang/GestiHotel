import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Mic, Home, MapPin, ClipboardList, User, Hammer, AlertCircle, Users, Info } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useToast } from '../../contexts/ToastContext';
import SmartLocationField from '../common/SmartLocationField';

// Hook personnalisé pour le debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CreateInterventionModal = ({ 
  isOpen, 
  onClose, 
  onAddIntervention, 
  dropdowns = {}, 
  adminOptions = {}, 
  user, 
  blockedRooms = [],
  onManageDropdowns,
  onAddLocation // ✅ AJOUT : Prop pour ajouter une localisation
}) => {
  const safeDropdowns = {
    roomTypes: dropdowns?.roomTypes?.filter(item => item.active) || [],
    locations: dropdowns?.locations?.filter(item => item.active) || [],
    missionTypes: dropdowns?.missionTypes?.filter(item => item.active) || [],
    creators: dropdowns?.creators?.filter(item => item.active) || [],
    interventionTypes: dropdowns?.interventionTypes?.filter(item => item.active) || [],
    priorities: dropdowns?.priorities?.filter(item => item.active) || [],
  };

  const safeAdminOptions = {
    technicians: adminOptions?.technicians?.filter(t => t.active !== false) || [],
    suppliers: adminOptions?.suppliers || [],
    equipment: adminOptions?.equipment || [],
  };

  const [formData, setFormData] = useState({
    roomType: safeDropdowns.roomTypes[0]?.value || '',
    location: '',
    missionType: '',
    missionSummary: '',
    missionComment: '',
    assignedTo: '',
    creator: user?.uid || '',
    priority: 'normal',
    interventionType: ''
  });

  const [showMissionSuggestions, setShowMissionSuggestions] = useState(false);
  
  const { isListening, startListening } = useVoiceRecognition();
  const { addToast } = useToast();

  // Utiliser le debounce pour les recherches
  const debouncedMission = useDebounce(formData.missionSummary, 300);

  const filteredMissionSuggestions = useMemo(() => {
    if (!debouncedMission || debouncedMission.length < 2) return [];
    return safeDropdowns.missionTypes.filter(mission =>
      mission.name.toLowerCase().includes(debouncedMission.toLowerCase())
    ).slice(0, 5);
  }, [debouncedMission, safeDropdowns.missionTypes]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowMissionSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleMissionSelect = useCallback((mission) => {
    setFormData(prev => ({ ...prev, missionSummary: mission.name }));
    setShowMissionSuggestions(false);
  }, []);

  const handleVoiceInput = useCallback(() => {
    startListening((transcript) => {
      setFormData(prev => ({ 
        ...prev, 
        missionComment: prev.missionComment + ' ' + transcript 
      }));
    });
  }, [startListening]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.location && formData.roomType === 'chambre') {
      addToast({
        type: 'error',
        title: 'Champ obligatoire',
        message: 'La localisation est obligatoire pour les chambres'
      });
      return;
    }

    if (!formData.missionSummary || !formData.missionSummary.trim()) {
      addToast({
        type: 'error',
        title: 'Champ obligatoire',
        message: 'Le résumé de mission est obligatoire'
      });
      return;
    }

    if (!formData.assignedTo) {
      addToast({
        type: 'error',
        title: 'Champ obligatoire',
        message: 'L\'assignation à un technicien est obligatoire'
      });
      return;
    }

    const interventionData = {
      roomType: formData.roomType,
      location: formData.location.trim(),
      missionType: formData.missionType,
      missionSummary: formData.missionSummary.trim(),
      missionComment: formData.missionComment.trim(),
      assignedTo: formData.assignedTo,
      creator: formData.creator || user.uid,
      creatorName: safeDropdowns.creators.find(c => c.value === formData.creator)?.name || user.name,
      status: 'todo',
      priority: formData.priority,
      interventionType: formData.interventionType
    };

    const result = await onAddIntervention(interventionData, []);
    
    if (result.success) {
      onClose();
      setFormData({
        roomType: safeDropdowns.roomTypes[0]?.value || '',
        location: '',
        missionType: '',
        missionSummary: '',
        missionComment: '',
        assignedTo: '',
        creator: user?.uid || '',
        priority: 'normal',
        interventionType: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Nouvelle Intervention</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-900 dark:text-blue-100">Date et heure:</span>
                <p className="text-blue-700 dark:text-blue-300">{new Date().toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <span className="font-medium text-blue-900 dark:text-blue-100">Créé par:</span>
                <p className="text-blue-700 dark:text-blue-300">{user?.name}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type de Local */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de Local *
              </label>
              <select
                value={formData.roomType}
                onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Sélectionner un type de local</option>
                {safeDropdowns.roomTypes?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* ✅ SmartLocationField - Le nouveau composant intelligent */}
            {formData.roomType && onAddLocation && (
              <SmartLocationField
                value={formData.location}
                onChange={(value) => setFormData({...formData, location: value})}
                locations={safeDropdowns.locations}
                blockedRooms={blockedRooms}
                onAddLocation={onAddLocation}
                required={formData.roomType === 'chambre'}
                placeholder="Ex: Chambre 206, Suite 301..."
              />
            )}

            {/* Type d'intervention */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type d'intervention
              </label>
              <select
                value={formData.interventionType}
                onChange={(e) => setFormData({...formData, interventionType: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner...</option>
                {safeDropdowns.interventionTypes?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priorité
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {safeDropdowns.priorities?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mission - Résumé *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.missionSummary}
                  onChange={(e) => setFormData({...formData, missionSummary: e.target.value})}
                  onFocus={() => setShowMissionSuggestions(true)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Ex: Fuite robinet, Climatisation en panne, Ampoule à changer..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                
                {showMissionSuggestions && filteredMissionSuggestions.length > 0 && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filteredMissionSuggestions.map((mission, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleMissionSelect(mission)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg transition"
                      >
                        {mission.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Commentaire mission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Commentaire mission (optionnel)
              </label>
              <div className="relative">
                <textarea
                  value={formData.missionComment}
                  onChange={(e) => setFormData({...formData, missionComment: e.target.value})}
                  placeholder="Détails supplémentaires, observations particulières..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition min-h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={isListening}
                  className={`absolute bottom-3 right-3 p-2 rounded-full transition ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <Mic size={20} />
                </button>
              </div>
              {isListening && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                  <Mic size={16} className="inline mr-1" />
                  En écoute... Parlez maintenant
                </p>
              )}
            </div>

            {/* Assignation technicien */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigner à un technicien *
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Sélectionner un technicien</option>
                {safeAdminOptions.technicians?.map(technician => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}{technician.specialty ? ` - ${technician.specialty}` : ''}
                  </option>
                ))}
              </select>
              {(!safeAdminOptions.technicians || safeAdminOptions.technicians.length === 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Aucun technicien disponible. 
                  <button
                    type="button"
                    onClick={onManageDropdowns}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
                  >
                    Gérer les techniciens
                  </button>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Créer l'intervention
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInterventionModal;