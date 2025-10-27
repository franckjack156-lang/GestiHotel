//========================================
// 📁 PARTIE 1 : GESTION DES FICHIERS
// ========================================

export const fileUtils = {
  /**
   * Convertir un fichier en base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },

  /**
   * Valider le type de fichier
   */
  isValidFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) {
    return allowedTypes.includes(file.type);
  },

  /**
   * Valider la taille du fichier
   */
  isValidFileSize(file, maxSizeInMB = 5) {
    const maxSize = maxSizeInMB * 1024 * 1024; // Convertir en bytes
    return file.size <= maxSize;
  },

  /**
   * Générer un nom de fichier unique
   */
  generateFileName(originalName) {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    return `file_${timestamp}.${extension}`;
  },

  /**
   * Télécharger un fichier
   */
  downloadFile(data, filename, type = 'text/plain') {
    const file = new Blob([data], { type });
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valider un numéro de téléphone français
   */
  isValidPhone(phone) {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Valider un mot de passe
   */
  isValidPassword(password) {
    return password && password.length >= 6;
  },

  /**
   * Valider une intervention
   */
  validateIntervention(intervention) {
    const errors = [];

    if (!intervention.location?.trim()) {
      errors.push('La localisation est obligatoire');
    }

    if (!intervention.missionSummary?.trim()) {
      errors.push('Le résumé de mission est obligatoire');
    }

    if (!intervention.assignedTo?.trim()) {
      errors.push('L\'assignation à un technicien est obligatoire');
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
    }

    if (!user.email?.trim()) {
      errors.push('L\'email est obligatoire');
    } else if (!this.isValidEmail(user.email)) {
      errors.push('L\'email n\'est pas valide');
    }

    if (!user.role?.trim()) {
      errors.push('Le rôle est obligatoire');
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
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    
    return new Date(date).toLocaleDateString('fr-FR', defaultOptions);
  },

  /**
   * Formater une date et heure
   */
  formatDateTime(date) {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  },

  /**
   * Formater la durée
   */
  formatDuration(hours, minutes) {
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    }
    return `${minutes}min`;
  },

  /**
   * Vérifier si une date est aujourd'hui
   */
  isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    
    return today.toDateString() === checkDate.toDateString();
  },

  /**
   * Vérifier si une date est cette semaine
   */
  isThisWeek(date) {
    const today = new Date();
    const checkDate = new Date(date);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return checkDate >= startOfWeek && checkDate <= endOfWeek;
  }
};

// ========================================
// 🎯 EXPORT PAR DÉFAUT (optionnel)
// ========================================

export default {
  file: fileUtils,
  validation: validationUtils,
  date: dateUtils
};