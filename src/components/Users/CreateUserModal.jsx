import React, { useState } from 'react';
import { X, Shield, Users, Database, Download, Upload, Trash2, Archive, User, Mail, Phone, Key, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const CreateUserModal = ({ isOpen, onClose, onAddUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'reception',
    department: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      addToast({
        type: 'error',
        title: 'Champs manquants',
        message: 'Tous les champs obligatoires doivent être remplis'
      });
      return;
    }

    if (formData.password.length < 6) {
      addToast({
        type: 'error',
        title: 'Mot de passe trop court',
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Mots de passe différents',
        message: 'Les mots de passe ne correspondent pas'
      });
      return;
    }

    if (!isValidEmail(formData.email)) {
      addToast({
        type: 'error',
        title: 'Email invalide',
        message: 'L\'adresse email n\'est pas valide'
      });
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        phone: formData.phone
      };

      // Appeler la fonction onAddUser
      const result = await onAddUser(userData);
      
      // Vérifier si le résultat existe et contient success
      if (result && result.success) {
        // Réinitialiser le formulaire
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'reception',
          department: '',
          phone: ''
        });
        
        addToast({
          type: 'success',
          title: 'Utilisateur créé',
          message: `${userData.email} créé avec succès`
        });
        
        // Fermer le modal après un court délai
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        // Gérer l'échec (le message d'erreur est déjà affiché par useUserManagement)
        console.log('Échec de la création utilisateur:', result);
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur inattendue s\'est produite'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      password: password,
      confirmPassword: password
    }));
    
    addToast({
      type: 'info',
      title: 'Mot de passe généré',
      message: 'Un mot de passe sécurisé a été généré'
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'reception',
        department: '',
        phone: ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Nouvel Utilisateur</h2>
            <button 
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom complet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom complet *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="John Doe"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="john.doe@hotel.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rôle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="reception">Réception</option>
                  <option value="technician">Technicien</option>
                  <option value="manager">Manager</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {/* Département */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Département
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="">Sélectionner un département</option>
                  <option value="reception">Réception</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="menage">Ménage</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="direction">Direction</option>
                </select>
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="+33 1 23 45 67 89"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-24 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Au moins 6 caractères"
                    required
                    minLength="6"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
                      disabled={isLoading}
                    >
                      Générer
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Confirmez le mot de passe"
                    required
                    minLength="6"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={18} className="text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">Informations importantes</span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• Le mot de passe doit contenir au moins <strong>6 caractères</strong></p>
                <p>• L'utilisateur recevra ses identifiants de connexion</p>
                <p>• Seuls les Super Admins peuvent modifier les rôles des utilisateurs</p>
                <p>• Utilisez le bouton "Générer" pour créer un mot de passe sécurisé</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <Users size={18} />
                    Créer l'utilisateur
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;