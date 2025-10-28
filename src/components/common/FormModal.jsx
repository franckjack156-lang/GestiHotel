// src/components/common/FormModal.jsx
import React, { useState } from 'react';
import { Save, Loader, AlertCircle } from 'lucide-react';
import BaseModal from './BaseModal';

/**
 * Modal avec Formulaire - Composant Réutilisable
 * 
 * @param {boolean} isOpen - État d'ouverture
 * @param {function} onClose - Fonction de fermeture
 * @param {string} title - Titre de la modale
 * @param {object} initialData - Données initiales du formulaire
 * @param {function} onSubmit - Fonction appelée à la soumission (async)
 * @param {function} children - Fonction render prop recevant (formData, setFormData, errors)
 * @param {function} validate - Fonction de validation personnalisée
 * @param {string} submitLabel - Label du bouton de soumission
 * @param {string} size - Taille de la modale
 * @param {ReactNode} icon - Icône dans le header
 */
const FormModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  initialData = {},
  onSubmit,
  children,
  validate,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  size = 'lg',
  icon: Icon,
  showFooter = true,
  className = ''
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Réinitialiser le formulaire quand initialData change
  React.useEffect(() => {
    setFormData(initialData);
    setErrors({});
    setSubmitError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    // Validation personnalisée
    if (validate) {
      const validationErrors = validate(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit(formData);
      
      // Si la fonction retourne explicitement false, ne pas fermer
      if (result !== false) {
        onClose();
        // Réinitialiser le formulaire
        setFormData(initialData);
      }
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
      setSubmitError(error.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    
    // Vérifier si le formulaire a été modifié
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    
    if (hasChanges) {
      if (confirm('Voulez-vous vraiment annuler ? Les modifications seront perdues.')) {
        setFormData(initialData);
        setErrors({});
        setSubmitError(null);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const footer = showFooter ? (
    <div className="flex flex-col gap-3">
      {/* Erreur globale */}
      {submitError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700 dark:text-red-300">{submitError}</span>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader size={18} className="animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      subtitle={subtitle}
      icon={Icon}
      size={size}
      footer={footer}
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Render children avec formData et setFormData */}
        {typeof children === 'function' 
          ? children({ formData, setFormData, errors, isSubmitting })
          : children
        }
      </form>
    </BaseModal>
  );
};

export default FormModal;