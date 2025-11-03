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
   * ✅ CORRECTION: Générer un nom de fichier unique et sécurisé (COMPLET)
   */
  generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    
    // ✅ Extraction sécurisée de l'extension
    const parts = originalName.split('.');
    const extension = parts.length > 1 ? parts.pop().toLowerCase() : 'jpg';
    
    // ✅ Nettoyer le nom original
    const baseName = parts.join('.'); // Rejoindre au cas où il y a plusieurs points
    const cleanName = baseName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-zA-Z0-9]/g, '_')   // Remplacer caractères spéciaux
      .toLowerCase()
      .substring(0, 30); // Limiter la longueur

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
   * ✅ CORRECTION: Compresser une image (COMPLET)
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

          // Convertir en blob
          canvas.toBlob((blob) => {
            if (blob) {
              // Créer un nouveau fichier avec le blob compressé
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              
              resolve(compressedFile);
            } else {
              reject(new Error('Erreur lors de la compression'));
            }
          }, file.type, quality);
        };

        img.onerror = () => {
          reject(new Error('Erreur lors du chargement de l\'image'));
        };
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
  },

  /**
   * ✅ NOUVEAU: Extraire les métadonnées EXIF d'une image
   */
  async extractImageMetadata(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
            size: file.size,
            type: file.type,
            name: file.name,
            lastModified: new Date(file.lastModified)
          });
        };
        
        img.onerror = () => {
          resolve(null);
        };
      };
      
      reader.readAsDataURL(file);
    });
  }
};

// ========================================
// 📅 PARTIE 2 : GESTION DES DATES
// ========================================

export const dateUtils = {
  /**
   * Formater une date
   */
  formatDate(date, format = 'dd/MM/yyyy') {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return format
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year)
      .replace('HH', hours)
      .replace('mm', minutes);
  },

  /**
   * ✅ NOUVEAU: Obtenir une date relative (il y a X temps)
   */
  getRelativeTime(date) {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now - d;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`;
    
    return this.formatDate(d);
  },

  /**
   * ✅ NOUVEAU: Calculer la durée entre deux dates
   */
  calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return { hours: 0, minutes: 0, total: 0 };
    
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    const diff = end - start;
    const totalMinutes = Math.floor(diff / (1000 * 60));
    
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      total: totalMinutes
    };
  }
};

// ========================================
// 🔢 PARTIE 3 : GESTION DES NOMBRES
// ========================================

export const numberUtils = {
  /**
   * Formater un nombre
   */
  formatNumber(number, decimals = 0) {
    if (typeof number !== 'number') return '0';
    return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  },

  /**
   * Formater un prix
   */
  formatPrice(price, currency = '€') {
    if (typeof price !== 'number') return `0 ${currency}`;
    return `${this.formatNumber(price, 2)} ${currency}`;
  },

  /**
   * ✅ NOUVEAU: Calculer un pourcentage
   */
  calculatePercentage(value, total) {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  /**
   * ✅ NOUVEAU: Arrondir à N décimales
   */
  round(number, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
  }
};

// ========================================
// 📝 PARTIE 4 : GESTION DES CHAÎNES
// ========================================

export const stringUtils = {
  /**
   * Tronquer un texte
   */
  truncate(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Capitaliser la première lettre
   */
  capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  /**
   * ✅ NOUVEAU: Slugifier un texte
   */
  slugify(text) {
    if (!text) return '';
    
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  },

  /**
   * ✅ NOUVEAU: Échapper les caractères HTML
   */
  escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * ✅ NOUVEAU: Enlever les balises HTML
   */
  stripHtml(html) {
    if (!html) return '';
    
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
};

// ========================================
// 🎨 PARTIE 5 : GESTION DES COULEURS
// ========================================

export const colorUtils = {
  /**
   * Obtenir une couleur basée sur le statut
   */
  getStatusColor(status) {
    const colors = {
      todo: 'blue',
      inprogress: 'yellow',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'gray';
  },

  /**
   * Obtenir une couleur basée sur la priorité
   */
  getPriorityColor(priority) {
    const colors = {
      urgent: 'red',
      high: 'orange',
      normal: 'blue',
      low: 'green'
    };
    return colors[priority] || 'gray';
  },

  /**
   * ✅ NOUVEAU: Générer une couleur aléatoire
   */
  randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  },

  /**
   * ✅ NOUVEAU: Convertir HEX en RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
};

// ========================================
// ✅ PARTIE 6 : VALIDATION
// ========================================

export const validationUtils = {
  /**
   * Valider un email
   */
  isValidEmail(email) {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Valider un numéro de téléphone français
   */
  isValidPhone(phone) {
    if (!phone) return false;
    const re = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return re.test(phone.replace(/\s/g, ''));
  },

  /**
   * ✅ NOUVEAU: Valider un mot de passe
   */
  isValidPassword(password) {
    if (!password || password.length < 8) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  },

  /**
   * ✅ NOUVEAU: Valider une URL
   */
  isValidUrl(url) {
    if (!url) return false;
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

// ========================================
// 🔄 PARTIE 7 : UTILITAIRES DIVERS
// ========================================

export const miscUtils = {
  /**
   * Générer un ID unique
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Debounce une fonction
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
   * ✅ NOUVEAU: Throttle une fonction
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
   * ✅ NOUVEAU: Deep clone un objet
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  /**
   * ✅ NOUVEAU: Attendre X millisecondes
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Export par défaut avec tous les utils
export default {
  file: fileUtils,
  date: dateUtils,
  number: numberUtils,
  string: stringUtils,
  color: colorUtils,
  validation: validationUtils,
  misc: miscUtils
};
