// src/components/Users/UserManagementModal.jsx - VERSION COMPLETE AVEC LIEN TECHNICIEN
import React from 'react';
import { 
  User, RefreshCw, UserX, UserPlus, Key, Trash2, Calendar,
  AlertCircle, Save, Wrench, Link2
} from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  TextInput,
  SelectInput,
  FormSection,
  FormHelp
} from '../common/FormFields';

/**
 * Modal de gestion utilisateur - AVEC LIEN VERS TECHNICIEN
 * Solution optimale utilisant l'existant
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
  adminData = {} // ← IMPORTANT : Recevoir adminData en props
}) => {
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

  // Liste des techniciens disponibles
  const availableTechnicians = (adminData.technicians || [])
    .filter(tech => tech.active !== false);

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
                placeholder="Jean Dupont"
              />

              <TextInput
                id="email"
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                error={errors.email}
                disabled={isSubmitting}
                placeholder="jean.dupont@hotel.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                id="phone"
                label="Téléphone"
                type="tel"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                disabled={isSubmitting}
                placeholder="+33 1 23 45 67 89"
              />

              <SelectInput
                id="department"
                label="Département"
                value={formData.department}
                onChange={(value) => setFormData({ ...formData, department: value })}
                disabled={isSubmitting}
                options={[
                  { value: '', label: 'Aucun' },
                  { value: 'reception', label: 'Réception' },
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'menage', label: 'Ménage' },
                  { value: 'restaurant', label: 'Restaurant' },
                  { value: 'direction', label: 'Direction' }
                ]}
              />
            </div>
          </FormSection>

          {/* ✨ NOUVELLE SECTION : Profil Technicien */}
          <FormSection
            title="Profil Technicien"
            description="Associer cet utilisateur à un profil technicien de l'équipe"
          >
            <SelectInput
              id="linkedTechnicianId"
              label="Technicien associé"
              value={formData.linkedTechnicianId}
              onChange={(value) => setFormData({ ...formData, linkedTechnicianId: value })}
              disabled={isSubmitting}
              options={[
                { value: '', label: 'Aucun - Cet utilisateur n\'est pas un technicien' },
                ...availableTechnicians.map(tech => ({
                  value: tech.id,
                  label: `${tech.name}${tech.specialty ? ` - ${tech.specialty}` : ''}`
                }))
              ]}
            />
            
            <FormHelp>
              Si cet utilisateur est un technicien, associez-le à son profil dans la base 
              des techniciens. Cela permettra de :
            </FormHelp>
            
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
              <li>• Lui assigner automatiquement les interventions</li>
              <li>• Filtrer ses interventions à la connexion</li>
              <li>• Synchroniser ses informations</li>
            </ul>
            
            {formData.linkedTechnicianId && (
              <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <Link2 className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                      Lien actif
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Cet utilisateur est lié au technicien{' '}
                      <strong>
                        {availableTechnicians.find(t => t.id === formData.linkedTechnicianId)?.name}
                      </strong>
                      {' '}et verra automatiquement ses interventions assignées lors de sa connexion.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {availableTechnicians.length === 0 && (
              <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Aucun technicien disponible
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Créez d'abord des profils techniciens dans "Données Admin" &gt; "Techniciens" 
                      avant de pouvoir les lier aux utilisateurs.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </FormSection>

          {/* Section Rôle et permissions */}
          <FormSection title="Rôle et permissions">
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
            <FormHelp>
              Le rôle détermine les permissions d'accès dans l'application
            </FormHelp>
          </FormSection>

          {/* Section Actions rapides */}
          <FormSection title="Actions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmitting}
                className="px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} />
                Réinitialiser le mot de passe
              </button>
              
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isSubmitting}
                className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                  formData.active 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {formData.active ? <UserX size={16} /> : <UserPlus size={16} />}
                {formData.active ? 'Désactiver le compte' : 'Activer le compte'}
              </button>
            </div>
          </FormSection>

          {/* Section Statut actuel */}
          <FormSection title="Statut">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Statut du compte
                </p>
                <p className={`font-semibold ${
                  formData.active 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formData.active ? '✓ Compte actif' : '✗ Compte désactivé'}
                </p>
              </div>
              
              {formData.linkedTechnicianId && (
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Wrench size={20} />
                  <span className="font-medium">Lié à un technicien</span>
                </div>
              )}
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
        </>
      )}
    </FormModal>
  );
};

export default UserManagementModal;