// src/components/Users/UserManagementModal.jsx - VERSION OPTIMISÉE
import React from 'react';
import { 
  User, RefreshCw, UserX, UserPlus, Key, Trash2, Calendar,
  AlertCircle, Save
} from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  TextInput,
  SelectInput,
  FormSection,
  FormHelp
} from '../common/FormFields';

/**
 * Modal de gestion utilisateur - VERSION SIMPLIFIÉE
 * Réduction de 450 lignes à ~200 lignes
 */
const UserManagementModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onUpdateUser, 
  onResetPassword,
  onDeleteUser,
  onActivateUser,
  onUpdatePassword 
}) => {
  if (!user) return null;

  const initialData = {
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'reception',
    department: user.department || '',
    phone: user.phone || '',
    active: user.active !== false
  };

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

  const handleSubmit = async (formData) => {
    return await onUpdateUser(user.id, formData);
  };

  const handleToggleActive = async () => {
    const action = initialData.active ? 'désactiver' : 'activer';
    if (confirm(`Êtes-vous sûr de vouloir ${action} l'utilisateur ${user.name} ?`)) {
      if (initialData.active) {
        await onDeleteUser(user.id);
      } else {
        await onActivateUser(user.id);
      }
    }
  };

  const handleResetPassword = async () => {
    if (confirm(`Réinitialiser le mot de passe de ${user.name} ?`)) {
      const result = await onResetPassword(user.id);
      if (result?.success && result?.tempPassword) {
        alert(`Nouveau mot de passe temporaire : ${result.tempPassword}\n\nL'utilisateur devra le changer à sa première connexion.`);
      }
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gérer l'utilisateur"
      subtitle={`Modifier les informations de ${user.name}`}
      icon={User}
      size="lg"
      initialData={initialData}
      onSubmit={handleSubmit}
      validate={validate}
      submitLabel="Enregistrer les modifications"
    >
      {({ formData, setFormData, errors, isSubmitting }) => (
        <>
          {/* Section Informations de base */}
          <FormSection
            title="Informations personnelles"
            description="Modifier les coordonnées de l'utilisateur"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                id="name"
                label="Nom complet"
                required
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
                placeholder="Sélectionner un département"
                disabled={isSubmitting}
                options={[
                  { value: 'reception', label: 'Réception' },
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'menage', label: 'Ménage' },
                  { value: 'restaurant', label: 'Restaurant' },
                  { value: 'direction', label: 'Direction' }
                ]}
              />
            </div>
          </FormSection>

          {/* Section Rôle et permissions */}
          <FormSection
            title="Accès et permissions"
            description="Définir le niveau d'accès de l'utilisateur"
          >
            <SelectInput
              id="role"
              label="Rôle"
              required
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
              disabled={isSubmitting}
              options={[
                { value: 'reception', label: 'Réception' },
                { value: 'technician', label: 'Technicien' },
                { value: 'manager', label: 'Manager' },
                { value: 'superadmin', label: 'Super Admin' }
              ]}
            />

            {/* Statut du compte */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  Statut du compte
                </p>
                <p className={`text-sm mt-1 ${
                  formData.active 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formData.active ? '✓ Compte actif' : '✗ Compte désactivé'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50 ${
                  formData.active 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {formData.active ? <UserX size={16} /> : <UserPlus size={16} />}
                {formData.active ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </FormSection>

          {/* Section Informations du compte */}
          <FormSection title="Informations du compte">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">
                    ID utilisateur
                  </span>
                  <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs font-mono">
                    {user.id}
                  </code>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">
                    Créé le
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {user.createdAt?.toLocaleDateString?.('fr-FR') || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">
                    Dernière connexion
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {user.lastLogin?.toLocaleDateString?.('fr-FR') || 'Jamais'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">
                    Dernière modification
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {user.updatedAt?.toLocaleDateString?.('fr-FR') || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Section Actions de sécurité */}
          <FormSection
            title="Actions de sécurité"
            description="Gérer le mot de passe et les accès"
          >
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmitting}
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Réinitialiser le mot de passe
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUpdatePassword(user);
                }}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Key size={18} />
                Modifier le mot de passe
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Désactiver définitivement ${user.name} ?\n\nL'utilisateur ne pourra plus se connecter.`)) {
                    await onDeleteUser(user.id);
                  }
                }}
                disabled={isSubmitting}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Désactiver définitivement
              </button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Les actions de sécurité sont irréversibles. Assurez-vous de bien comprendre 
                  les conséquences avant de continuer.
                </p>
              </div>
            </div>
          </FormSection>
        </>
      )}
    </FormModal>
  );
};

export default UserManagementModal;