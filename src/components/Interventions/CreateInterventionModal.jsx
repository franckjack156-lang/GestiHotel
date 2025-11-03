// src/components/Interventions/CreateInterventionModal.jsx - VERSION REFACTORISÉE COMPLÈTE
import React, { useMemo } from 'react';
import { ClipboardList, Home, User, FileText } from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  SelectInput,
  TextInput,
  TextareaInput,
  FormSection
} from '../common/FormFields';
import MultiSmartLocationField from '../common/MultiSmartLocationField';

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
  console.log('🎨 CreateInterventionModal - Render', { isOpen });

  // Filtrer les options actives
  const getActiveOptions = (items = []) => 
    items.filter(item => item.active !== false);

  const activeDropdowns = {
    roomTypes: getActiveOptions(dropdowns.roomTypes),
    locations: getActiveOptions(dropdowns.locations),
    interventionTypes: getActiveOptions(dropdowns.interventionTypes),
    priorities: getActiveOptions(dropdowns.priorities),
  };

  const activeTechnicians = getActiveOptions(adminOptions.technicians);

  // Préparer les options pour MultiSmartLocationField (intervenants)
  const technicianOptions = useMemo(() => {
    return activeTechnicians.map(tech => ({
      value: tech.id,
      label: tech.name
    }));
  }, [activeTechnicians]);

  // Initial data avec arrays pour multi-sélection
  const initialData = useMemo(() => ({
    roomType: 'chambre',
    locations: [],          // Array de chambres
    assignedTo: [],         // Array d'intervenants
    interventionType: '',
    missionSummary: '',
    missionComment: '',
    priority: 'normal'
  }), []);

  // Validation
  const validate = (formData) => {
    console.log('✅ Validation - formData:', formData);
    const errors = {};

    if (!formData.roomType) {
      errors.roomType = 'Le type de local est requis';
    }

    if (!formData.locations || formData.locations.length === 0) {
      errors.locations = 'Au moins une localisation est requise';
    }

    if (!formData.assignedTo || formData.assignedTo.length === 0) {
      errors.assignedTo = 'Au moins un intervenant est requis';
    }

    if (!formData.missionSummary || !formData.missionSummary.trim()) {
      errors.missionSummary = 'Le résumé de la mission est requis';
    }

    console.log('✅ Validation - errors:', errors);
    return errors;
  };

  // Soumission
  const handleSubmit = async (formData) => {
    console.log('📤 CreateInterventionModal - handleSubmit appelé avec:', formData);
    
    const { locations, assignedTo, ...baseData } = formData;

    // Créer une intervention par chambre
    const promises = locations.map(async (location) => {
      // Récupérer les noms des intervenants
      const assignedNames = assignedTo
        .map(id => {
          const tech = activeTechnicians.find(t => t.id === id);
          return tech ? tech.name : id;
        })
        .join(', ');

      const interventionData = {
        ...baseData,
        locations: [location],  // Structure unique (array)
        assignedTo: assignedTo[0],
        assignedToIds: assignedTo,
        assignedToName: assignedNames,
        roomBlocked: blockedRooms.some(br => br.room === location && br.blocked === true),
        createdBy: user.uid,
        createdByName: user.name || user.email,
        status: 'todo'
      };

      console.log('📤 Création intervention:', interventionData);
      return await onAddIntervention(interventionData, []);
    });

    await Promise.all(promises);
    
    console.log('✅ CreateInterventionModal - Toutes les interventions créées');
    return {
      success: true,
      message: `${locations.length} intervention(s) créée(s)`
    };
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
          
          {/* COLONNE GAUCHE - Localisation */}
          <FormSection
            title="Localisation"
            description="Où se situe l'intervention ?"
          >
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

            {formData.roomType === 'chambre' && (
              <MultiSmartLocationField
                label="Chambres concernées"
                value={formData.locations}
                onChange={(newLocations) => 
                  setFormData(prev => ({ ...prev, locations: newLocations }))
                }
                options={activeDropdowns.locations}
                warningCheck={(roomNumber) => {
                  const blocked = blockedRooms.find(br => br.room === roomNumber && br.blocked === true);
                  return blocked ? '⚠️ Chambre bloquée' : null;
                }}
                onAddNew={onAddLocation}
                allowRange={true}
                allowMultiple={true}
                required
                disabled={isSubmitting}
                placeholder="Ex: 705 ou 705-710"
                icon={Home}
                error={errors.locations}
              />
            )}

            {formData.roomType !== 'chambre' && (
              <SelectInput
                id="location"
                label="Localisation"
                required
                value={formData.locations[0] || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, locations: [value] }))}
                disabled={isSubmitting}
                options={activeDropdowns.locations.map(loc => ({
                  value: typeof loc === 'object' ? loc.value : loc,
                  label: typeof loc === 'object' ? loc.label : loc
                }))}
                error={errors.locations}
              />
            )}
          </FormSection>

          {/* COLONNE DROITE - Assignation */}
          <FormSection
            title="Assignation"
            description="Qui va intervenir ?"
          >
            <MultiSmartLocationField
              label="Intervenants"
              value={formData.assignedTo}
              onChange={(newAssignedTo) =>
                setFormData(prev => ({ ...prev, assignedTo: newAssignedTo }))
              }
              options={technicianOptions}
              allowRange={false}
              allowMultiple={false}
              allowCustom={false}
              required
              disabled={isSubmitting}
              placeholder="Rechercher un intervenant..."
              icon={User}
              error={errors.assignedTo}
            />

            <SelectInput
              id="priority"
              label="Priorité"
              value={formData.priority}
              onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              disabled={isSubmitting}
              options={activeDropdowns.priorities.map(p => ({
                value: p.value,
                label: p.name
              }))}
            />
          </FormSection>

          {/* SECTION COMPLÈTE - Mission */}
          <div className="lg:col-span-2">
            <FormSection
              title="Description de la mission"
              description="Décrivez l'intervention à réaliser"
            >
              <TextInput
                id="missionSummary"
                label="Résumé de la mission"
                required
                value={formData.missionSummary}
                onChange={(value) => setFormData(prev => ({ ...prev, missionSummary: value }))}
                disabled={isSubmitting}
                placeholder="Ex: Fuite robinet salle de bain"
                error={errors.missionSummary}
              />

              <TextareaInput
                id="missionComment"
                label="Commentaires additionnels"
                value={formData.missionComment}
                onChange={(value) => setFormData(prev => ({ ...prev, missionComment: value }))}
                disabled={isSubmitting}
                placeholder="Détails supplémentaires, observations..."
                rows={3}
              />

              <SelectInput
                id="interventionType"
                label="Type d'intervention"
                value={formData.interventionType}
                onChange={(value) => setFormData(prev => ({ ...prev, interventionType: value }))}
                disabled={isSubmitting}
                options={activeDropdowns.interventionTypes.map(it => ({
                  value: it.value,
                  label: it.name
                }))}
              />
            </FormSection>
          </div>

          {/* Info résumé */}
          {formData.locations.length > 0 && formData.assignedTo.length > 0 && (
            <div className="lg:col-span-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                💡 <strong>{formData.locations.length} intervention(s)</strong> seront créées 
                avec <strong>{formData.assignedTo.length} intervenant(s)</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </FormModal>
  );
};

export default CreateInterventionModal;