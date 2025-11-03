// ==========================================
// 🛠️ HELPERS.JS - VERSION MODERNISÉE
// ==========================================
// Ce fichier regroupe tous les utilitaires de l'application
// Il maintient la compatibilité avec l'ancien code tout en ajoutant
// de nouvelles fonctionnalités et une meilleure gestion d'erreurs

// ========================================
// 📁 PARTIE 1 : GESTION DES FICHIERS
// ========================================

export const fileUtils = {
  /**
   * Convertir un fichier en base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Aucun fichier fourni'));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },

  /**
   * Valider le type de fichier
   */
  isValidFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) {
    if (!file || !file.type) return false;
    return allowedTypes.includes(file.type);
  },

  /**
   * Valider la taille du fichier
   */
  isValidFileSize(file, maxSizeInMB = 5) {
    if (!file) return false;
    const maxSize = maxSizeInMB * 1024 * 1024; // Convertir en bytes
    return file.size <= maxSize;
  },

  /**
   * Validation complète d'un fichier
   */
  validateFile(file, options = {}) {
    const {
      maxSizeMB = 5,
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    } = options;

    const errors = [];

    if (!file) {
      errors.push('Aucun fichier fourni');
      return { isValid: false, errors };
    }

    if (!this.isValidFileType(file, allowedTypes)) {
      const types = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
      errors.push(`Type de fichier non autorisé. Types acceptés : ${types}`);
    }

    if (!this.isValidFileSize(file, maxSizeMB)) {
      errors.push(`Le fichier dépasse la taille maximale de ${maxSizeMB} MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Générer un nom de fichier unique et sécurisé
   */
  generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const extension = originalName.split('.').pop().toLowerCase();
    
    // Nettoyer le nom original
    const cleanName = originalName
      .replace(`.${extension}`, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase()
      .substring(0, 30);

    return `${cleanName}_${timestamp}_${random}.${extension}`;
  },

  /**
   * Télécharger un fichier
   */
  downloadFile(data, filename, type = 'text/plain') {
    try {
      const file = new Blob([data], { type });
      const a = document.createElement('a');
      const url = URL.createObjectURL(file);
      
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      return true;
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      return false;
    }
  },

  /**
   * Formater la taille d'un fichier
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Compresser une image
   */
  compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8
      } = options;

      if (!file.type.startsWith('image/')) {
        reject(new Error('Le fichier doit être une image'));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculer les nouvelles dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Erreur lors de la compression'));
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      };

      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    });
  }
};

// ========================================
// ✅ PARTIE 2 : VALIDATION
// ========================================

export const validationUtils = {
  /**
   * Valider un email
   */
  isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valider un numéro de téléphone français
   */
  isValidPhone(phone) {
    if (!phone) return false;
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(cleanPhone);
  },

  /**
   * Valider un mot de passe
   */
  isValidPassword(password) {
    if (!password) return false;
    
    // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  },

  /**
   * Obtenir les erreurs de validation du mot de passe
   */
  getPasswordErrors(password) {
    const errors = [];

    if (!password) {
      errors.push('Le mot de passe est requis');
      return errors;
    }

    if (password.length < 8) {
      errors.push('Au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Une minuscule');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Un chiffre');
    }

    return errors;
  },

  /**
   * Valider une intervention
   */
  validateIntervention(intervention) {
    const errors = [];

    // Validation de la localisation (nouveau format array)
    if (!intervention.locations || !Array.isArray(intervention.locations) || intervention.locations.length === 0) {
      errors.push('Au moins une localisation est obligatoire');
    }

    // Validation du résumé
    if (!intervention.missionSummary?.trim()) {
      errors.push('Le résumé de mission est obligatoire');
    } else if (intervention.missionSummary.length < 10) {
      errors.push('Le résumé doit contenir au moins 10 caractères');
    }

    // Validation de l'assignation
    if (!intervention.assignedTo?.trim()) {
      errors.push('L\'assignation à un technicien est obligatoire');
    }

    // Validation du statut
    const validStatuses = ['todo', 'inprogress', 'completed', 'cancelled'];
    if (intervention.status && !validStatuses.includes(intervention.status)) {
      errors.push('Statut invalide');
    }

    // Validation de la priorité
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (intervention.priority && !validPriorities.includes(intervention.priority)) {
      errors.push('Priorité invalide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Valider un utilisateur
   */
  validateUser(user) {
    const errors = [];

    if (!user.name?.trim()) {
      errors.push('Le nom est obligatoire');
    } else if (user.name.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    if (!user.email?.trim()) {
      errors.push('L\'email est obligatoire');
    } else if (!this.isValidEmail(user.email)) {
      errors.push('L\'email n\'est pas valide');
    }

    if (!user.role?.trim()) {
      errors.push('Le rôle est obligatoire');
    } else {
      const validRoles = ['superadmin', 'manager', 'reception', 'technician'];
      if (!validRoles.includes(user.role)) {
        errors.push('Rôle invalide');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Valider un numéro de chambre
   */
  validateRoomNumber(roomNumber) {
    if (!roomNumber) return false;
    // Format: nombre ou nombre + lettre (ex: 101, 101A)
    const roomRegex = /^[0-9]{1,4}[A-Z]?$/i;
    return roomRegex.test(roomNumber.toString().trim());
  },

  /**
   * Valider une URL
   */
  isValidUrl(url) {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validation générique de champ texte
   */
  validateTextField(value, options = {}) {
    const {
      required = true,
      minLength = 0,
      maxLength = 1000,
      fieldName = 'Ce champ'
    } = options;

    const errors = [];

    if (!value || value.trim() === '') {
      if (required) {
        errors.push(`${fieldName} est requis`);
      }
      return { isValid: !required, errors };
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length < minLength) {
      errors.push(`${fieldName} doit contenir au moins ${minLength} caractères`);
    }

    if (trimmedValue.length > maxLength) {
      errors.push(`${fieldName} ne peut pas dépasser ${maxLength} caractères`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// ========================================
// 📅 PARTIE 3 : MANIPULATION DES DATES
// ========================================

export const dateUtils = {
  /**
   * Formater une date en français
   */
  formatDate(date, options = {}) {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      console.warn('Date invalide:', date);
      return '';
    }

    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    
    return dateObj.toLocaleDateString('fr-FR', defaultOptions);
  },

  /**
   * Formater une date et heure
   */
  formatDateTime(date) {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) return '';

    return dateObj.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Formater uniquement l'heure
   */
  formatTime(date) {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) return '';

    return dateObj.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Calculer la différence entre deux dates
   */
  getTimeDifference(startDate, endDate = new Date()) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = Math.abs(end - start);
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return { days, hours, minutes, milliseconds: diffMs };
  },

  /**
   * Formater la durée
   */
  formatDuration(hours, minutes) {
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}j ${remainingHours}h`;
    }
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    }
    return `${minutes}min`;
  },

  /**
   * Obtenir le temps relatif (il y a X minutes/heures/jours)
   */
  getRelativeTime(date) {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now - dateObj;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) {
      return 'À l\'instant';
    } else if (diffMin < 60) {
      return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return this.formatDate(dateObj, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  },

  /**
   * Vérifier si une date est aujourd'hui
   */
  isToday(date) {
    if (!date) return false;
    
    const today = new Date();
    const checkDate = new Date(date);
    
    return today.toDateString() === checkDate.toDateString();
  },

  /**
   * Vérifier si une date est hier
   */
  isYesterday(date) {
    if (!date) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(date);

    return yesterday.toDateString() === checkDate.toDateString();
  },

  /**
   * Vérifier si une date est cette semaine
   */
  isThisWeek(date) {
    if (!date) return false;

    const today = new Date();
    const checkDate = new Date(date);
    
    // Obtenir le lundi de cette semaine
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Obtenir le dimanche de cette semaine
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return checkDate >= startOfWeek && checkDate <= endOfWeek;
  },

  /**
   * Obtenir le début de la journée
   */
  getStartOfDay(date = new Date()) {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
  },

  /**
   * Obtenir la fin de la journée
   */
  getEndOfDay(date = new Date()) {
    const dateObj = new Date(date);
    dateObj.setHours(23, 59, 59, 999);
    return dateObj;
  },

  /**
   * Ajouter des jours à une date
   */
  addDays(date, days) {
    const dateObj = new Date(date);
    dateObj.setDate(dateObj.getDate() + days);
    return dateObj;
  },

  /**
   * Convertir un Timestamp Firebase en Date
   */
  timestampToDate(timestamp) {
    if (!timestamp) return null;
    
    // Si c'est déjà une Date
    if (timestamp instanceof Date) return timestamp;
    
    // Si c'est un Timestamp Firebase avec méthode toDate
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // Si c'est un objet avec seconds
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    
    // Sinon essayer de créer une Date
    return new Date(timestamp);
  }
};

// ========================================
// 📊 PARTIE 4 : UTILITAIRES DIVERS
// ========================================

export const miscUtils = {
  /**
   * Générer un ID unique
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },

  /**
   * Débouncer une fonction
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttler une fonction
   */
  throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Capitaliser la première lettre
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Tronquer un texte
   */
  truncate(str, length = 50, suffix = '...') {
    if (!str || str.length <= length) return str;
    return str.substring(0, length).trim() + suffix;
  },

  /**
   * Copier du texte dans le presse-papier
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback pour les navigateurs plus anciens
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      return false;
    }
  },

  /**
   * Formater un nombre avec séparateurs
   */
  formatNumber(num, locale = 'fr-FR') {
    if (num === null || num === undefined) return '';
    return new Intl.NumberFormat(locale).format(num);
  },

  /**
   * Nettoyer une chaîne pour utilisation dans une URL
   */
  slugify(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};

// ========================================
// 🎯 EXPORT PAR DÉFAUT
// ========================================

export default {
  file: fileUtils,
  validation: validationUtils,
  date: dateUtils,
  misc: miscUtils
};