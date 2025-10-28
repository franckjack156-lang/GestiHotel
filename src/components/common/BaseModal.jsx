// src/components/common/BaseModal.jsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Composant Modal de Base - Réutilisable
 * 
 * @param {boolean} isOpen - État d'ouverture
 * @param {function} onClose - Fonction de fermeture
 * @param {string} title - Titre de la modale
 * @param {string} subtitle - Sous-titre optionnel
 * @param {ReactNode} icon - Icône dans le header (optionnel)
 * @param {ReactNode} children - Contenu de la modale
 * @param {string} size - Taille : 'sm', 'md', 'lg', 'xl', 'full'
 * @param {boolean} closeOnEscape - Fermer avec Échap (défaut: true)
 * @param {boolean} closeOnBackdrop - Fermer au clic backdrop (défaut: true)
 * @param {ReactNode} footer - Footer personnalisé (optionnel)
 * @param {string} className - Classes CSS additionnelles
 */
const BaseModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  size = 'lg',
  closeOnEscape = true,
  closeOnBackdrop = true,
  footer,
  className = ''
}) => {
  // Fermer avec Échap
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Tailles de modale
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl ${sizeClasses[size]} w-full max-h-[95vh] flex flex-col shadow-2xl animate-scale-in ${className}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {Icon && (
                <div className="flex-shrink-0">
                  <Icon size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Fermer"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer (optionnel) */}
        {footer && (
          <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseModal;