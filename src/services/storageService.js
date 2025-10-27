import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable,
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';
import { storage } from '../Config/firebase';

export const storageService = {
  /**
   * Upload un fichier vers Firebase Storage
   * @param {File} file - Le fichier à uploader
   * @param {string} path - Le chemin de destination
   * @param {Function} onProgress - Callback pour le progrès (optionnel)
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async uploadFile(file, path, onProgress = null) {
    try {
      const storageRef = ref(storage, path);
      
      if (onProgress) {
        // Upload avec progression
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress);
            },
            (error) => {
              console.error('Erreur upload:', error);
              reject({ success: false, error: error.message });
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({ success: true, url: downloadURL });
              } catch (error) {
                reject({ success: false, error: error.message });
              }
            }
          );
        });
      } else {
        // Upload simple sans progression
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { success: true, url: downloadURL };
      }
    } catch (error) {
      console.error('Erreur uploadFile:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload multiple fichiers
   * @param {File[]} files - Tableau de fichiers
   * @param {string} basePath - Chemin de base
   * @param {Function} onProgress - Callback pour le progrès global
   * @returns {Promise<{success: boolean, urls?: string[], errors?: string[]}>}
   */
  async uploadMultipleFiles(files, basePath, onProgress = null) {
    const results = [];
    const errors = [];
    let completed = 0;

    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${basePath}/${fileName}`;
      
      const result = await this.uploadFile(file, filePath, (fileProgress) => {
        if (onProgress) {
          const globalProgress = ((completed + fileProgress / 100) / files.length) * 100;
          onProgress(globalProgress);
        }
      });

      if (result.success) {
        results.push(result.url);
      } else {
        errors.push(result.error);
      }
      
      completed++;
    }

    return {
      success: errors.length === 0,
      urls: results,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  /**
   * Obtenir l'URL de téléchargement d'un fichier
   * @param {string} path - Le chemin du fichier
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async getDownloadURL(path) {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      return { success: true, url };
    } catch (error) {
      console.error('Erreur getDownloadURL:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprimer un fichier
   * @param {string} path - Le chemin du fichier à supprimer
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteFile(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Erreur deleteFile:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprimer plusieurs fichiers
   * @param {string[]} paths - Tableau de chemins
   * @returns {Promise<{success: boolean, deletedCount: number, errors?: string[]}>}
   */
  async deleteMultipleFiles(paths) {
    const errors = [];
    let deletedCount = 0;

    for (const path of paths) {
      const result = await this.deleteFile(path);
      if (result.success) {
        deletedCount++;
      } else {
        errors.push(result.error);
      }
    }

    return {
      success: errors.length === 0,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  /**
   * Lister tous les fichiers d'un dossier
   * @param {string} folderPath - Le chemin du dossier
   * @returns {Promise<{success: boolean, files?: Array, error?: string}>}
   */
  async listFiles(folderPath) {
    try {
      const storageRef = ref(storage, folderPath);
      const result = await listAll(storageRef);
      
      const files = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            url,
            size: metadata.size,
            contentType: metadata.contentType,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated
          };
        })
      );

      return { success: true, files };
    } catch (error) {
      console.error('Erreur listFiles:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtenir les métadonnées d'un fichier
   * @param {string} path - Le chemin du fichier
   * @returns {Promise<{success: boolean, metadata?: object, error?: string}>}
   */
  async getMetadata(path) {
    try {
      const storageRef = ref(storage, path);
      const metadata = await getMetadata(storageRef);
      return { success: true, metadata };
    } catch (error) {
      console.error('Erreur getMetadata:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Valider un fichier avant upload
   * @param {File} file - Le fichier à valider
   * @param {object} options - Options de validation
   * @returns {boolean}
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB par défaut
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    } = options;

    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux. Taille maximale : ${maxSize / 1024 / 1024}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé. Types autorisés : ${allowedTypes.join(', ')}`);
    }

    return true;
  },

  /**
   * Générer un chemin unique pour un fichier
   * @param {string} basePath - Chemin de base
   * @param {string} fileName - Nom du fichier
   * @returns {string}
   */
  generateUniquePath(basePath, fileName) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.replace(`.${extension}`, '');
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${basePath}/${timestamp}_${randomString}_${sanitizedName}.${extension}`;
  }
};