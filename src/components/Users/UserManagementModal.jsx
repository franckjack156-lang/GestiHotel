import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Users, RefreshCw, UserX, UserPlus, 
  Key, Calendar, AlertCircle, Save, Trash2
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'reception',
    department: '',
    phone: '',
    active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'reception',
        department: user.department || '',
        phone: user.phone || '',
        active: user.active !== false
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      addToast('Le nom et l\'email sont obligatoires', 'error');
      return;
    }

    setIsLoading(true);
    const result = await onUpdateUser(user.id, formData);
    
    if (result.success) {
      addToast('Utilisateur mis à jour avec succès', 'success');
      onClose();
    }
    
    setIsLoading(false);
  };

  const handleToggleActive = async () => {
    if (formData.active) {
      // Désactiver
      if (confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur ${user.name} ?`)) {
        setIsLoading(true);
        const result = await onDeleteUser(user.id);
        if (result.success) {
          setFormData(prev => ({ ...prev, active: false }));
          addToast('Utilisateur désactivé avec succès', 'success');
        }
        setIsLoading(false);
      }
    } else {
      // Activer
      if (confirm(`Êtes-vous sûr de vouloir activer l'utilisateur ${user.name} ?`)) {
        setIsLoading(true);
        const result = await onActivateUser(user.id);
        if (result.success) {
          setFormData(prev => ({ ...prev, active: true }));
          addToast('Utilisateur activé avec succès', 'success');
        }
        setIsLoading(false);
      }
    }
  };

  const handleResetPassword = async () => {
    if (confirm(`Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.name} ?`)) {
      setIsLoading(true);
      const result = await onResetPassword(user.id);
      if (result.success) {
        addToast('Mot de passe réinitialisé avec succès', 'success');
        alert(`Nouveau mot de passe temporaire : ${result.tempPassword}\n\nL'utilisateur devra changer ce mot de passe à sa première connexion.`);
      }
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = () => {
    onClose();
    onUpdatePassword(user);
  };

  const handleDeleteUser = async () => {
    if (confirm(`Êtes-vous sûr de vouloir désactiver définitivement l'utilisateur ${user.name} ?\n\nL'utilisateur ne pourra plus se connecter mais ses données seront conservées.`)) {
      setIsLoading(true);
      const result = await onDeleteUser(user.id);
      if (result.success) {
        addToast('Utilisateur désactivé avec succès', 'success');
        onClose();
      }
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Gérer l'utilisateur
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    required
                  />
                </div>
              </div>

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
                    required
                  />
                </div>
              </div>
            </div>

            {/* Rôle et Département */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="reception">Réception</option>
                  <option value="technician">Technicien</option>
                  <option value="manager">Manager</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Département
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

            {/* Téléphone et Statut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Statut du compte</p>
                  <p className={`text-sm ${formData.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formData.active ? 'Compte actif' : 'Compte désactivé'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    formData.active 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  {formData.active ? <UserX size={16} /> : <UserPlus size={16} />}
                  {formData.active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>

            {/* Informations de compte */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Informations du compte
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <span className="block mb-1">ID utilisateur:</span>
                  <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs font-mono">
                    {user.id}
                  </code>
                </div>
                <div>
                  <span className="block mb-1">Crée le:</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {user.createdAt?.toLocaleDateString?.('fr-FR') || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block mb-1">Dernière connexion:</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {user.lastLogin?.toLocaleDateString?.('fr-FR') || 'Jamais'}
                  </span>
                </div>
                <div>
                  <span className="block mb-1">Dernière modification:</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {user.updatedAt?.toLocaleDateString?.('fr-FR') || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions de sécurité */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle size={18} />
                Actions de sécurité
              </h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Réinitialiser le mot de passe
                </button>
                
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Key size={18} />
                  Modifier le mot de passe
                </button>

                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={isLoading}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Désactiver définitivement
                </button>
              </div>
            </div>

            {/* Actions principales */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save size={18} />
                    Enregistrer les modifications
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

export default UserManagementModal;