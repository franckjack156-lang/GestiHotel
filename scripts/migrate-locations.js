import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch,
  doc,
  deleteField
} from 'firebase/firestore';

// Charger les variables d'environnement depuis .env
config();

console.log('╔══════════════════════════════════════════════════╗');
console.log('║   MIGRATION LOCATIONS: STRING → ARRAY           ║');
console.log('╚══════════════════════════════════════════════════╝\n');

// Configuration Firebase depuis les variables d'environnement
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Vérifier que la configuration est complète
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Configuration Firebase incomplète !');
  console.error('\nVérifiez que votre fichier .env contient :');
  console.error('  - VITE_FIREBASE_API_KEY');
  console.error('  - VITE_FIREBASE_AUTH_DOMAIN');
  console.error('  - VITE_FIREBASE_PROJECT_ID');
  console.error('  - VITE_FIREBASE_STORAGE_BUCKET');
  console.error('  - VITE_FIREBASE_MESSAGING_SENDER_ID');
  console.error('  - VITE_FIREBASE_APP_ID');
  console.error('\nConfiguration actuelle :');
  console.error('  apiKey:', firebaseConfig.apiKey ? '✅ Définie' : '❌ Manquante');
  console.error('  projectId:', firebaseConfig.projectId ? '✅ Défini' : '❌ Manquant');
  process.exit(1);
}

console.log('✅ Configuration Firebase chargée');
console.log(`   Project ID: ${firebaseConfig.projectId}\n`);

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Vérifier l'état de la migration
 */
async function checkMigrationStatus() {
  console.log('🔍 Vérification de l\'état de la migration...\n');
  
  try {
    const interventionsRef = collection(db, 'interventions');
    const snapshot = await getDocs(interventionsRef);
    
    let withOldFormat = 0;      // location seulement
    let withNewFormat = 0;      // locations array
    let withBothFormats = 0;    // les deux
    let withNoLocation = 0;     // aucun
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      
      const hasOld = !!data.location;
      const hasNew = data.locations && Array.isArray(data.locations) && data.locations.length > 0;
      
      if (hasOld && hasNew) {
        withBothFormats++;
      } else if (hasNew) {
        withNewFormat++;
      } else if (hasOld) {
        withOldFormat++;
      } else {
        withNoLocation++;
      }
    });
    
    console.log('📊 ÉTAT ACTUEL:');
    console.log(`   🟢 Nouveau format uniquement (locations[]): ${withNewFormat}`);
    console.log(`   🔴 Ancien format uniquement (location): ${withOldFormat}`);
    console.log(`   🟡 Les deux formats: ${withBothFormats}`);
    console.log(`   ⚪ Aucune location: ${withNoLocation}`);
    console.log(`   📦 Total: ${snapshot.size}\n`);
    
    const needsMigration = withOldFormat > 0 || withBothFormats > 0;
    
    if (needsMigration) {
      console.log('⚠️  MIGRATION NÉCESSAIRE\n');
      console.log(`   → ${withOldFormat} interventions à migrer`);
      if (withBothFormats > 0) {
        console.log(`   → ${withBothFormats} interventions avec les deux formats\n`);
      }
    } else {
      console.log('✅ MIGRATION COMPLÈTE - Toutes les interventions utilisent le nouveau format\n');
    }
    
    return {
      withOldFormat,
      withNewFormat,
      withBothFormats,
      withNoLocation,
      total: snapshot.size,
      needsMigration
    };
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n💡 Solution: Vérifiez vos règles Firestore ou votre authentification');
    }
    
    throw error;
  }
}

/**
 * Migration des interventions
 */
async function migrateInterventionsToArrayLocations() {
  console.log('🔄 Démarrage de la migration des locations...\n');
  
  try {
    const interventionsRef = collection(db, 'interventions');
    const snapshot = await getDocs(interventionsRef);
    
    console.log(`📊 ${snapshot.size} interventions à traiter\n`);
    
    if (snapshot.size === 0) {
      console.log('⚠️  Aucune intervention trouvée dans la base de données');
      return {
        success: true,
        migrated: 0,
        skipped: 0,
        errors: 0,
        total: 0
      };
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    const batchSize = 450;
    let batch = writeBatch(db);
    let operationsInBatch = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const interventionId = docSnapshot.id;
      
      // CAS 1 : Déjà migré
      if (data.locations && Array.isArray(data.locations) && data.locations.length > 0) {
        if (skippedCount < 5) { // Afficher seulement les 5 premiers
          console.log(`⏭️  ${interventionId}: Déjà migré (locations: ${data.locations.length})`);
        }
        skippedCount++;
        continue;
      }
      
      // CAS 2 : Ancien format (location existe mais pas locations)
      if (data.location && (!data.locations || data.locations.length === 0)) {
        try {
          const updateData = {
            locations: [data.location]
          };
          
          batch.update(doc(db, 'interventions', interventionId), updateData);
          operationsInBatch++;
          migratedCount++;
          
          console.log(`✅ ${interventionId}: "${data.location}" → ["${data.location}"]`);
          
          if (operationsInBatch >= batchSize) {
            await batch.commit();
            console.log(`💾 Batch de ${operationsInBatch} interventions committées\n`);
            batch = writeBatch(db);
            operationsInBatch = 0;
          }
        } catch (error) {
          console.error(`❌ Erreur pour ${interventionId}:`, error.message);
          errorCount++;
        }
      } 
      // CAS 3 : Aucune location
      else {
        if (skippedCount < 5) {
          console.warn(`⚠️  ${interventionId}: Aucune location définie`);
        }
        skippedCount++;
      }
    }
    
    if (skippedCount > 5) {
      console.log(`⏭️  ... et ${skippedCount - 5} autres interventions déjà OK\n`);
    }
    
    // Commit final
    if (operationsInBatch > 0) {
      await batch.commit();
      console.log(`💾 Batch final de ${operationsInBatch} interventions committées\n`);
    }
    
    // Résumé
    console.log('📊 RÉSUMÉ DE LA MIGRATION:');
    console.log(`   ✅ Migrées: ${migratedCount}`);
    console.log(`   ⏭️  Ignorées (déjà OK): ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📦 Total traité: ${snapshot.size}\n`);
    
    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: snapshot.size
    };
    
  } catch (error) {
    console.error('❌ Erreur fatale lors de la migration:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Nettoyage des anciens champs
 */
async function cleanupOldLocationField() {
  console.log('🧹 Nettoyage des anciens champs location...\n');
  
  try {
    const interventionsRef = collection(db, 'interventions');
    const snapshot = await getDocs(interventionsRef);
    
    let cleanedCount = 0;
    let batch = writeBatch(db);
    let operationsInBatch = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      if (data.location && data.locations && Array.isArray(data.locations)) {
        batch.update(doc(db, 'interventions', docSnapshot.id), {
          location: deleteField()
        });
        operationsInBatch++;
        cleanedCount++;
        
        if (operationsInBatch >= 450) {
          await batch.commit();
          console.log(`💾 Batch de ${operationsInBatch} nettoyées`);
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      }
    }
    
    if (operationsInBatch > 0) {
      await batch.commit();
    }
    
    console.log(`✅ ${cleanedCount} champs location supprimés\n`);
    
    return { success: true, cleaned: cleanedCount };
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error.message);
    return { success: false, error: error.message };
  }
}

// ========== EXÉCUTION ==========
async function main() {
  try {
    // Récupérer les arguments
    const args = process.argv.slice(2);
    const checkOnly = args.includes('--check-only');
    const cleanup = args.includes('--cleanup');
    
    // Vérifier l'état actuel
    const status = await checkMigrationStatus();
    
    // Mode vérification uniquement
    if (checkOnly) {
      console.log('✅ Vérification terminée (mode --check-only)');
      process.exit(0);
    }
    
    // Mode nettoyage
    if (cleanup) {
      if (status.withBothFormats > 0) {
        console.log('⚠️  Mode nettoyage: Suppression des anciens champs location\n');
        const result = await cleanupOldLocationField();
        
        if (result.success) {
          console.log('✅ Nettoyage terminé avec succès');
          await checkMigrationStatus();
        } else {
          console.error('❌ Échec du nettoyage');
        }
        process.exit(result.success ? 0 : 1);
      } else {
        console.log('ℹ️  Aucun champ location à nettoyer');
        process.exit(0);
      }
    }
    
    // Si pas besoin de migration
    if (!status.needsMigration) {
      console.log('ℹ️  Aucune migration nécessaire');
      process.exit(0);
    }
    
    // Confirmation avant migration
    console.log('⚠️  ATTENTION: Cette migration va modifier votre base de données Firestore.');
    console.log('   Assurez-vous d\'avoir une sauvegarde avant de continuer.\n');
    
    // Exécuter la migration
    const result = await migrateInterventionsToArrayLocations();
    
    if (result.success) {
      console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS!\n');
      
      // Vérifier à nouveau
      await checkMigrationStatus();
      
      if (result.migrated > 0) {
        console.log('💡 Prochaine étape: Testez votre application');
        console.log('   Si tout fonctionne, exécutez:');
        console.log('   node scripts/migrate-locations.js --cleanup\n');
      }
    } else {
      console.log('❌ ÉCHEC DE LA MIGRATION');
      console.error(result.error);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n💡 Solutions possibles:');
      console.error('   1. Vérifiez vos règles Firestore');
      console.error('   2. Assurez-vous d\'être authentifié');
      console.error('   3. Vérifiez que le projet Firebase est correct');
    }
    
    process.exit(1);
  }
}

// Lancer
main();


