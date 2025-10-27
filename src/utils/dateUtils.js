// Utilitaires pour la manipulation des dates
export const dateUtils = {
  // Formater une date en français
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    
    return new Date(date).toLocaleDateString('fr-FR', defaultOptions);
  },

  // Formater une date et heure
  formatDateTime(date) {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Calculer la différence entre deux dates
  getTimeDifference(startDate, endDate = new Date()) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  },

  // Formater la durée
  formatDuration(hours, minutes) {
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    }
    return `${minutes}min`;
  },

  // Vérifier si une date est aujourd'hui
  isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    
    return today.toDateString() === checkDate.toDateString();
  },

  // Vérifier si une date est cette semaine
  isThisWeek(date) {
    const today = new Date();
    const checkDate = new Date(date);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return checkDate >= startOfWeek && checkDate <= endOfWeek;
  }
};