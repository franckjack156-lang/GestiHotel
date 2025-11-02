// src/components/Interventions/CreateInterventionModal.jsx - VERSION ADAPTÉE MULTI-SÉLECTION
import React, { useMemo } from 'react';
import { ClipboardList, Home, User, Hammer, AlertCircle, FileText, Users } from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  SelectInput,
  TextInput,
  TextareaInput
} from '../common/FormFields';
import MultiSelectField from '../common/MultiSelectField';

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

  // ✅ Préparer les options pour MultiSelectField
  const locationOptions = useMemo(() => {
    return activeDropdowns.locations.map(loc => ({
      value: typeof loc === 'object' ? loc.value : loc,
      label: typeof loc === 'object' ? (loc.label || loc.name || loc.value) : loc
    }));
  }, [activeDropdowns.locations]);

  const technicianOptions = useMemo(() => {
    return activeTechnicians.map(tech => ({
      value: tech.id,
      label: tech.name
    }));
  }, [activeTechnicians]);

  // ✅ Initial data avec arrays pour multi-sélection
  const initialData = useMemo(() => ({
    roomType: 'chambre',
    locations: [],          // ✅ Array de chambres
    assignedTo: [],         // ✅ Array d'intervenants
    missionType: '',
    missionSummary: '',
    missionComment: '',
    priority: 'normal',
    interventionType: ''
  }), [isOpen]);

  const validate = async (formData) => {
    console.log('🔍 Validation avec formData:', formData);
    
    const errors = {};

    // ✅ Au moins une chambre
    if (!formData.locations || formData.locations.length === 0) {
      errors.locations = 'Au moins une chambre est obligatoire';
    }

    // ✅ Au moins un intervenant
    if (!formData.assignedTo || formData.assignedTo.length === 0) {
      errors.assignedTo = 'Au moins un intervenant est obligatoire';
    }

    if (!formData.missionSummary?.trim()) {
      errors.missionSummary = 'Le résumé de mission est obligatoire';
    } else if (formData.missionSummary.trim().length < 5) {
      errors.missionSummary = 'Minimum 5 caractères';
    }

    if (!formData.missionType) {
      errors.missionType = 'Le type de mission est obligatoire';
    }

    return errors;
  };

  const handleSubmit = async (formData) => {
    console.log('📤 Soumission avec:', formData);

    try {
      const { locations, assignedTo, ...baseData } = formData;

      // ✅ STRATÉGIE : Créer une intervention par combinaison chambre
      // Si 3 chambres et 2 intervenants = 3 interventions (une par chambre)
      // avec tous les intervenants assignés à chaque

      const promises = locations.map(async (location) => {
        // Récupérer les noms des intervenants
        const assignedNames = assignedTo.map(techId => {
          const tech = activeTechnicians.find(t => t.id === techId);
          return tech?.name || 'Non assigné';
        }).join(', ');

        const interventionData = {
          ...baseData,
          location,               // Chambre unique
          locations: [location],  // Array avec une chambre
          assignedTo: assignedTo[0],  // Premier intervenant (principal)
          assignedToIds: assignedTo,  // ✅ NOUVEAU : Tous les IDs
          assignedToName: assignedNames,  // ✅ NOUVEAU : Tous les noms
          roomBlocked: blockedRooms.some(br => br.room === location && br.blocked === true),
          createdBy: user.uid,
          createdByName: user.name || user.email,
          status: 'todo'
        };

        return await onAddIntervention(interventionData, []);
      });

      await Promise.all(promises);
      
      return {
        success: true,
        message: `${locations.length} intervention(s) créée(s) avec ${assignedTo.length} intervenant(s)`
      };
    } catch (error) {
      console.error('❌ Erreur création:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // ✅ Fonction pour vérifier si une chambre est bloquée
  const checkIfRoomBlocked = (roomValue) => {
    const blocked = blockedRooms.find(br => br.room === roomValue && br.blocked === true);
    return blocked ? 'Bloquée' : null;
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
          {/* COLONNE GAUCHE */}
          <div className="space-y-5">
            {/* Contexte */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Localisation</h3>
              </div>
              
              {/* Type de local */}
              <SelectInput
                id="roomType"
                label="Type de Local"
                required
                value={formData.roomType}
                onChange={(value) => setFormData(prev => ({ ...prev, roomType: value }))}
                disabled={isSubmitting}
                options={activeDropdowns.roomTypes.map(rt => ({
                  value: rt.value,
                  label: rt.name
                }))}
              />

              {/* ✅ Multi-sélection des chambres */}
              {formData.roomType === 'chambre' && (
                <div className="mt-4">
                  <MultiSelectField
                    label="Chambres concernées"
                    value={formData.locations}
                    onChange={(newLocations) => {
                      setFormData(prev => ({ ...prev, locations: newLocations }));
                    }}
                    options={locationOptions}
                    placeholder="Choisir depuis la liste"
                    addPlaceholder="Ex: 705 ou 705-710 ou 705,706,707"
                    required
                    disabled={isSubmitting}
                    allowRange={true}
                    allowCustom={true}
                    warningCheck={checkIfRoomBlocked}
                    icon={Home}
                  />
                  {errors.locations && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.locations}
                    </p>
                  )}
                </div>
              )}

              {/* Pour les autres types de local */}
              {formData.roomType !== 'chambre' && (
                <div className="mt-4">
                  <TextInput
                    id="singleLocation"
                    label="Localisation"
                    placeholder="Ex: Couloir étage 3..."
                    value={formData.locations[0] || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, locations: [value] }))}
                    disabled={isSubmitting}
                  />
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

              <div className="mt-3">
                <SelectInput
                  id="missionType"
                  label="Type de mission"
                  required
                  value={formData.missionType}
                  onChange={(value) => setFormData(prev => ({ ...prev, missionType: value }))}
                  placeholder="Sélectionner..."
                  disabled={isSubmitting}
                  error={errors.missionType}
                  options={activeDropdowns.missionTypes.map(mt => ({
                    value: mt.value,
                    label: mt.name
                  }))}
                />
              </div>
            </div>
          </div>

          {/* COLONNE DROITE */}
          <div className="space-y-5">
            {/* Description */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Description</h3>
              </div>

              <TextInput
                id="missionSummary"
                label="Résumé de la mission"
                required
                value={formData.missionSummary}
                onChange={(value) => setFormData(prev => ({ ...prev, missionSummary: value }))}
                error={errors.missionSummary}
                placeholder="Brève description du problème..."
                disabled={isSubmitting}
              />

              <div className="mt-3">
                <TextareaInput
                  id="missionComment"
                  label="Commentaires détaillés"
                  value={formData.missionComment}
                  onChange={(value) => setFormData(prev => ({ ...prev, missionComment: value }))}
                  placeholder="Détails supplémentaires..."
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>
            </div>

            {/* ✅ Multi-sélection des intervenants */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Intervenants</h3>
              </div>

              <MultiSelectField
                label="Assigner à"
                value={formData.assignedTo}
                onChange={(newAssignedTo) => {
                  setFormData(prev => ({ ...prev, assignedTo: newAssignedTo }));
                }}
                options={technicianOptions}
                placeholder="Choisir un ou plusieurs intervenants"
                addPlaceholder="Rechercher un intervenant..."
                required
                disabled={isSubmitting}
                allowRange={false}
                allowCustom={false}
                icon={User}
              />
              {errors.assignedTo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.assignedTo}
                </p>
              )}

              {/* Info sur la création */}
              <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 {formData.locations.length > 0 && formData.assignedTo.length > 0 && (
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {formData.locations.length} intervention(s) seront créées
                    </span>
                  )}
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