// src/components/common/ConfirmDialog.jsx - DIALOG DE CONFIRMATION ÉLÉGANT
import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, HelpCircle } from 'lucide-react';
import BaseModal from './BaseModal';

/**
 * Dialog de confirmation élégant et réutilisable
 * ✨ 5 types : danger, warning, info, success, question
 * ✨ Validation par saisie (pour actions critiques)
 * ✨ Actions personnalisables
 * ✨ Design moderne
 */

const confirmConfig = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    title: 'Action dangereuse'
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white',
    title: 'Attention'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
    title: 'Information'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
    title: 'Confirmation'
  },
  question: {
    icon: HelpCircle,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    confirmButton: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    title: 'Question'
  }
};

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'question',
  title,
  message,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  requireConfirmation = false,
  confirmationText = 'CONFIRMER',
  confirmationPlaceholder = 'Tapez CONFIRMER pour valider',
  isLoading = false
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [isConfirming, setIsConfirming] = React.useState(false);

  const config = confirmConfig[type] || confirmConfig.question;
  const Icon = config.icon;

  const canConfirm = requireConfirmation 
    ? inputValue.toUpperCase() === confirmationText.toUpperCase()
    : true;

  const handleConfirm = async () => {
    if (!canConfirm) return;

    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
      setInputValue('');
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    if (isConfirming || isLoading) return;
    setInputValue('');
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && canConfirm && !isConfirming) {
      handleConfirm();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closeOnBackdrop={!isConfirming && !isLoading}
      closeOnEscape={!isConfirming && !isLoading}
    >
      <div className="p-6">
        {/* Icône + Titre */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`flex-shrink-0 p-3 rounded-full ${config.iconBg}`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {title || config.title}
            </h3>
            {message && (
              <p className="text-gray-700 dark:text-gray-300">
                {message}
              </p>
            )}
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Champ de confirmation requis */}
        {requireConfirmation && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pour confirmer, tapez <strong className={config.iconColor}>{confirmationText}</strong> :
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={confirmationPlaceholder}
              disabled={isConfirming || isLoading}
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
            />
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isConfirming || isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isConfirming || isLoading}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmButton}`}
          >
            {isConfirming || isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Traitement...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

/**
 * Hook pour utiliser les confirmations
 */
export const useConfirm = () => {
  const [confirmState, setConfirmState] = React.useState({
    isOpen: false,
    type: 'question',
    title: '',
    message: '',
    description: '',
    onConfirm: () => {},
    requireConfirmation: false,
    confirmationText: 'CONFIRMER'
  });

  const confirm = ({
    type = 'question',
    title,
    message,
    description,
    confirmText,
    cancelText,
    requireConfirmation = false,
    confirmationText = 'CONFIRMER'
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        type,
        title,
        message,
        description,
        confirmText,
        cancelText,
        requireConfirmation,
        confirmationText,
        onConfirm: () => {
          resolve(true);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => {
          resolve(false);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      });
    });
  };

  const danger = (message, options = {}) => 
    confirm({ type: 'danger', message, ...options });

  const warning = (message, options = {}) => 
    confirm({ type: 'warning', message, ...options });

  const success = (message, options = {}) => 
    confirm({ type: 'success', message, ...options });

  const info = (message, options = {}) => 
    confirm({ type: 'info', message, ...options });

  return {
    confirm,
    danger,
    warning,
    success,
    info,
    ConfirmDialog: (
      <ConfirmDialog
        {...confirmState}
        onClose={() => {
          confirmState.onCancel?.();
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }}
      />
    )
  };
};

export default ConfirmDialog;