// src/components/Settings/SettingsModal.jsx - VERSION AMÉLIORÉE

import React, { useState, useEffect } from 'react';
import { 
  X, Moon, Sun, Palette, Volume2, VolumeX, Bell, 
  Eye, EyeOff, Download, Upload, RefreshCw, Save,
  Smartphone, Monitor, Laptop, Check, AlertCircle, Info
} from 'lucide-react';
import SettingsPreview from './SettingsPreview';

const SettingsModal = ({ isOpen, onClose, settings, onUpdateSettings, onResetSettings }) => {
  const [activeSection, setActiveSection] = useState('appearance');
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // ✅ Synchroniser avec les props
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  // ✅ Détecter les changements
  useEffect(() => {
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasChanges(changed);
  }, [localSettings, settings]);

  // ✅ Sauvegarder
  const handleSave = () => {
    onUpdateSettings(localSettings);
    setHasChanges(false);
    onClose();
  };

  // ✅ Réinitialiser
  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      const defaultSettings = onResetSettings();
      setLocalSettings(defaultSettings);
      setHasChanges(false);
    }
  };

  // ✅ Annuler
  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?')) {
        setLocalSettings(settings);
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  // ✅ Mettre à jour un paramètre
  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ✅ Mettre à jour les notifications
  const updateNotification = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  // ✅ Import
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setLocalSettings(importedSettings);
          setHasChanges(true);
        } catch (error) {
          alert('Erreur lors de l\'import des paramètres');
        }
      };
      reader.readAsText(file);
    }
  };

  // ✅ Export
  const handleExport = () => {
    const dataStr = JSON.stringify(localSettings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `gestihotel-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isOpen) return null;

  const sections = [
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'accessibility', label: 'Accessibilité', icon: Eye },
    { id: 'backup', label: 'Sauvegarde', icon: Download }
  ];

  const colorOptions = [
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
    { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
    { value: 'emerald', label: 'Émeraude', class: 'bg-emerald-500' },
    { value: 'violet', label: 'Violet', class: 'bg-violet-500' },
    { value: 'rose', label: 'Rose', class: 'bg-rose-500' },
    { value: 'amber', label: 'Ambre', class: 'bg-amber-500' }
  ];

  const densityOptions = [
    { value: 'compact', label: 'Compact', description: 'Plus dense, plus d\'informations' },
    { value: 'comfortable', label: 'Confortable', description: 'Équilibre parfait' },
    { value: 'spacious', label: 'Spacieux', description: 'Plus d\'espace, plus aéré' }
  ];

  const contrastOptions = [
    { value: 'normal', label: 'Normal', description: 'Contraste standard' },
    { value: 'high', label: 'Élevé', description: 'Meilleure lisibilité' },
    { value: 'dark', label: 'Mode sombre renforcé', description: 'Pour les sensibilités lumineuses' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ✅ HEADER */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Paramètres et Personnalisation
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Personnalisez votre expérience GestiHôtel
              </p>
            </div>
            <button 
              onClick={handleCancel}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* ✅ INDICATEUR DE CHANGEMENTS */}
          {hasChanges && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
              <span className="text-sm text-amber-800 dark:text-amber-200">
                Vous avez des modifications non sauvegardées
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* ✅ NAVIGATION */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 mb-1 ${
                    activeSection === section.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <section.icon size={20} />
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ CONTENU PRINCIPAL */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Colonne principale (2/3) */}
              <div className="lg:col-span-2">
            {/* ========== APPARENCE ========== */}
            {activeSection === 'appearance' && (
              <div className="space-y-8">
                {/* Thème */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Thème
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Clair', icon: Sun, description: 'Thème clair' },
                      { value: 'dark', label: 'Sombre', icon: Moon, description: 'Thème sombre' },
                      { value: 'auto', label: 'Auto', icon: Monitor, description: 'Système' }
                    ].map(theme => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => updateSetting('theme', theme.value)}
                          className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                            localSettings.theme === theme.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {localSettings.theme === theme.value && (
                            <Check size={16} className="absolute top-2 right-2 text-indigo-600" />
                          )}
                          <Icon size={24} className="mb-2" />
                          <div className="font-medium">{theme.label}</div>
                          <div className="text-sm opacity-70">{theme.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Couleur principale */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Couleur principale
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        onClick={() => updateSetting('primaryColor', color.value)}
                        className={`relative p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center ${
                          localSettings.primaryColor === color.value
                            ? 'border-gray-400 dark:border-gray-300 ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        {localSettings.primaryColor === color.value && (
                          <Check size={14} className="absolute top-1 right-1 text-gray-600" />
                        )}
                        <div className={`w-8 h-8 rounded-full mb-2 ${color.class}`}></div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{color.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Densité d'interface */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Densité d'interface
                  </h3>
                  <div className="space-y-2">
                    {densityOptions.map(density => (
                      <label 
                        key={density.value}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          localSettings.density === density.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="density"
                          value={density.value}
                          checked={localSettings.density === density.value}
                          onChange={(e) => updateSetting('density', e.target.value)}
                          className="mt-1 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 dark:text-white">{density.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{density.description}</div>
                        </div>
                        {localSettings.density === density.value && (
                          <Check size={20} className="text-indigo-600 dark:text-indigo-400" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========== NOTIFICATIONS ========== */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Notifications email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recevoir des emails pour les nouvelles interventions
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.notifications?.email || false}
                      onChange={(e) => updateNotification('email', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Notifications push</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notifications dans l'application
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.notifications?.push || false}
                      onChange={(e) => updateNotification('push', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Sons de notification</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Jouer un son pour les nouvelles notifications
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.notifications?.sound || false}
                      onChange={(e) => updateNotification('sound', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* ========== ACCESSIBILITÉ ========== */}
            {activeSection === 'accessibility' && (
              <div className="space-y-6">
                {/* Contraste */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Contraste
                  </h3>
                  <div className="space-y-2">
                    {contrastOptions.map(contrast => (
                      <label 
                        key={contrast.value}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          localSettings.contrast === contrast.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="contrast"
                          value={contrast.value}
                          checked={localSettings.contrast === contrast.value}
                          onChange={(e) => updateSetting('contrast', e.target.value)}
                          className="mt-1 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 dark:text-white">{contrast.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{contrast.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Animations */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Animations</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Activer les transitions et animations
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.animations}
                      onChange={(e) => updateSetting('animations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Sidebar réduite */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Sidebar réduite</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Réduire la sidebar par défaut
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.sidebarCollapsed}
                      onChange={(e) => updateSetting('sidebarCollapsed', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* ========== SAUVEGARDE ========== */}
            {activeSection === 'backup' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Sauvegarde des paramètres
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Exportez vos paramètres pour les réutiliser plus tard ou sur un autre appareil.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleExport}
                    className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Download size={24} className="text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-800 dark:text-green-200">Exporter les paramètres</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Télécharger un fichier JSON avec tous vos paramètres
                    </p>
                  </button>

                  <label className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 text-left cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <Upload size={24} className="text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">Importer les paramètres</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Charger un fichier JSON pour restaurer vos paramètres
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                    Réinitialisation
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                    Remettre tous les paramètres à leurs valeurs par défaut.
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Réinitialiser les paramètres
                  </button>
                </div>
              </div>
            )}
          </div>

              {/* ✅ COLONNE DE PRÉVISUALISATION (1/3) */}
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <SettingsPreview settings={localSettings} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ FOOTER - BOUTONS D'ACTION */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {hasChanges && (
                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle size={16} />
                  Modifications non sauvegardées
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;