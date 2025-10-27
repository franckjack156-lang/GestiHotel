import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, AlertCircle, User, Mail } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const UpdatePasswordModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onUpdatePassword 
}) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword || !formData.confirmPassword) {
      addToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      addToast('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      addToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    setIsLoading(true);
    
    const result = await onUpdatePassword(user.id, formData.newPassword);
    if (result.success) {
      addToast('Mot de passe modifié avec succès', 'success');
      onClose();
      setFormData({
        newPassword: '',
        confirmPassword: ''
      });
    }
    
    setIsLoading(false);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({
      newPassword: password,
      confirmPassword: password
    });
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Modifier le mot de passe
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X size={24} />
            </button>
          </div>

          {/* Informations utilisateur */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <User className="text-indigo-600 dark:text-indigo-300" size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Mail size={14} />
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  className="w-full pl-10 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Au moins 6 caractères"
                  required
                  minLength="6"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
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
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Confirmez le mot de passe"
                  required
                  minLength="6"
                />
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-900 dark:text-yellow-100">Important</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                L'utilisateur devra utiliser ce nouveau mot de passe pour sa prochaine connexion.
                Assurez-vous de lui communiquer ce mot de passe de manière sécurisée.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
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
                    <Key size={18} />
                    Modifier
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

export default UpdatePasswordModal;