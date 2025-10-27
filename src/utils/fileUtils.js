// Utilitaires pour la manipulation de fichiers
export const fileUtils = {
  // Convertir un fichier en base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },

  // Valider le type de fichier
  isValidFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) {
    return allowedTypes.includes(file.type);
  },

  // Valider la taille du fichier
  isValidFileSize(file, maxSizeInMB = 5) {
    const maxSize = maxSizeInMB * 1024 * 1024; // Convertir en bytes
    return file.size <= maxSize;
  },

  // Générer un nom de fichier unique
  generateFileName(originalName) {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    return `file_${timestamp}.${extension}`;
  },

  // Télécharger un fichier
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