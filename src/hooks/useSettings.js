// src/hooks/useSettings.js - VERSION CORRIGÉE ET AMÉLIORÉE

import { useState, useEffect } from 'react';

export const useSettings = (user) => {
  const [settings, setSettings] = useState({
    theme: 'light',
    primaryColor: 'indigo',
    density: 'comfortable',
    contrast: 'normal',
    sidebarCollapsed: false,
    animations: true,
    language: 'fr',
    notifications: {
      email: true,
      push: true,
      sound: true
    }
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Charger les settings au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      if (user && user.uid) {
        const savedSettings = localStorage.getItem(`userSettings_${user.uid}`);
        
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            const mergedSettings = {
              ...settings,
              ...parsedSettings,
              notifications: {
                ...settings.notifications,
                ...(parsedSettings.notifications || {})
              }
            };
            
            setSettings(mergedSettings);
            applySettingsToDOM(mergedSettings);
          } catch (error) {
            console.error('❌ Erreur chargement settings:', error);
            applySettingsToDOM(settings);
          }
        } else {
          // Première fois : sauvegarder les settings par défaut
          localStorage.setItem(`userSettings_${user.uid}`, JSON.stringify(settings));
          applySettingsToDOM(settings);
        }
      } else {
        // Utilisateur non connecté : settings temporaires
        const tempSettings = localStorage.getItem('tempSettings');
        if (tempSettings) {
          try {
            const parsedSettings = JSON.parse(tempSettings);
            setSettings({ ...settings, ...parsedSettings });
            applySettingsToDOM({ ...settings, ...parsedSettings });
          } catch (error) {
            applySettingsToDOM(settings);
          }
        } else {
          applySettingsToDOM(settings);
        }
      }
      
      setIsInitialized(true);
    };

    loadSettings();
  }, [user?.uid]);

  // ✅ Mettre à jour les settings
  const updateSettings = (newSettings) => {
    const updated = { 
      ...settings, 
      ...newSettings,
      notifications: {
        ...settings.notifications,
        ...(newSettings.notifications || {})
      }
    };
    
    setSettings(updated);
    
    // Sauvegarder
    if (user && user.uid) {
      localStorage.setItem(`userSettings_${user.uid}`, JSON.stringify(updated));
    } else {
      localStorage.setItem('tempSettings', JSON.stringify(updated));
    }
    
    // Appliquer au DOM
    applySettingsToDOM(updated);
    
    return updated;
  };

  // ✅ Réinitialiser les settings
  const resetSettings = () => {
    const defaultSettings = {
      theme: 'light',
      primaryColor: 'indigo',
      density: 'comfortable',
      contrast: 'normal',
      sidebarCollapsed: false,
      animations: true,
      language: 'fr',
      notifications: {
        email: true,
        push: true,
        sound: true
      }
    };
    
    setSettings(defaultSettings);
    
    if (user && user.uid) {
      localStorage.setItem(`userSettings_${user.uid}`, JSON.stringify(defaultSettings));
    } else {
      localStorage.setItem('tempSettings', JSON.stringify(defaultSettings));
    }
    
    applySettingsToDOM(defaultSettings);
    return defaultSettings;
  };

  // ✅ Appliquer les settings au DOM
  const applySettingsToDOM = (settingsToApply) => {
    const root = document.documentElement;
    
    // ========== THÈME ==========
    if (settingsToApply.theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else if (settingsToApply.theme === 'auto') {
      // Mode auto basé sur les préférences système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    
    // ========== COULEUR PRINCIPALE ==========
    const colorClasses = ['indigo', 'blue', 'emerald', 'violet', 'rose', 'amber'];
    colorClasses.forEach(color => {
      root.classList.remove(`theme-${color}`);
    });
    const primaryColor = settingsToApply.primaryColor || 'indigo';
    root.classList.add(`theme-${primaryColor}`);
    
    // Appliquer la couleur via CSS variables
    const colorMap = {
      indigo: { light: '#4f46e5', dark: '#6366f1' },
      blue: { light: '#3b82f6', dark: '#60a5fa' },
      emerald: { light: '#10b981', dark: '#34d399' },
      violet: { light: '#8b5cf6', dark: '#a78bfa' },
      rose: { light: '#f43f5e', dark: '#fb7185' },
      amber: { light: '#f59e0b', dark: '#fbbf24' }
    };
    
    const colors = colorMap[primaryColor] || colorMap.indigo;
    root.style.setProperty('--color-primary', colors.light);
    root.style.setProperty('--color-primary-dark', colors.dark);
    
    // ========== DENSITÉ ==========
    root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    root.classList.add(`density-${settingsToApply.density || 'comfortable'}`);
    
    // Appliquer via CSS variables
    const densityMap = {
      compact: { spacing: '0.5rem', fontSize: '0.875rem' },
      comfortable: { spacing: '1rem', fontSize: '1rem' },
      spacious: { spacing: '1.5rem', fontSize: '1.125rem' }
    };
    
    const density = densityMap[settingsToApply.density] || densityMap.comfortable;
    root.style.setProperty('--spacing', density.spacing);
    root.style.setProperty('--font-size-base', density.fontSize);
    
    // ========== CONTRASTE ==========
    root.classList.remove('contrast-normal', 'contrast-high', 'contrast-dark');
    root.classList.add(`contrast-${settingsToApply.contrast || 'normal'}`);
    
    // Appliquer les ajustements de contraste
    if (settingsToApply.contrast === 'high') {
      root.style.setProperty('--contrast-multiplier', '1.5');
    } else if (settingsToApply.contrast === 'dark') {
      root.style.setProperty('--bg-color', '#000000');
      root.style.setProperty('--text-color', '#ffffff');
    } else {
      root.style.setProperty('--contrast-multiplier', '1');
      root.style.removeProperty('--bg-color');
      root.style.removeProperty('--text-color');
    }
    
    // ========== ANIMATIONS ==========
    if (!settingsToApply.animations) {
      document.body.classList.add('no-animations');
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      document.body.classList.remove('no-animations');
      root.style.setProperty('--animation-duration', '0.3s');
      root.style.setProperty('--transition-duration', '0.2s');
    }
  };

  return { 
    settings, 
    updateSettings, 
    resetSettings,
    isInitialized 
  };
};