// src/components/Users/CreateUserModal.jsx - VERSION OPTIMISÉE
import React from 'react';
import { Users, User, Mail, Phone, Key } from 'lucide-react';
import FormModal from '../common/FormModal';
import {
  TextInput,
  PasswordInput,
  SelectInput,
  FormSection
} from '../common/FormFields';

/**
 * Modal de création d'utilisateur - VERSION SIMPLIFIÉE
 * Réduction de 400 lignes à ~100 lignes grâce aux composants réutilisables
 */
const CreateUserModal = ({ isOpen, onClose, onAddUser }) => {
  const initialData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'reception',
    department: '',
    phone: ''
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

    if (!formData.password) {
      errors.password = 'Le mot de passe est obligatoire';
    } else if (formData.password.length < 6) {
      errors.password = 'Minimum 6 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    return errors;
  };

  const handleSubmit = async (formData) => {
    const { confirmPassword, ...userData } = formData;
    return await onAddUser(userData);
  };

  const generatePassword = (setFormData) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({
      ...prev,
      password,
      confirmPassword: password
    }));
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvel Utilisateur"
      subtitle="Créer un compte utilisateur pour accéder à l'application"
      icon={Users}
      size="lg"
      initialData={initialData}
      onSubmit={handleSubmit}
      validate={validate}
      submitLabel="Créer l'utilisateur"
    >
      {({ formData, setFormData, errors, isSubmitting }) => (
        <>
          {/* Section Informations personnelles */}
          <FormSection
            title="Informations personnelles"
            description="Coordonnées de l'utilisateur"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                id="name"
                name="name"
                label="Nom complet"
                required
                icon={User}
                value={formData.name}
                onChange={(value) =>
                  setFormData({ ...formData, name: value })
                }
                error={errors.name}
                placeholder="John Doe"
                disabled={isSubmitting}
              />

              <TextInput
                id="email"
                name="email"
                type="email"
                label="Email"
                required
                icon={Mail}
                value={formData.email}
                onChange={(value) =>
                  setFormData({ ...formData, email: value })
                }
                error={errors.email}
                placeholder="john.doe@hotel.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                id="phone"
                name="phone"
                type="tel"
                label="Téléphone"
                icon={Phone}
                value={formData.phone}
                onChange={(value) =>
                  setFormData({ ...formData, phone: value })
                }
                error={errors.phone}
                placeholder="+33 1 23 45 67 89"
                disabled={isSubmitting}
              />

              <SelectInput
                id="department"
                name="department"
                label="Département"
                value={formData.department}
                onChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
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

          {/* Section Accès et permissions */}
          <FormSection
            title="Accès et permissions"
            description="Définir le rôle et les accès de l'utilisateur"
          >
            <SelectInput
              id="role"
              name="role"
              label="Rôle"
              required
              value={formData.role}
              onChange={(value) =>
                setFormData({ ...formData, role: value })
              }
              disabled={isSubmitting}
              options={[
                { value: 'reception', label: 'Réception' },
                { value: 'technician', label: 'Technicien' },
                { value: 'manager', label: 'Manager' },
                { value: 'superadmin', label: 'Super Admin' }
              ]}
            />
          </FormSection>

          {/* Section Sécurité */}
          <FormSection
            title="Sécurité"
            description="Définir le mot de passe initial"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordInput
                id="password"
                name="password"
                label="Mot de passe"
                required
                value={formData.password}
                onChange={(value) =>
                  setFormData({ ...formData, password: value })
                }
                error={errors.password}
                placeholder="Minimum 6 caractères"
                disabled={isSubmitting}
                showGenerator
                onGenerate={() => generatePassword(setFormData)}
                hint="Utilisez le bouton 'Générer' pour créer un mot de passe sécurisé"
              />

              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmer le mot de passe"
                required
                value={formData.confirmPassword}
                onChange={(value) =>
                  setFormData({ ...formData, confirmPassword: value })
                }
                error={errors.confirmPassword}
                placeholder="Confirmez le mot de passe"
                disabled={isSubmitting}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Astuce :</strong> L'utilisateur devra utiliser ce mot de passe 
                pour sa première connexion. Assurez-vous de le lui communiquer de manière sécurisée.
              </p>
            </div>
          </FormSection>
        </>
      )}
    </FormModal>
  );
};

export default CreateUserModal;