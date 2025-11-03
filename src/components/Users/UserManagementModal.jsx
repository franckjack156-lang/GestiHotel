import React, { useState } from 'react';
import { 
  User, RefreshCw, UserX, UserPlus, Key, Trash2, Calendar,
  AlertCircle, Save, Wrench, Link2, Shield
} from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  TextInput,
  SelectInput,
  FormSection,
  FormHelp
} from '../common/FormFields';

/**
 * Modal de gestion utilisateur - VERSION COMPLÈTE
 * ✨ Édition des informations
 * ✨ Lien vers un technicien (pour les utilisateurs techniciens)
 * ✨ Actions administratives (réinitialiser, désactiver, supprimer)
 * ✨ Historique et statistiques
 */
const UserManagementModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onUpdateUser, 
  onResetPassword,
  onDeleteUser,
  onActivateUser,
  onUpdatePassword,
  adminData = {}, // Pour le lien vers technicien
  currentUser // Pour vérifier les permissions
}) => {
  const [showDangerZone, setShowDangerZone] = useState(false);

  if (!user) return null;

  const initialData = {
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'reception',
    department: user.department || '',
    phone: user.phone || '',
    active: user.active !== false,
    // ✨ NOUVEAU : Lien vers un technicien
    linkedTechnicianId: user.linkedTechnicianId || ''
  };

  // Validation
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
    
    return errors;
  };

  // Soumission
  const handleSubmit = async (formData) => {
    return await onUpdateUser(user.id, formData);
  };

  // Actions administratives
  const handleToggleActive = async () => {
    const action = initialData.active ? 'désactiver' : 'activer';
    
    if (window.confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) {
      return await onActivateUser(user.id, !initialData.active);
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
    const confirmation = window.prompt(
      `⚠️ ATTENTION : Cette action est irréversible !\n\nPour confirmer la suppression de ${user.name}, tapez "SUPPRIMER":`
    );
    
    if (confirmation === 'SUPPRIMER') {
      return await onDeleteUser(user.id);
    }
    return { success: false };
  };

  // Vérifier les permissions
  const canEditRole = currentUser?.role === 'superadmin' || 
    (currentUser?.role === 'manager' && user?.role !== 'superadmin');

  const canDelete = currentUser?.role === 'superadmin' && 
    user?.id !== currentUser?.id;

  // Préparer les options de techniciens
  const technicianOptions = (adminData?.technicians || [])
    .filter(tech => tech.active !== false)
    .map(tech => ({
      value: tech.id,
      label: tech.name
    }));

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
      submitLabel="Enregistrer les modifications"
    >
      {({ formData, setFormData, errors, isSubmitting }) => (
        <div className="space-y-6">
          {/* Section Informations personnelles */}
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

          {/* Section Accès et permissions */}
          <FormSection
            title="Accès et permissions"
            description="Rôle et droits d'accès"
          >
            <SelectInput
              id="role"
              label="Rôle"
              required
              icon={Shield}
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
              disabled={isSubmitting || !canEditRole}
              options={[
                { value: 'reception', label: 'Réception', description: 'Créer des interventions' },
                { value: 'technician', label: 'Technicien', description: 'Gérer ses interventions' },
                { value: 'manager', label: 'Manager', description: 'Gérer toutes les interventions' },
                { value: 'superadmin', label: 'Super Admin', description: 'Accès complet' }
              ]}
            />

            {!canEditRole && (
              <FormHelp>
                ⚠️ Vous n'avez pas les permissions pour modifier le rôle de cet utilisateur.
              </FormHelp>
            )}
          </FormSection>

          {/* ✨ NOUVEAU : Lien vers technicien */}
          {formData.role === 'technician' && technicianOptions.length > 0 && (
            <FormSection
              title="Lien avec profil technique"
              description="Associer cet utilisateur à un profil de technicien existant"
            >
              <SelectInput
                id="linkedTechnicianId"
                label="Technicien associé"
                icon={Link2}
                value={formData.linkedTechnicianId}
                onChange={(value) => setFormData({ ...formData, linkedTechnicianId: value })}
                disabled={isSubmitting}
                options={[
                  { value: '', label: 'Aucun lien' },
                  ...technicianOptions
                ]}
              />

              <FormHelp>
                💡 Permet d'associer ce compte utilisateur à un profil technique pour les interventions.
                Les interventions assignées à ce technicien apparaîtront dans l'interface de cet utilisateur.
              </FormHelp>
            </FormSection>
          )}

          {/* Section Statistiques */}
          <FormSection
            title="Statistiques"
            description="Informations sur l'activité"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Statut
                </div>
                <div className={`font-semibold ${
                  formData.active 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formData.active ? '✓ Actif' : '✗ Inactif'}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Créé le
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString('fr-FR') : 'N/A'}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Dernière connexion
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {user.lastLogin ? new Date(user.lastLogin.toDate()).toLocaleDateString('fr-FR') : 'Jamais'}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  ID
                </div>
                <div className="font-mono text-xs text-gray-900 dark:text-white truncate">
                  {user.id}
                </div>
              </div>
            </div>
          </FormSection>

          {/* Actions administratives */}
          <FormSection
            title="Actions administratives"
            description="Gestion du compte utilisateur"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isSubmitting || user.id === currentUser?.id}
                className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.active
                    ? 'border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20'
                    : 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                }`}
              >
                {formData.active ? <UserX size={18} /> : <UserPlus size={18} />}
                {formData.active ? 'Désactiver' : 'Activer'} le compte
              </button>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} />
                Réinitialiser le mot de passe
              </button>
            </div>

            {user.id === currentUser?.id && (
              <FormHelp>
                ⚠️ Vous ne pouvez pas désactiver votre propre compte.
              </FormHelp>
            )}
          </FormSection>

          {/* Zone de danger */}
          {canDelete && (
            <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDangerZone(!showDangerZone)}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
              >
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
                  <AlertCircle size={18} />
                  Zone de danger
                </div>
                <span className="text-red-600 dark:text-red-400">
                  {showDangerZone ? '▼' : '▶'}
                </span>
              </button>

              {showDangerZone && (
                <div className="p-4 bg-red-50/50 dark:bg-red-900/10">
                  <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                    ⚠️ <strong>Attention :</strong> Cette action est irréversible et supprimera définitivement toutes les données de l'utilisateur.
                  </p>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={18} />
                    Supprimer définitivement l'utilisateur
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