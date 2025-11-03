// src/components/common/FormFields.jsx
import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Info } from 'lucide-react';

/**
 * Composants de champs de formulaire réutilisables
 */

// Label avec indicateur requis
export const FormLabel = ({ children, required, htmlFor, hint }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
    {hint && (
      <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">
        {hint}
      </span>
    )}
  </label>
);

// Message d'erreur
export const FormError = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={14} />
      <span>{error}</span>
    </div>
  );
};

// Helper text
export const FormHelp = ({ children }) => (
  <div className="flex items-start gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
    <Info size={14} className="flex-shrink-0 mt-0.5" />
    <span>{children}</span>
  </div>
);

// Input texte
export const TextInput = ({
  id,
  name,
  value,
  onChange,
  label,
  required,
  placeholder,
  disabled,
  error,
  hint,
  icon: Icon,
  type = 'text',
  ...props
}) => {
  const handleChange = (e) => {
    onChange?.(e.target.value, e);
  };

  return (
    <div>
      {label && (
        <FormLabel htmlFor={id} required={required} hint={hint}>
          {label}
        </FormLabel>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          {...props}
        />
      </div>
      <FormError error={error} />
    </div>
  );
};

// Input mot de passe
export const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  label,
  required,
  placeholder,
  disabled,
  error,
  hint,
  showGenerator = false,
  onGenerate,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      {label && (
        <FormLabel htmlFor={id} required={required} hint={hint}>
          {label}
        </FormLabel>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value, e)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full pl-4 ${showGenerator ? 'pr-28' : 'pr-12'} py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 ${
            error
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          {...props}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
          {showGenerator && onGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={disabled}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium disabled:opacity-50"
            >
              Générer
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <FormError error={error} />
    </div>
  );
};

// Select
export const SelectInput = ({
  id,
  name,
  value,
  onChange,
  options = [],
  label,
  required,
  placeholder,
  disabled,
  error,
  hint,
  ...props
}) => {
  return (
    <div>
      {label && (
        <FormLabel htmlFor={id} required={required} hint={hint}>
          {label}
        </FormLabel>
      )}
      <select
        id={id}
        name={name}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value, e)}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        {...props}
      >
        {placeholder && <option key="placeholder" value="">{placeholder}</option>}
          {options.map((option, index) => (
            <option
              key={option.value || `option-${index}`}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
      </select>
      <FormError error={error} />
    </div>
  );
};

// Textarea
export const TextareaInput = ({
  id,
  name,
  value,
  onChange,
  label,
  required,
  placeholder,
  disabled,
  error,
  hint,
  rows = 4,
  ...props
}) => {
  return (
    <div>
      {label && (
        <FormLabel htmlFor={id} required={required} hint={hint}>
          {label}
        </FormLabel>
      )}
      <textarea
        id={id}
        name={name}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value, e)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        {...props}
      />
      <FormError error={error} />
    </div>
  );
};

// Checkbox
export const CheckboxInput = ({
  id,
  name,
  checked,
  onChange,
  label,
  disabled,
  error,
  description,
  ...props
}) => {
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked || false}
          onChange={(e) => onChange?.(e.target.checked, e)}
          disabled={disabled}
          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          {...props}
        />
        <div className="flex-1">
          {label && (
            <label
              htmlFor={id}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <FormError error={error} />
    </div>
  );
};

// Radio Group
export const RadioGroup = ({
  name,
  value,
  onChange,
  options = [],
  label,
  required,
  error,
  hint,
  disabled
}) => {
  return (
    <div>
      {label && (
        <FormLabel required={required} hint={hint}>
          {label}
        </FormLabel>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
              value === option.value
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value, e)}
              disabled={disabled || option.disabled}
              className="mt-1 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-800 dark:text-white">
                {option.label}
              </div>
              {option.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {option.description}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
      <FormError error={error} />
    </div>
  );
};

// Form Section (pour regrouper des champs)
export const FormSection = ({ title, description, children }) => (
  <div className="space-y-4">
    {(title || description) && (
      <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
        {title && (
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
    )}
    <div className="space-y-4">
      {children}
    </div>
  </div>
);