import React, { useState } from 'react';
import { ClipboardList, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AuthScreen = ({ onLoginSuccess }) => {
  const { login, signup, loading, error: authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!formData.email || !formData.password) {
      setLocalError('Email et mot de passe requis');
      return;
    }

    if (!isLogin && !formData.name) {
      setLocalError('Le nom est requis pour l\'inscription');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Tentative de connexion/inscription
    if (isLogin) {
      const result = await login(formData.email, formData.password);
      if (result.success && onLoginSuccess) {
        onLoginSuccess();
      }
    } else {
      const result = await signup(formData.email, formData.password, {
        name: formData.name,
        role: 'reception'
      });
      if (result.success && onLoginSuccess) {
        onLoginSuccess();
      }
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">GestiHôtel</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Gestion d'interventions intelligente</p>
        </div>

        {/* Toggle Login/Signup */}
        <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setLocalError('');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              isLogin
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setLocalError('');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              !isLogin
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Message d'erreur */}
        {displayError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom (inscription uniquement) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Votre nom complet"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              required
              disabled={loading}
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 caractères"
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum 6 caractères
            </p>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Chargement...</span>
              </div>
            ) : isLogin ? (
              'Se connecter'
            ) : (
              "S'inscrire"
            )}
          </button>
        </form>

        {/* Comptes de test */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-3 font-medium">Comptes de test :</p>
          <div className="space-y-1 text-xs bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p>
              <strong>Super Admin:</strong> superadmin@hotel.com
            </p>
            <p>
              <strong>Manager:</strong> manager@hotel.com
            </p>
            <p>
              <strong>Réception:</strong> reception@hotel.com
            </p>
            <p>
              <strong>Technicien:</strong> tech@hotel.com
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Mot de passe: password123
            </p>
          </div>
        </div>

        {/* Info inscription */}
        {!isLogin && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 text-center flex items-start gap-2">
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                Votre compte sera créé avec le rôle <strong>Réception</strong>. Seul un Super
                Admin peut modifier votre rôle.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;