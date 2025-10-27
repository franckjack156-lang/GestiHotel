// src/components/Settings/SettingsPreview.jsx
// Prévisualisation en temps réel des paramètres

import React, { useEffect } from 'react';
import { Check, X, AlertCircle, Info, Zap, Star } from 'lucide-react';

const SettingsPreview = ({ settings }) => {
  // ✅ Appliquer les changements en temps réel pour la prévisualisation
  useEffect(() => {
    // Ne pas modifier le DOM global, juste pour la démo visuelle
  }, [settings]);

  return (
    <div className="space-y-4">
      {/* Badge "Prévisualisation en direct" */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="animate-pulse" />
          <span className="font-semibold text-sm">Prévisualisation en direct</span>
        </div>
        <p className="text-xs opacity-90">Les changements s'appliquent immédiatement</p>
      </div>

      {/* Carte d'aperçu des paramètres */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
          <Star size={16} />
          Paramètres actuels
        </h3>
        
        <div className="space-y-3 text-sm">
          {/* Thème */}
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-gray-600 dark:text-gray-400">Thème:</span>
            <span className="font-medium text-gray-800 dark:text-white capitalize flex items-center gap-1">
              {settings.theme === 'light' ? '☀️ Clair' : 
               settings.theme === 'dark' ? '🌙 Sombre' : 
               '🖥️ Auto'}
            </span>
          </div>

          {/* Couleur avec aperçu visuel */}
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-gray-600 dark:text-gray-400">Couleur:</span>
            <span className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full shadow-inner ${
                settings.primaryColor === 'indigo' ? 'bg-indigo-500' :
                settings.primaryColor === 'blue' ? 'bg-blue-500' :
                settings.primaryColor === 'emerald' ? 'bg-emerald-500' :
                settings.primaryColor === 'violet' ? 'bg-violet-500' :
                settings.primaryColor === 'rose' ? 'bg-rose-500' :
                'bg-amber-500'
              }`}></div>
              <span className="font-medium text-gray-800 dark:text-white capitalize">
                {settings.primaryColor}
              </span>
            </span>
          </div>

          {/* Densité */}
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-gray-600 dark:text-gray-400">Densité:</span>
            <span className="font-medium text-gray-800 dark:text-white capitalize">
              {settings.density === 'compact' ? '📦 Compact' :
               settings.density === 'spacious' ? '📏 Spacieux' :
               '👌 Confortable'}
            </span>
          </div>

          {/* Contraste */}
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-gray-600 dark:text-gray-400">Contraste:</span>
            <span className="font-medium text-gray-800 dark:text-white capitalize">
              {settings.contrast === 'high' ? '🔆 Élevé' :
               settings.contrast === 'dark' ? '🌑 Renforcé' :
               '✨ Normal'}
            </span>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-gray-600 dark:text-gray-400">Animations:</span>
            <span className="flex items-center gap-1">
              {settings.animations ? (
                <>
                  <Check size={16} className="text-green-500" />
                  <span className="font-medium text-green-700 dark:text-green-400">Actives</span>
                </>
              ) : (
                <>
                  <X size={16} className="text-red-500" />
                  <span className="font-medium text-red-700 dark:text-red-400">Désactivées</span>
                </>
              )}
            </span>
          </div>

          {/* Sidebar */}
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-gray-600 dark:text-gray-400">Sidebar:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {settings.sidebarCollapsed ? '📌 Réduite' : '📋 Étendue'}
            </span>
          </div>
        </div>
      </div>

      {/* Exemples visuels en direct */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-3 text-sm">
          Aperçu visuel
        </h3>
        
        <div className="space-y-3">
          {/* Bouton exemple avec la couleur choisie */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Bouton primaire:</p>
            <button className={`w-full px-4 py-2 rounded-lg transition font-medium text-white ${
              settings.primaryColor === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' :
              settings.primaryColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
              settings.primaryColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
              settings.primaryColor === 'violet' ? 'bg-violet-600 hover:bg-violet-700' :
              settings.primaryColor === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
              'bg-amber-600 hover:bg-amber-700'
            }`}>
              Exemple de bouton
            </button>
          </div>

          {/* Carte info */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Carte d'information:</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start gap-2">
              <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                Exemple de notification avec le thème actuel
              </div>
            </div>
          </div>

          {/* Alerte */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Alerte:</p>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                Aperçu avec contraste {settings.contrast}
              </div>
            </div>
          </div>

          {/* Texte d'exemple pour la densité */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Texte:</p>
            <p className={`text-gray-700 dark:text-gray-300 ${
              settings.density === 'compact' ? 'text-sm' :
              settings.density === 'spacious' ? 'text-lg' :
              'text-base'
            }`}>
              Exemple de texte avec la densité {settings.density}
            </p>
          </div>
        </div>
      </div>

      {/* Astuce */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-purple-800 dark:text-purple-200">
            <strong>Astuce :</strong> Les changements sont appliqués instantanément. 
            Cliquez sur "Enregistrer" pour conserver vos préférences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPreview;