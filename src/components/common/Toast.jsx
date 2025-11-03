// src/components/common/Toast.jsx - SYSTÈME DE NOTIFICATIONS AMÉLIORÉ
import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, XCircle, AlertTriangle, Info, X, Loader 
} from 'lucide-react';

/**
 * Composant Toast - Notifications améliorées
 * ✨ 5 types : success, error, warning, info, loading
 * ✨ Animations fluides
 * ✨ Auto-dismiss configurable
 * ✨ Actions personnalisables
 * ✨ Progression visuelle
 */

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-green-800 dark:text-green-200'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-600 dark:text-orange-400',
    textColor: 'text-orange-800 dark:text-orange-200'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-800 dark:text-blue-200'
  },
  loading: {
    icon: Loader,
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-400',
    textColor: 'text-gray-800 dark:text-gray-200'
  }
};

export const Toast = ({ 
  id,
  type = 'info', 
  message, 
  description,
  duration = 5000, 
  onClose,
  action,
  persistent = false
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const config = toastConfig[type] || toastConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    if (persistent || type === 'loading') return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress < 0 ? 0 : newProgress;
      });
    }, 100);

    const timeout = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timeout);
      clearInterval(progressInterval);
    };
  }, [duration, persistent, type]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border shadow-lg backdrop-blur transition-all duration-300 ${
        config.bgColor
      } ${config.borderColor} ${
        isExiting
          ? 'opacity-0 translate-x-full'
          : 'opacity-100 translate-x-0'
      }`}
      style={{ minWidth: '320px', maxWidth: '480px' }}
    >
      {/* Barre de progression */}
      {!persistent && type !== 'loading' && (
        <div className="absolute top-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 w-full">
          <div
            className={`h-full transition-all duration-100 ${
              type === 'success' ? 'bg-green-500' :
              type === 'error' ? 'bg-red-500' :
              type === 'warning' ? 'bg-orange-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3 p-4 pt-5">
        {/* Icône */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon 
            size={24} 
            className={type === 'loading' ? 'animate-spin' : ''}
          />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${config.textColor}`}>
            {message}
          </p>
          {description && (
            <p className={`text-sm mt-1 ${config.textColor} opacity-80`}>
              {description}
            </p>
          )}

          {/* Action personnalisée */}
          {action && (
            <button
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              className={`mt-2 text-sm font-medium underline ${config.iconColor} hover:opacity-80 transition`}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Bouton fermer */}
        {!persistent && (
          <button
            onClick={handleClose}
            className={`flex-shrink-0 ${config.iconColor} hover:opacity-70 transition`}
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Container de toasts
 */
export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onRemove}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Hook pour utiliser les toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = ({
    type = 'info',
    message,
    description,
    duration = 5000,
    action,
    persistent = false
  }) => {
    const id = Date.now() + Math.random();
    const toast = { id, type, message, description, duration, action, persistent };
    
    setToasts(prev => [...prev, toast]);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message, options = {}) => 
    addToast({ type: 'success', message, ...options });

  const error = (message, options = {}) => 
    addToast({ type: 'error', message, ...options });

  const warning = (message, options = {}) => 
    addToast({ type: 'warning', message, ...options });

  const info = (message, options = {}) => 
    addToast({ type: 'info', message, ...options });

  const loading = (message, options = {}) => 
    addToast({ type: 'loading', message, persistent: true, ...options });

  const updateToast = (id, updates) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    loading,
    updateToast
  };
};

export default Toast;