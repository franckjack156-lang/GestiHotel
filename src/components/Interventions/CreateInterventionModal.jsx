// src/components/Interventions/CreateInterventionModal.jsx
// ✅ VERSION AVEC TEMPLATES
import React, { useMemo, useEffect } from 'react';
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
  onSubmit, 
  dropdowns = {}, 
  users = [],
  currentUser, 
  blockedRooms = [],
  onAddLocation,
  prefilledData = null,      // ✨ NOUVEAU - Données pré-remplies (QR/Template)
  onOpenTemplates             // ✨ NOUVEAU - Ouvrir le gestionnaire de templates
}) => {
  console.log('🎨 CreateInterventionModal - Render', { isOpen, prefilledData });

  // Filtrer les options actives
  const getActiveOptions = (items = []) => 
    items.filter(item => item.active !== false);

  const activeDropdowns = {
    roomTypes: getActiveOptions(dropdowns.roomTypes),
    locations: getActiveOptions(dropdowns.locations),
    interventionTypes: getActiveOptions(dropdowns.interventionTypes),
    priorities: getActiveOptions(dropdowns.priorities),
  };

  // Filtrer les techniciens actifs
  const activeTechnicians = useMemo(() => {
    return users.filter(u => u.role === 'technician' && u.active !== false);
  }, [users]);

  // Préparer les options pour MultiSmartLocationField (intervenants)
  const technicianOptions = useMemo(() => {
    return activeTechnicians.map(tech => ({
      value: tech.id,
      label: tech.name
    }));
  }, [activeTechnicians]);

  // ✨ Initial data avec pré-remplissage possible
  const initialData = useMemo(() => {
    const defaultData = {
      roomType: 'chambre',
      locations: [],
      assignedTo: [],
      interventionType: '',
      missionSummary: '',
      missionComment: '',
      priority: 'normal'
    };

    // Si des données pré-remplies (template ou QR code)
    if (prefilledData) {
      return {
        ...defaultData,
        ...prefilledData,
        // S'assurer que locations et assignedTo sont des arrays
        locations: Array.isArray(prefilledData.locations) 
          ? prefilledData.locations 
          : prefilledData.locations 
            ? [prefilledData.locations] 
            : [],
        assignedTo: Array.isArray(prefilledData.assignedTo)
          ? prefilledData.assignedTo
          : prefilledData.assignedTo
            ? [prefilledData.assignedTo]
            : []
      };
    }

    return defaultData;
  }, [prefilledData]);

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
        locations: [location],
        assignedTo: assignedTo[0],
        assignedToIds: assignedTo,
        assignedToName: assignedNames,
        roomBlocked: blockedRooms.some(br => br.room === location && br.blocked === true),
        status: 'todo'
      };

      console.log('📤 Création intervention:', interventionData);
      return await onSubmit(interventionData);
    });

    await Promise.all(promises);
    
    console.log('✅ CreateInterventionModal - Toutes les interventions créées');
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
        <div className="space-y-6">
          
          {/* ✨ BOUTON TEMPLATE */}
          {onOpenTemplates && !prefilledData && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onOpenTemplates}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center gap-2"
              >
                <FileText size={20} />
                Utiliser un template
              </button>
            </div>
          )}

          {/* ✨ INDICATEUR TEMPLATE UTILISÉ */}
          {prefilledData && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <FileText size={20} />
                <span className="font-medium">
                  {prefilledData.templateName 
                    ? `Template "${prefilledData.templateName}" appliqué` 
                    : 'Données pré-remplies depuis QR Code'}
                </span>
              </div>
            </div>
          )}

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
          </div>

          {/* SECTION COMPLÈTE - Mission */}
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

          {/* Info résumé */}
          {formData.locations.length > 0 && formData.assignedTo.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
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