import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Configuration Firebase
const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateDropdownOptions() {
  console.log('🔄 Migration des listes déroulantes...');
  
  // Mapper l'ancien système vers le nouveau
  const categoriesToMigrate = {
    'types': 'roomTypes',
    'batiments': 'locations',
    'urgences': 'priorities'
    // Ajouter toutes vos catégories
  };
  
  for (const [oldCategory, newCategory] of Object.entries(categoriesToMigrate)) {
    // Lire depuis localStorage ou ancienne structure
    const oldData = JSON.parse(localStorage.getItem(`dropdowns_${oldCategory}`) || '[]');
    
    for (const item of oldData) {
      await addDoc(collection(db, 'dropdownOptions'), {
        category: newCategory,
        name: item,
        value: item.toLowerCase().replace(/\s+/g, '-'),
        label: item,
        active: true,
        createdAt: serverTimestamp(),
        description: ''
      });
      
      console.log(`✅ Migré: ${item} (${newCategory})`);
    }
  }
}

async function migrateAdminData() {
  console.log('🔄 Migration des données admin...');
  
  // Migrer les techniciens
  const techniciansSnap = await getDocs(collection(db, 'technicians'));
  for (const doc of techniciansSnap.docs) {
    const data = doc.data();
    await addDoc(collection(db, 'adminData'), {
      type: 'technicians',
      ...data,
      active: data.active !== false
    });
    console.log(`✅ Migré technicien: ${data.name}`);
  }
  
  // Migrer les fournisseurs
  const suppliersSnap = await getDocs(collection(db, 'suppliers'));
  for (const doc of suppliersSnap.docs) {
    const data = doc.data();
    await addDoc(collection(db, 'adminData'), {
      type: 'suppliers',
      ...data,
      active: data.active !== false
    });
    console.log(`✅ Migré fournisseur: ${data.name}`);
  }
  
  // Migrer les équipements
  const equipmentSnap = await getDocs(collection(db, 'equipment'));
  for (const doc of equipmentSnap.docs) {
    const data = doc.data();
    await addDoc(collection(db, 'adminData'), {
      type: 'equipment',
      ...data,
      active: data.active !== false
    });
    console.log(`✅ Migré équipement: ${data.name}`);
  }
}

// Exécuter la migration
async function runMigration() {
  try {
    await migrateDropdownOptions();
    await migrateAdminData();
    console.log('✅ Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  }
}

runMigration();