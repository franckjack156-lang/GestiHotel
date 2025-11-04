// src/hooks/useInterventionPermissions.js
import { useMemo } from 'react';

/**
 * Hook pour vérifier les permissions sur une intervention
 * 
 * RÈGLES:
 * - SuperAdmin: peut tout faire
 * - Manager: peut tout faire
 * - Créateur: peut éditer/supprimer ses propres interventions
 * - Assigné: peut changer statut et ajouter photos/commentaires
 * - Autres: lecture seule
 */
export const useInterventionPermissions = (user, intervention) => {
  return useMemo(() => {
    if (!user || !intervention) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canChangeStatus: false,
        canAssign: false,
        canAddPhotos: false,
        canAddComments: false,
        reason: 'Données manquantes',
        role: 'none'
      };
    }

    const isSuperAdmin = user.role === 'superadmin';
    const isManager = user.role === 'manager';
    const isCreator = intervention.createdBy === user.uid;
    const isAssigned = intervention.assignedTo === user.uid || 
                       intervention.assignedToIds?.includes(user.uid);

    // SuperAdmin peut tout faire
    if (isSuperAdmin) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canChangeStatus: true,
        canAssign: true,
        canAddPhotos: true,
        canAddComments: true,
        role: 'superadmin'
      };
    }

    // Manager peut presque tout faire
    if (isManager) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canChangeStatus: true,
        canAssign: true,
        canAddPhotos: true,
        canAddComments: true,
        role: 'manager'
      };
    }

    // Créateur peut éditer/supprimer ses propres interventions
    if (isCreator) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canChangeStatus: true,
        canAssign: false,
        canAddPhotos: true,
        canAddComments: true,
        role: 'creator'
      };
    }

    // Technicien assigné peut modifier le statut et ajouter photos/commentaires
    if (isAssigned) {
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canChangeStatus: true,
        canAssign: false,
        canAddPhotos: true,
        canAddComments: true,
        role: 'assigned'
      };
    }

    // Réception peut voir et commenter
    if (user.role === 'reception') {
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canChangeStatus: false,
        canAssign: false,
        canAddPhotos: true,
        canAddComments: true,
        role: 'reception'
      };
    }

    // Par défaut: lecture seule
    return {
      canView: true,
      canEdit: false,
      canDelete: false,
      canChangeStatus: false,
      canAssign: false,
      canAddPhotos: false,
      canAddComments: true,
      role: 'viewer'
    };
  }, [user, intervention]);
};

/**
 * Hook pour vérifier si l'utilisateur peut créer des interventions
 */
export const useCanCreateIntervention = (user) => {
  return useMemo(() => {
    if (!user) return false;
    return ['superadmin', 'manager', 'reception'].includes(user.role);
  }, [user]);
};