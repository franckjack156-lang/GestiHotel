// src/components/Users/UnifiedUserModal.jsx
// VERSION UNIFIÉE - Création, Édition, Mot de passe
// Réduction de 1200+ lignes à ~300 lignes

import React from 'react';
import { Users, User, Key, UserPlus, Edit3 } from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  TextInput,
  PasswordInput,
  SelectInput,
  CheckboxInput,
  FormSection,
  FormHelp
} from '../common/FormFields';

/**
 * Modal Utilisateur Unifiée
 * Gère 3 modes : 'create', 'edit', 'password'
 */
const UnifiedUserModal = ({ 
  isOpen, 
  onClose,
  mode = 'create', // 'create', 'edit', 'password'
  user = null,
  onSubmit,
  currentUser // Pour vérifier les permissions
}) => {
  // ========== CONFIGURATION SELON LE MODE ==========
  const config = {
    create: {
      title: 'Nouvel Utilisateur',
      subtitle: 'Créer un compte utilisateur',
      icon: UserPlus,
      submitLabel: 'Créer l\'utilisateur',
      initialData: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'reception',
        department: '',
        phone: '',
        active: true
      }
    },
    edit: {
      title: 'Modifier l\'utilisateur',
      subtitle: user ? `${user.name}` : '',
      icon: Edit3,
      submitLabel: 'Enregistrer',
      initialData: {
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'reception',
        department: user?.department || '',
        phone: user?.phone || '',
        active: user?.active !== false
      }
    },
    password: {
      title: 'Modifier le mot de passe',
      subtitle: user ? `${user.name}` : '',
      icon: Key,
      submitLabel: 'Changer le mot de passe',
      initialData: {
        newPassword: '',
        confirmPassword: ''
      }
    }
  };

  const currentConfig = config[mode];

  // ========== VALIDATION SELON LE MODE ==========
  const validate = (formData) => {
    const errors = {};

    if (mode === 'create' || mode === 'edit') {
      // Validation nom
      if (!formData.name?.trim()) {
        errors.name = 'Le nom est obligatoire';
      }

      // Validation email
      if (!formData.email?.trim()) {
        errors.email = 'L\'email est obligatoire';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Email invalide';
      }

      // Validation password (création uniquement)
      if (mode === 'create') {
        if (!formData.password) {
          errors.password = 'Le mot de passe est obligatoire';
        } else if (formData.password.length < 6) {
          errors.password = 'Minimum 6 caractères';
        }

        if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }
      }
    }

    if (mode === 'password') {
      // Validation nouveau password
      if (!formData.newPassword) {
        errors.newPassword = 'Le nouveau mot de passe est obligatoire';
      } else if (formData.newPassword.length < 6) {
        errors.newPassword = 'Minimum 6 caractères';
      }

      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    return errors;
  };

  // ========== SOUMISSION SELON LE MODE ==========
  const handleSubmit = async (formData) => {
    if (mode === 'create') {
      const { confirmPassword, ...userData } = formData;
      return await onSubmit(userData);
    } 
    
    if (mode === 'edit') {
      const { confirmPassword, ...userData } = formData;
      return await onSubmit(user.id, userData);
    }
    
    if (mode === 'password') {
      return await onSubmit(user.id, formData.newPassword);
    }
  };

  // ========== GÉNÉRATEUR DE MOT DE PASSE ==========
  const generatePassword = (setFormData) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    if (mode === 'create') {
      setFormData((prev) => ({
        ...prev,
        password,
        confirmPassword: password
      }));
    } else if (mode === 'password') {
      setFormData((prev) => ({
        ...prev,
        newPassword: password,
        confirmPassword: password
      }));
    }
  };

  // ========== VÉRIFICATION DES PERMISSIONS ==========
  const canEditRole = currentUser?.role === 'superadmin' || 
    (currentUser?.role === 'manager' && user?.role !== 'superadmin');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={currentConfig.title}
      subtitle={currentConfig.subtitle}
      icon={currentConfig.icon}
      size="lg"
      initialData={currentConfig.initialData}
      onSubmit={handleSubmit}
      validate={validate}
      submitLabel={currentConfig.submitLabel}
    >
      {({ formData, setFormData, errors, isSubmitting }) => (
        <>
          {/* ========== MODE CREATE / EDIT ========== */}
          {(mode === 'create' || mode === 'edit') && (
            <>
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
                    placeholder="John Doe"
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
                    placeholder="john.doe@hotel.com"
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
                    placeholder="+33 1 23 45 67 89"
                    disabled={isSubmitting}
                  />

                  <SelectInput
                    id="department"
                    label="Département"
                    value={formData.department}
                    onChange={(value) => setFormData({ ...formData, department: value })}
                    placeholder="Sélectionner..."
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

              {/* Section Accès */}
              <FormSection
                title="Accès et permissions"
                description="Rôle et statut du compte"
              >
                <SelectInput
                  id="role"
                  label="Rôle"
                  required
                  value={formData.role}
                  onChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={isSubmitting || !canEditRole}
                  options={[
                    { value: 'reception', label: 'Réception' },
                    { value: 'technician', label: 'Technicien' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'superadmin', label: 'Super Admin', disabled: currentUser?.role !== 'superadmin' }
                  ]}
                  hint={!canEditRole ? 'Vous n\'avez pas la permission de modifier le rôle' : undefined}
                />

                {mode === 'edit' && (
                  <CheckboxInput
                    id="active"
                    label="Compte actif"
                    checked={formData.active}
                    onChange={(value) => setFormData({ ...formData, active: value })}
                    disabled={isSubmitting}
                    description="Décochez pour désactiver le compte (l'utilisateur ne pourra plus se connecter)"
                  />
                )}
              </FormSection>

              {/* Section Sécurité (création uniquement) */}
              {mode === 'create' && (
                <FormSection
                  title="Sécurité"
                  description="Définir le mot de passe initial"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PasswordInput
                      id="password"
                      label="Mot de passe"
                      required
                      value={formData.password}
                      onChange={(value) => setFormData({ ...formData, password: value })}
                      error={errors.password}
                      placeholder="Minimum 6 caractères"
                      disabled={isSubmitting}
                      showGenerator
                      onGenerate={() => generatePassword(setFormData)}
                    />

                    <PasswordInput
                      id="confirmPassword"
                      label="Confirmer"
                      required
                      value={formData.confirmPassword}
                      onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
                      error={errors.confirmPassword}
                      placeholder="Confirmez le mot de passe"
                      disabled={isSubmitting}
                    />
                  </div>

                  <FormHelp>
                    L'utilisateur devra utiliser ce mot de passe pour sa première connexion
                  </FormHelp>
                </FormSection>
              )}

              {/* Infos compte (édition uniquement) */}
              {mode === 'edit' && user && (
                <FormSection title="Informations du compte">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                    </div>
                  </div>
                </FormSection>
              )}
            </>
          )}

          {/* ========== MODE PASSWORD ========== */}
          {mode === 'password' && user && (
            <>
              {/* Info utilisateur */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <User className="text-indigo-600 dark:text-indigo-300" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              </div>

              <FormSection
                title="Nouveau mot de passe"
                description="Choisir un nouveau mot de passe sécurisé"
              >
                <div className="space-y-4">
                  <PasswordInput
                    id="newPassword"
                    label="Nouveau mot de passe"
                    required
                    value={formData.newPassword}
                    onChange={(value) => setFormData({ ...formData, newPassword: value })}
                    error={errors.newPassword}
                    placeholder="Minimum 6 caractères"
                    disabled={isSubmitting}
                    showGenerator
                    onGenerate={() => generatePassword(setFormData)}
                    hint="Utilisez le bouton 'Générer' pour créer un mot de passe sécurisé"
                  />

                  <PasswordInput
                    id="confirmPassword"
                    label="Confirmer le mot de passe"
                    required
                    value={formData.confirmPassword}
                    onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
                    error={errors.confirmPassword}
                    placeholder="Confirmez le mot de passe"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ⚠️ <strong>Important :</strong> L'utilisateur devra utiliser ce nouveau mot de passe 
                    dès sa prochaine connexion.
                  </p>
                </div>
              </FormSection>
            </>
          )}
        </>
      )}
    </FormModal>
  );
};

export default UnifiedUserModal;