// src/components/Interventions/CreateInterventionModal.jsx - VERSION OPTIMISÉE
import React from 'react';
import { ClipboardList, Home, MapPin, Hammer, AlertCircle } from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  SelectInput,
  TextInput,
  TextareaInput,
  FormSection,
  FormHelp
} from '../common/FormFields';
import SmartLocationField from '../common/SmartLocationField';

/**
 * Modal de création d'intervention - VERSION SIMPLIFIÉE
 * Réduction de 590 lignes à ~250 lignes
 */
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

  const initialData = {
    roomType: activeDropdowns.roomTypes[0]?.value || '',
    location: '',
    missionType: '',
    missionSummary: '',
    missionComment: '',
    assignedTo: '',
    priority: 'normal',
    interventionType: ''
  };

  const validate = (formData) => {
    const errors = {};

    if (!formData.location?.trim()) {
      errors.location = 'La localisation est obligatoire';
    }

    if (!formData.missionSummary?.trim()) {
      errors.missionSummary = 'Le résumé de mission est obligatoire';
    } else if (formData.missionSummary.trim().length < 3) {
      errors.missionSummary = 'Minimum 3 caractères';
    }

    if (!formData.assignedTo) {
      errors.assignedTo = 'L\'assignation est obligatoire';
    }

    return errors;
  };

  const handleSubmit = async (formData) => {
    const interventionData = {
      ...formData,
      creator: user.uid,
      creatorName: user.name || user.email,
      status: 'todo'
    };

    return await onAddIntervention(interventionData, []);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Intervention"
      subtitle="Créer une nouvelle demande d'intervention"
      icon={ClipboardList}
      size="lg"
      initialData={initialData}
      onSubmit={handleSubmit}
      validate={validate}
      submitLabel="Créer l'intervention"
    >
      {({ formData, setFormData, errors, isSubmitting }) => (
        <>
          {/* Section Contexte */}
          <FormSection
            title="Contexte de l'intervention"
            description="Informations sur le lieu et la création"
          >
            {/* Informations de création */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div>
                <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                  Date et heure
                </span>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {new Date().toLocaleString('fr-FR')}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                  Créé par
                </span>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {user?.name || user?.email}
                </p>
              </div>
            </div>

            {/* Type de local */}
            <SelectInput
              id="roomType"
              label="Type de Local"
              required
              value={formData.roomType}
              onChange={(value) => setFormData({ ...formData, roomType: value })}
              disabled={isSubmitting}
              options={activeDropdowns.roomTypes.map(rt => ({
                value: rt.value,
                label: rt.name
              }))}
            />

            {/* Localisation intelligente */}
            {formData.roomType && onAddLocation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Localisation
                  {formData.roomType === 'chambre' && <span className="text-red-500 ml-1">*</span>}
                </label>
                <SmartLocationField
                  value={formData.location}
                  onChange={(value) => setFormData({ ...formData, location: value })}
                  locations={activeDropdowns.locations}
                  blockedRooms={blockedRooms}
                  onAddLocation={onAddLocation}
                  required={formData.roomType === 'chambre'}
                  placeholder="Ex: Chambre 206, Suite 301..."
                />
                {errors.location && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.location}
                  </p>
                )}
              </div>
            )}
          </FormSection>

          {/* Section Détails de l'intervention */}
          <FormSection
            title="Détails de l'intervention"
            description="Décrire la nature et l'urgence de l'intervention"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type d'intervention */}
              <SelectInput
                id="interventionType"
                label="Type d'intervention"
                value={formData.interventionType}
                onChange={(value) => setFormData({ ...formData, interventionType: value })}
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
                onChange={(value) => setFormData({ ...formData, priority: value })}
                disabled={isSubmitting}
                options={activeDropdowns.priorities.map(p => ({
                  value: p.value,
                  label: p.name
                }))}
              />
            </div>

            {/* Type de mission */}
            <SelectInput
              id="missionType"
              label="Type de mission"
              value={formData.missionType}
              onChange={(value) => setFormData({ ...formData, missionType: value })}
              placeholder="Sélectionner..."
              disabled={isSubmitting}
              options={activeDropdowns.missionTypes.map(mt => ({
                value: mt.value,
                label: mt.name
              }))}
            />

            {/* Résumé de mission */}
            <TextInput
              id="missionSummary"
              label="Mission - Résumé"
              required
              value={formData.missionSummary}
              onChange={(value) => setFormData({ ...formData, missionSummary: value })}
              error={errors.missionSummary}
              placeholder="Ex: Fuite robinet, Climatisation en panne, Ampoule à changer..."
              disabled={isSubmitting}
              hint="Décrivez brièvement le problème à résoudre"
            />

            {/* Commentaire mission */}
            <TextareaInput
              id="missionComment"
              label="Commentaire mission"
              value={formData.missionComment}
              onChange={(value) => setFormData({ ...formData, missionComment: value })}
              placeholder="Détails supplémentaires, observations particulières..."
              disabled={isSubmitting}
              rows={4}
              hint="Ajoutez toutes les informations utiles pour le technicien"
            />
          </FormSection>

          {/* Section Assignation */}
          <FormSection
            title="Assignation"
            description="Sélectionner le technicien en charge"
          >
            <SelectInput
              id="assignedTo"
              label="Assigner à un technicien"
              required
              value={formData.assignedTo}
              onChange={(value) => setFormData({ ...formData, assignedTo: value })}
              error={errors.assignedTo}
              placeholder="Sélectionner un technicien"
              disabled={isSubmitting}
              options={activeTechnicians.map(tech => ({
                value: tech.id,
                label: `${tech.name}${tech.specialty ? ` - ${tech.specialty}` : ''}`
              }))}
            />

            {activeTechnicians.length === 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Aucun technicien disponible. Veuillez contacter un administrateur 
                    pour ajouter des techniciens au système.
                  </p>
                </div>
              </div>
            )}
          </FormSection>
        </>
      )}
    </FormModal>
  );
};

export default CreateInterventionModal;