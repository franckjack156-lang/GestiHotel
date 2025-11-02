// src/components/Interventions/CreateInterventionModal.jsx - VERSION CORRIGÉE
import React, { useMemo } from 'react';
import { ClipboardList, Home, User, Hammer, AlertCircle, FileText, Users } from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  SelectInput,
  TextInput,
  TextareaInput
} from '../common/FormFields';
import MultiSmartLocationField from '../common/MultiSmartLocationField'; // ✅ NOUVEAU IMPORT

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
    interventionTypes: getActiveOptions(dropdowns.interventionTypes),
    priorities: getActiveOptions(dropdowns.priorities),
  };

  const activeTechnicians = getActiveOptions(adminOptions.technicians);

  // ✅ Préparer les options pour MultiSmartLocationField (intervenants)
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
    interventionType: '',
    missionSummary: '',
    missionComment: '',
    priority: 'normal'
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

    return errors;
  };

  const handleSubmit = async (formData) => {
    console.log('📤 Soumission avec:', formData);

    try {
      const { locations, assignedTo, ...baseData } = formData;

      // ✅ STRATÉGIE : Créer une intervention par chambre
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
          
          // ✅ STRUCTURE HYBRIDE pour rétrocompatibilité
          location,               // String : première chambre (RÉTROCOMPAT)
          locations: [location],  // Array : toujours un array pour cohérence
          
          // ✅ Intervenants en format hybride
          assignedTo: assignedTo[0],      // String : premier intervenant (RÉTROCOMPAT)
          assignedToIds: assignedTo,      // Array : tous les IDs
          assignedToName: assignedNames,  // String : tous les noms concaténés
          
          // Autres champs
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

              {/* ✅ NOUVEAU : Multi-sélection avec suggestions intelligentes */}
              {formData.roomType === 'chambre' && (
                <div className="mt-4">
                  <MultiSmartLocationField
                    label="Chambres concernées"
                    value={formData.locations}
                    onChange={(newLocations) => {
                      console.log('📍 Nouvelles chambres sélectionnées:', newLocations);
                      setFormData(prev => ({ ...prev, locations: newLocations }));
                    }}
                    options={activeDropdowns.locations}  // ✅ Utiliser options, pas locations
                    warningCheck={(roomNumber) => {      // ✅ Fonction pour vérifier si bloquée
                      const blocked = blockedRooms.find(br => br.room === roomNumber && br.blocked === true);
                      return blocked ? '⚠️ Chambre bloquée' : null;
                    }}
                    onAddNew={onAddLocation}            // ✅ Pour créer de nouvelles chambres
                    allowRange={true}                   // ✅ Permettre 705-710
                    allowMultiple={true}                // ✅ Permettre 705,706,707
                    allowCustom={false}                 // ✅ Pas de valeurs custom sans validation
                    required
                    disabled={isSubmitting}
                    placeholder="Ex: 705 ou 705-710 ou 705,706,707"
                    icon={Home}
                    error={errors.locations}
                  />
                </div>
              )}

              {/* Autre type de local */}
              {formData.roomType !== 'chambre' && (
                <div className="mt-4">
                  <SelectInput
                    id="location"
                    label="Localisation"
                    required
                    value={formData.locations[0] || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, locations: [value] }))}
                    disabled={isSubmitting}
                    options={activeDropdowns.locations.map(loc => ({
                      value: typeof loc === 'object' ? loc.value : loc,
                      label: typeof loc === 'object' ? (loc.label || loc.name || loc.value) : loc
                    }))}
                    error={errors.locations}
                  />
                </div>
              )}
            </div>

            {/* Type d'intervention */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <Hammer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Type d'Intervention</h3>
              </div>

              <SelectInput
                id="interventionType"
                label="Type d'Intervention"
                value={formData.interventionType}
                onChange={(value) => setFormData(prev => ({ ...prev, interventionType: value }))}
                disabled={isSubmitting}
                options={activeDropdowns.interventionTypes.map(it => ({
                  value: it.value,
                  label: it.name
                }))}
              />

              <div className="mt-4">
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
              </div>
            </div>
          </div>

          {/* COLONNE DROITE */}
          <div className="space-y-5">
            {/* Description */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Description</h3>
              </div>

              <TextInput
                id="missionSummary"
                label="Résumé de la mission"
                required
                value={formData.missionSummary}
                onChange={(value) => setFormData(prev => ({ ...prev, missionSummary: value }))}
                placeholder="Ex: Réparation climatisation chambre 101"
                disabled={isSubmitting}
                error={errors.missionSummary}
              />

              <div className="mt-4">
                <TextareaInput
                  id="missionComment"
                  label="Commentaires"
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

              <MultiSmartLocationField
                label="Assigner à"
                value={formData.assignedTo}
                onChange={(newAssignedTo) => {
                  console.log('👤 Nouveaux intervenants:', newAssignedTo);
                  setFormData(prev => ({ ...prev, assignedTo: newAssignedTo }));
                }}
                options={technicianOptions}
                required
                disabled={isSubmitting}
                allowRange={false}     // ✅ Pas de plages pour les intervenants
                allowMultiple={false}  // ✅ Pas de format multiple non plus
                allowCustom={false}    // ✅ Pas de création à la volée
                placeholder="Rechercher un intervenant..."
                icon={User}
                error={errors.assignedTo}
              />

              {/* Info sur la création */}
              <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 {formData.locations.length > 0 && formData.assignedTo.length > 0 && (
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {formData.locations.length} intervention(s) seront créées avec {formData.assignedTo.length} intervenant(s)
                    </span>
                  )}
                </p>
                
                {/* ⚠️ Alertes chambres bloquées */}
                {formData.locations.some(loc => 
                  blockedRooms.some(br => br.room === loc && br.blocked === true)
                ) && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Certaines chambres sélectionnées sont bloquées
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </FormModal>
  );
};

export default CreateInterventionModal;