// src/components/Users/UserManagementModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  User, RefreshCw, UserX, UserPlus, Trash2,
  AlertCircle, Link2, Shield, CheckCircle
} from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  TextInput,
  SelectInput,
  FormSection,
  FormHelp
} from '../common/FormFields';

const toSafeDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (typeof timestamp === 'number') return new Date(timestamp);
  if (typeof timestamp === 'string') return new Date(timestamp);
  return null;
};

const formatSafeDate = (timestamp, options = {}) => {
  const date = toSafeDate(timestamp);
  if (!date || isNaN(date.getTime())) return options.fallback || 'N/A';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  }).format(date);
};

const UserManagementModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onUpdateUser, 
  onResetPassword,
  onDeleteUser,
  onActivateUser,
  adminData = {},
  currentUser
}) => {
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');

  if (!user) return null;

  const technicianOptions = (adminData?.technicians || [])
    .filter(tech => tech.status === 'active' || tech.active !== false)
    .map(tech => ({
      value: tech.id,
      label: tech.name
    }));

  const initialData = {
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'reception',
    department: user.department || '',
    phone: user.phone || '',
    active: user.active !== false,
    linkedTechnicianId: user.linkedTechnicianId || ''
  };

  // ✅ Trouver le technicien sélectionné (depuis user OU depuis la sélection en cours)
  const linkedTechnicianInfo = React.useMemo(() => {
    const techId = selectedTechnicianId || user.linkedTechnicianId;
    if (!techId || !adminData?.technicians) return null;
    
    return adminData.technicians.find(t => t.id === techId) || null;
  }, [selectedTechnicianId, user.linkedTechnicianId, adminData?.technicians]);

  const validate = (formData) => {
    const errors = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Le nom est obligatoire';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    if (formData.role === 'technician' && formData.linkedTechnicianId) {
      const techExists = technicianOptions.some(t => t.value === formData.linkedTechnicianId);
      if (!techExists) {
        errors.linkedTechnicianId = 'Technicien invalide ou inactif';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (formData) => {
  console.log('📤 Mise à jour utilisateur:', {
    userId: user.id,
    linkedTechnicianId: formData.linkedTechnicianId,
    formData
  });

  if (formData.role !== 'technician') {
    formData.linkedTechnicianId = '';
  }

  try {
    const result = await onUpdateUser(user.id, formData);
    
    console.log('📥 Résultat onUpdateUser:', result);
    
    // ✅ Gestion défensive si result est undefined ou null
    if (!result) {
      console.warn('⚠️ onUpdateUser n\'a rien retourné, on considère comme un succès');
      onClose();
      return { success: true };
    }
    
    if (result.success) {
      console.log('✅ Utilisateur mis à jour avec succès');
      onClose();
    } else {
      console.error('❌ Erreur mise à jour:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Exception lors de la mise à jour:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour'
    };
  }
};

  const handleToggleActive = async () => {
    const action = initialData.active ? 'désactiver' : 'activer';
    if (window.confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) {
      const result = await onActivateUser(user.id, !initialData.active);
      if (result.success) {
        onClose();
      }
      return result;
    }
    return { success: false };
  };

  const handleResetPassword = async () => {
    if (window.confirm(`Réinitialiser le mot de passe de ${user.name} ?\nUn email sera envoyé à ${user.email}.`)) {
      return await onResetPassword(user.id);
    }
    return { success: false };
  };

  const handleDelete = async () => {
    const confirmation = window.prompt(`⚠️ Pour confirmer, tapez "SUPPRIMER":`);
    if (confirmation === 'SUPPRIMER') {
      const result = await onDeleteUser(user.id);
      if (result.success) {
        onClose();
      }
      return result;
    }
    return { success: false };
  };

  const canEditRole = currentUser?.role === 'superadmin' || 
    (currentUser?.role === 'manager' && user?.role !== 'superadmin');
  const canDelete = currentUser?.role === 'superadmin' && user?.id !== currentUser?.id;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gérer l'utilisateur"
      subtitle={user.email}
      icon={User}
      size="lg"
      initialData={initialData}
      onSubmit={handleSubmit}
      validate={validate}
      submitLabel="Enregistrer"
    >
      {({ formData, setFormData, errors, isSubmitting }) => (
        <div className="space-y-6">
          {/* Informations personnelles */}
          <FormSection
            title="Informations personnelles"
            description="Coordonnées de l'utilisateur"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                id="name"
                label="Nom complet"
                required
                icon={User}
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                error={errors.name}
                disabled={isSubmitting}
              />
              <TextInput
                id="email"
                type="email"
                label="Email"
                required
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                error={errors.email}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                id="phone"
                type="tel"
                label="Téléphone"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                disabled={isSubmitting}
                placeholder="+33 6 12 34 56 78"
              />
              <SelectInput
                id="department"
                label="Département"
                value={formData.department}
                onChange={(value) => setFormData({ ...formData, department: value })}
                disabled={isSubmitting}
                options={[
                  { value: '', label: 'Aucun département' },
                  { value: 'reception', label: 'Réception' },
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'menage', label: 'Ménage' },
                  { value: 'restaurant', label: 'Restaurant' },
                  { value: 'direction', label: 'Direction' }
                ]}
              />
            </div>
          </FormSection>

          {/* Rôle */}
          <FormSection title="Accès et permissions">
            <SelectInput
              id="role"
              label="Rôle"
              required
              icon={Shield}
              value={formData.role}
              onChange={(value) => {
                const newData = { ...formData, role: value };
                if (value !== 'technician') {
                  newData.linkedTechnicianId = '';
                  setSelectedTechnicianId('');
                }
                setFormData(newData);
              }}
              disabled={isSubmitting || !canEditRole}
              options={[
                { value: 'reception', label: 'Réception' },
                { value: 'technician', label: 'Technicien' },
                { value: 'manager', label: 'Manager' },
                { value: 'superadmin', label: 'Super Admin' }
              ]}
            />
          </FormSection>

          {/* Lien technicien */}
          {formData.role === 'technician' && (
            <FormSection
              title="Lien avec profil technique"
              description="Associer à un profil de technicien existant"
            >
              {technicianOptions.length > 0 ? (
                <>
                  <SelectInput
                    id="linkedTechnicianId"
                    label="Technicien associé"
                    icon={Link2}
                    value={formData.linkedTechnicianId}
                    onChange={(value) => {
                      console.log('🔗 Sélection:', value);
                      setFormData({ ...formData, linkedTechnicianId: value });
                      setSelectedTechnicianId(value); // ✅ Mettre à jour le state local
                    }}
                    disabled={isSubmitting}
                    options={[
                      { value: '', label: '-- Aucun lien --' },
                      ...technicianOptions
                    ]}
                    error={errors.linkedTechnicianId}
                  />

                  {/* Afficher le statut en temps réel */}
                  {formData.linkedTechnicianId && linkedTechnicianInfo && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="text-green-600 dark:text-green-400 mt-0.5" size={20} />
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            ✓ Lié à {linkedTechnicianInfo.name}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Les interventions assignées à ce technicien seront visibles pour cet utilisateur.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.linkedTechnicianId && !linkedTechnicianInfo && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={20} />
                        <div>
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            ⚠️ Technicien non trouvé
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            ID: {formData.linkedTechnicianId}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!formData.linkedTechnicianId && (
                    <FormHelp>
                      💡 Optionnel : Lier ce compte à un profil de technicien pour filtrer les interventions.
                    </FormHelp>
                  )}
                </>
              ) : (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Aucun technicien disponible. Créez d'abord des techniciens dans les paramètres.
                  </p>
                </div>
              )}
            </FormSection>
          )}

          {/* Statistiques */}
          <FormSection title="Statistiques">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Statut</div>
                <div className={`font-semibold ${formData.active ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.active ? '✓ Actif' : '✗ Inactif'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Créé le</div>
                <div className="font-semibold text-gray-900 dark:text-white">{formatSafeDate(user.createdAt)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dernière connexion</div>
                <div className="font-semibold text-gray-900 dark:text-white">{formatSafeDate(user.lastLogin, { fallback: 'Jamais' })}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">ID</div>
                <div className="font-mono text-xs text-gray-900 dark:text-white truncate">{user.id}</div>
              </div>
            </div>
          </FormSection>

          {/* Actions */}
          <FormSection title="Actions administratives">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isSubmitting || user.id === currentUser?.id}
                className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg font-medium transition disabled:opacity-50 ${
                  formData.active
                    ? 'border-orange-300 text-orange-700 hover:bg-orange-50'
                    : 'border-green-300 text-green-700 hover:bg-green-50'
                }`}
              >
                {formData.active ? <UserX size={18} /> : <UserPlus size={18} />}
                {formData.active ? 'Désactiver' : 'Activer'}
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50"
              >
                <RefreshCw size={18} />
                Réinitialiser mot de passe
              </button>
            </div>
          </FormSection>

          {/* Zone de danger */}
          {canDelete && (
            <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDangerZone(!showDangerZone)}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
                  <AlertCircle size={18} />
                  Zone de danger
                </div>
                <span className="text-red-600 dark:text-red-400">{showDangerZone ? '▼' : '▶'}</span>
              </button>
              {showDangerZone && (
                <div className="p-4 bg-red-50/50 dark:bg-red-900/10">
                  <p className="text-sm text-red-700 dark:text-red-400 mb-3">⚠️ Action irréversible</p>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </FormModal>
  );
};

export default UserManagementModal;