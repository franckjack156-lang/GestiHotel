import React, { useMemo } from 'react';
import { ClipboardList, Home, User, Hammer, AlertCircle, FileText } from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  SelectInput,
  TextInput,
  TextareaInput
} from '../common/FormFields';
import SmartLocationField from '../common/SmartLocationField';

const CreateInterventionModal = ({ 
  isOpen, 
  onClose, 
  onAddIntervention, 
  dropdowns = {}, 
  adminOptions = {}, 
  user, 
  blockedRooms = [],
  onAddLocation
}) => {
  // Filtrer les options actives
  const getActiveOptions = (items = []) => 
    items.filter(item => item.active !== false);

  const activeDropdowns = {
    roomTypes: getActiveOptions(dropdowns.roomTypes),
    locations: getActiveOptions(dropdowns.locations),
    missionTypes: getActiveOptions(dropdowns.missionTypes),
    interventionTypes: getActiveOptions(dropdowns.interventionTypes),
    priorities: getActiveOptions(dropdowns.priorities),
  };

  const activeTechnicians = getActiveOptions(adminOptions.technicians);

  // ✅ CORRECTION: Mémoriser initialData pour qu'il ne change pas quand dropdowns change
  const initialData = useMemo(() => ({
    roomType: activeDropdowns.roomTypes[0]?.value || '',
    location: '',
    missionType: '',
    missionSummary: '',
    missionComment: '',
    assignedTo: '',
    assignedToName: '',
    priority: 'normal',
    interventionType: ''
  }), [isOpen]); // ✅ Ne recalculer que quand la modale s'ouvre/ferme

  const validate = async (formData) => {
    console.log('🔍 Validation démarrée avec formData:', formData);
    
    const errors = {};

    // ✅ N° de chambre obligatoire uniquement pour les chambres
    if (formData.roomType === 'chambre' && !formData.location?.trim()) {
      errors.location = 'Le numéro de chambre est obligatoire';
      console.log('❌ Erreur: numéro de chambre manquant');
    }

    if (!formData.missionSummary?.trim()) {
      errors.missionSummary = 'Le résumé de mission est obligatoire';
      console.log('❌ Erreur: résumé de mission manquant');
    } else if (formData.missionSummary.trim().length < 3) {
      errors.missionSummary = 'Minimum 3 caractères';
      console.log('❌ Erreur: résumé de mission trop court');
    }

    if (!formData.assignedTo) {
      errors.assignedTo = 'L\'assignation est obligatoire';
      console.log('❌ Erreur: assignation manquante');
    }

    console.log('🔍 Résultat validation:', { 
      errors, 
      hasErrors: Object.keys(errors).length > 0,
      errorCount: Object.keys(errors).length 
    });

    return errors;
  };

  const handleSubmit = async (formData) => {
    console.log('🚀 handleSubmit appelé avec formData:', formData);
    
    const selectedTech = activeTechnicians.find(t => t.id === formData.assignedTo);
    
    console.log('📝 Création intervention avec données:', {
      ...formData,
      assignedToName: selectedTech?.name || 'Non assigné',
      creator: user.uid,
      creatorName: user.name || user.email
    });

    const interventionData = {
      ...formData,
      assignedToName: selectedTech?.name || 'Non assigné',
      creator: user.uid,
      creatorName: user.name || user.email,
      status: 'todo'
    };

    const result = await onAddIntervention(interventionData, []);
    console.log('✅ Résultat de onAddIntervention:', result);
    return result;
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Intervention"
      subtitle="Créer une nouvelle demande d'intervention"
      icon={ClipboardList}
      size="xl"
      initialData={initialData}
      onSubmit={handleSubmit}
      validate={validate}
      submitLabel="Créer l'intervention"
    >
      {({ formData, setFormData, errors, isSubmitting }) => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLONNE GAUCHE - Localisation & Détails */}
          <div className="space-y-5">
            {/* Contexte */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Contexte</h3>
              </div>
              
              {/* Type de local */}
              <SelectInput
                id="roomType"
                label="Type de Local"
                required
                value={formData.roomType}
                onChange={(value) => setFormData(prev => ({ ...prev, roomType: value, location: '' }))}
                disabled={isSubmitting}
                options={activeDropdowns.roomTypes.map(rt => ({
                  value: rt.value,
                  label: rt.name
                }))}
              />

              {/* N° de chambre - Uniquement pour les chambres */}
              {formData.roomType === 'chambre' && onAddLocation && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    N° de Chambre
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <SmartLocationField
                    value={formData.location}
                    onChange={(value) => {
                      console.log('🔄 onChange location:', value);
                      setFormData(prev => ({ ...prev, location: value }));
                    }}
                    locations={activeDropdowns.locations}
                    blockedRooms={blockedRooms}
                    onAddLocation={async (newLocation) => {
                      console.log('🔄 onAddLocation appelé avec:', newLocation);
                      console.log('📸 formData AVANT ajout:', formData);
                      
                      // ✅ Appeler la fonction parente pour ajouter la location
                      const result = await onAddLocation(newLocation);
                      
                      if (result?.success) {
                        console.log('✅ Location ajoutée avec succès');
                        console.log('📸 formData APRÈS ajout:', formData);
                        
                        // ✅ Mettre à jour UNIQUEMENT la location
                        setFormData(prev => {
                          const updated = { ...prev, location: newLocation.name };
                          console.log('📝 FormData mis à jour:', updated);
                          return updated;
                        });
                      }
                      
                      return result;
                    }}
                    required={true}
                    placeholder="Ex: 206, 301, Suite 405..."
                  />
                  {errors.location && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.location}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Nature de l'intervention */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-3">
                <Hammer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Nature de l'intervention</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Type d'intervention */}
                <SelectInput
                  id="interventionType"
                  label="Type"
                  value={formData.interventionType}
                  onChange={(value) => setFormData(prev => ({ ...prev, interventionType: value }))}
                  placeholder="Sélectionner..."
                  disabled={isSubmitting}
                  options={activeDropdowns.interventionTypes.map(it => ({
                    value: it.value,
                    label: it.name
                  }))}
                />

                {/* Priorité */}
                <SelectInput
                  id="priority"
                  label="Priorité"
                  required
                  value={formData.priority}
                  onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  disabled={isSubmitting}
                  options={activeDropdowns.priorities.map(p => ({
                    value: p.value,
                    label: p.name
                  }))}
                />
              </div>

              {/* Type de mission */}
              <div className="mt-3">
                <SelectInput
                  id="missionType"
                  label="Type de mission"
                  value={formData.missionType}
                  onChange={(value) => setFormData(prev => ({ ...prev, missionType: value }))}
                  placeholder="Sélectionner..."
                  disabled={isSubmitting}
                  options={activeDropdowns.missionTypes.map(mt => ({
                    value: mt.value,
                    label: mt.name
                  }))}
                />
              </div>
            </div>
          </div>

          {/* COLONNE DROITE - Description & Assignation */}
          <div className="space-y-5">
            {/* Description */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Description</h3>
              </div>

              {/* Résumé de mission */}
              <TextInput
                id="missionSummary"
                label="Résumé de la mission"
                required
                value={formData.missionSummary}
                onChange={(value) => setFormData(prev => ({ ...prev, missionSummary: value }))}
                error={errors.missionSummary}
                placeholder="Ex: Fuite robinet, Climatisation en panne..."
                disabled={isSubmitting}
              />

              {/* Commentaire mission */}
              <div className="mt-3">
                <TextareaInput
                  id="missionComment"
                  label="Détails supplémentaires"
                  value={formData.missionComment}
                  onChange={(value) => setFormData(prev => ({ ...prev, missionComment: value }))}
                  placeholder="Observations, précisions pour le technicien..."
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>
            </div>

            {/* Assignation */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Assignation</h3>
              </div>

              <SelectInput
                id="assignedTo"
                label="Technicien en charge"
                required
                value={formData.assignedTo}
                onChange={(value) => {
                  const selectedTech = activeTechnicians.find(t => t.id === value);
                  console.log('🔄 Technicien sélectionné:', selectedTech);
                  setFormData(prev => ({ 
                    ...prev, 
                    assignedTo: value,
                    assignedToName: selectedTech?.name || 'Non assigné'
                  }));
                }}
                error={errors.assignedTo}
                placeholder="Sélectionner un technicien"
                disabled={isSubmitting}
                options={activeTechnicians.map(tech => ({
                  value: tech.id,
                  label: `${tech.name}${tech.specialty ? ` - ${tech.specialty}` : ''}`
                }))}
              />

              {activeTechnicians.length === 0 && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Aucun technicien disponible. Contactez un administrateur.
                    </p>
                  </div>
                </div>
              )}

              {/* Info création */}
              <div className="mt-4 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Créé par:</span> {user?.name || user?.email}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  <span className="font-medium">Date:</span> {new Date().toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </FormModal>
  );
};

export default CreateInterventionModal;