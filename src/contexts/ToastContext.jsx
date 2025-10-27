import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Ajouter un toast
   * @param {string|object} toastOrMessage - Message simple ou objet toast complet
   * @param {string} type - Type de toast (success, error, warning, info)
   * @param {number} duration - Durée en ms (0 = permanent)
   */
  const addToast = useCallback((toastOrMessage, type = 'info', duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let toast;
    
    // Si c'est un string simple
    if (typeof toastOrMessage === 'string') {
      toast = {
        id,
        type,
        message: toastOrMessage,
        title: getDefaultTitle(type),
        duration
      };
    } 
    // Si c'est un objet complet
    else if (typeof toastOrMessage === 'object') {
      toast = {
        id,
        type: toastOrMessage.type || type,
        title: toastOrMessage.title || getDefaultTitle(toastOrMessage.type || type),
        message: toastOrMessage.message,
        duration: toastOrMessage.duration !== undefined ? toastOrMessage.duration : duration
      };
    } 
    // Fallback
    else {
      toast = {
        id,
        type: 'info',
        title: 'Information',
        message: String(toastOrMessage),
        duration: 5000
      };
    }
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove après la durée spécifiée
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Raccourcis pour les types de toasts
   */
  const success = useCallback((message, title, duration) => {
    addToast({ message, title, type: 'success', duration });
  }, [addToast]);

  const error = useCallback((message, title, duration) => {
    addToast({ message, title, type: 'error', duration });
  }, [addToast]);

  const warning = useCallback((message, title, duration) => {
    addToast({ message, title, type: 'warning', duration });
  }, [addToast]);

  const info = useCallback((message, title, duration) => {
    addToast({ message, title, type: 'info', duration });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    // Raccourcis
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Obtenir le titre par défaut selon le type
 */
function getDefaultTitle(type) {
  const titles = {
    success: 'Succès',
    error: 'Erreur',
    warning: 'Attention',
    info: 'Information'
  };
  return titles[type] || 'Information';
}

/**
 * Hook personnalisé pour utiliser le contexte Toast
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export { ToastContext };