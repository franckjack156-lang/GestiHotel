// Utilitaires de validation
export const validationUtils = {
  // Valider un email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Valider un numéro de téléphone français
  isValidPhone(phone) {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Valider un mot de passe
  isValidPassword(password) {
    return password && password.length >= 6;
  },

  // Valider une intervention
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

  // Valider un utilisateur
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