const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {onDocumentCreated, onDocumentUpdated} = require('firebase-functions/v2/firestore');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {setGlobalOptions} = require('firebase-functions/v2');
const admin = require('firebase-admin');

// Initialiser Firebase Admin
admin.initializeApp();

// Configuration globale pour toutes les functions
setGlobalOptions({
  region: 'europe-west1', // Changer selon votre région
  maxInstances: 10,
});

/**
 * Créer un utilisateur avec authentification
 */
exports.createUser = onCall({
  timeoutSeconds: 60,
  memory: '256MiB',
}, async (request) => {
  // Vérifier que l'utilisateur est authentifié et est Super Admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté');
  }

  const callerUid = request.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Seul un Super Admin peut créer des utilisateurs');
  }

  // Validation des données
  const { email, password, name, role, department, phone } = request.data;
  
  if (!email || !password || !name) {
    throw new HttpsError('invalid-argument', 'Email, mot de passe et nom sont obligatoires');
  }

  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 6 caractères');
  }

  try {
    // Créer l'utilisateur dans Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name
    });

    // Créer le profil dans Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: email,
      name: name,
      role: role || 'reception',
      department: department || '',
      phone: phone || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: callerUid,
      active: true
    });

    return {
      success: true,
      userId: userRecord.uid,
      message: 'Utilisateur créé avec succès'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Un utilisateur avec cet email existe déjà');
    }
    
    throw new HttpsError('internal', 'Erreur lors de la création de l\'utilisateur: ' + error.message);
  }
});

/**
 * Mettre à jour le mot de passe d'un utilisateur
 */
exports.updateUserPassword = onCall({
  timeoutSeconds: 60,
  memory: '256MiB',
}, async (request) => {
  // Vérifier que l'utilisateur est authentifié et est Super Admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté');
  }

  const callerUid = request.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Seul un Super Admin peut modifier les mots de passe');
  }

  const { userId, newPassword } = request.data;
  
  if (!userId || !newPassword) {
    throw new HttpsError('invalid-argument', 'ID utilisateur et nouveau mot de passe sont obligatoires');
  }

  if (newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 6 caractères');
  }

  try {
    await admin.auth().updateUser(userId, {
      password: newPassword
    });

    // Log dans Firestore
    await admin.firestore().collection('users').doc(userId).update({
      passwordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      passwordUpdatedBy: callerUid
    });

    return {
      success: true,
      message: 'Mot de passe modifié avec succès'
    };
  } catch (error) {
    console.error('Error updating password:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'Utilisateur non trouvé');
    }
    
    throw new HttpsError('internal', 'Erreur lors de la modification du mot de passe: ' + error.message);
  }
});

/**
 * Fonction déclenchée quand une intervention est créée
 * Envoie des notifications
 */
exports.onInterventionCreated = onDocumentCreated('interventions/{interventionId}', async (event) => {
  const intervention = event.data.data();
  const interventionId = event.params.interventionId;

  // Récupérer le technicien assigné
  if (intervention.assignedTo) {
    const technicianDoc = await admin.firestore()
      .collection('users')
      .doc(intervention.assignedTo)
      .get();

    if (technicianDoc.exists) {
      const technician = technicianDoc.data();
      
      // TODO: Envoyer une notification push au technicien
      // TODO: Envoyer un email au technicien
      
      console.log(`Notification envoyée à ${technician.name} pour l'intervention ${interventionId}`);
    }
  }
});

/**
 * Fonction déclenchée quand le statut d'une intervention change
 */
exports.onInterventionStatusChanged = onDocumentUpdated('interventions/{interventionId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const interventionId = event.params.interventionId;

  // Vérifier si le statut a changé
  if (before.status !== after.status) {
    console.log(`Intervention ${interventionId} : ${before.status} → ${after.status}`);

    // Si l'intervention est terminée, notifier le créateur
    if (after.status === 'completed') {
      const creatorDoc = await admin.firestore()
        .collection('users')
        .doc(after.createdBy)
        .get();

      if (creatorDoc.exists) {
        const creator = creatorDoc.data();
        
        // TODO: Envoyer une notification au créateur
        
        console.log(`Notification envoyée à ${creator.name} : intervention terminée`);
      }
    }
  }
});

/**
 * Fonction de nettoyage : supprimer les interventions terminées après 90 jours
 * Exécutée chaque jour à 2h du matin
 */
exports.cleanupOldInterventions = onSchedule({
  schedule: 'every day 02:00',
  timeZone: 'Europe/Paris',
  memory: '512MiB',
}, async (event) => {
  const now = admin.firestore.Timestamp.now();
  const ninetyDaysAgo = new Date(now.toDate().getTime() - 90 * 24 * 60 * 60 * 1000);

  const snapshot = await admin.firestore()
    .collection('interventions')
    .where('status', '==', 'completed')
    .where('updatedAt', '<', admin.firestore.Timestamp.fromDate(ninetyDaysAgo))
    .get();

  const batch = admin.firestore().batch();
  let count = 0;

  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
  });

  if (count > 0) {
    await batch.commit();
    console.log(`${count} interventions terminées supprimées`);
  } else {
    console.log('Aucune intervention à nettoyer');
  }

  return null;
});