// src/utils/toast.js - SYSTÈME DE TOAST GLOBAL
let globalToast = null;

export const setGlobalToast = (toastInstance) => {
  globalToast = toastInstance;
};

export const toast = {
  success: (message, options = {}) => {
    if (!globalToast) {
      console.warn('⚠️ Toast not initialized');
      return;
    }
    return globalToast.success(message, options);
  },
  
  error: (message, options = {}) => {
    if (!globalToast) {
      console.warn('⚠️ Toast not initialized');
      return;
    }
    return globalToast.error(message, options);
  },
  
  warning: (message, options = {}) => {
    if (!globalToast) {
      console.warn('⚠️ Toast not initialized');
      return;
    }
    return globalToast.warning(message, options);
  },
  
  info: (message, options = {}) => {
    if (!globalToast) {
      console.warn('⚠️ Toast not initialized');
      return;
    }
    return globalToast.info(message, options);
  },
  
  loading: (message, options = {}) => {
    if (!globalToast) {
      console.warn('⚠️ Toast not initialized');
      return;
    }
    return globalToast.loading(message, options);
  },
  
  removeToast: (id) => {
    if (!globalToast) {
      console.warn('⚠️ Toast not initialized');
      return;
    }
    return globalToast.removeToast(id);
  }
};