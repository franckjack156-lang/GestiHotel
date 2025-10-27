// src/utils/initFirestore.js
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const initializeFirestoreData = async (userId, userName) => {
  console.log('🚀 Initialisation des données Firestore...');
  
  try {
    // Données de base pour les dropdowns
    const dropdownsData = {
      roomTypes: [
        { name: 'Chambre', value: 'chambre', description: 'Chambre standard' },
        { name: 'Suite', value: 'suite', description: 'Suite premium' },
        { name: 'Couloir', value: 'couloir', description: 'Couloir/Passage' },
        { name: 'Salle de bain', value: 'salle-de-bain', description: 'Salle de bain' },
        { name: 'Cuisine', value: 'cuisine', description: 'Cuisine' },
        { name: 'Salon', value: 'salon', description: 'Salon/Espace commun' },
        { name: 'Bureau', value: 'bureau', description: 'Bureau/Réception' }
      ],
      
      locations: [
        { name: 'Étage 1', value: 'etage-1' },
        { name: 'Étage 2', value: 'etage-2' },
        { name: 'Étage 3', value: 'etage-3' },
        { name: 'Rez-de-chaussée', value: 'rdc' },
        { name: 'Sous-sol', value: 'sous-sol' },
        { name: 'Extérieur', value: 'exterieur' }
      ],
      
      missionTypes: [
        { name: 'Plomberie', value: 'plomberie', description: 'Fuite, robinetterie, WC' },
        { name: 'Électricité', value: 'electricite', description: 'Prises, lumières, disjoncteur' },
        { name: 'Climatisation', value: 'climatisation', description: 'Clim, chauffage, ventilation' },
        { name: 'Menuiserie', value: 'menuiserie', description: 'Portes, fenêtres, serrures' },
        { name: 'Peinture', value: 'peinture', description: 'Retouches, murs, plafonds' },
        { name: 'Ménage', value: 'menage', description: 'Nettoyage, désinfection' },
        { name: 'Literie', value: 'literie', description: 'Matelas, draps, oreillers' },
        { name: 'Équipements', value: 'equipements', description: 'TV, minibar, coffre-fort' }
      ],
      
      creators: [
        { name: 'Réception', value: 'reception' },
        { name: 'Ménage', value: 'menage' },
        { name: 'Maintenance', value: 'maintenance' },
        { name: 'Direction', value: 'direction' }
      ],
      
      interventionTypes: [
        { name: 'Réparation', value: 'reparation', description: 'Réparation d\'équipement' },
        { name: 'Maintenance préventive', value: 'maintenance-preventive', description: 'Entretien régulier' },
        { name: 'Installation', value: 'installation', description: 'Installation nouvel équipement' },
        { name: 'Remplacement', value: 'remplacement', description: 'Remplacement d\'équipement' },
        { name: 'Urgence', value: 'urgence', description: 'Intervention urgente' },
        { name: 'Inspection', value: 'inspection', description: 'Contrôle/Vérification' }
      ],
      
      priorities: [
        { name: 'Urgent', value: 'urgent', description: 'À traiter immédiatement', color: 'red' },
        { name: 'Haute', value: 'high', description: 'À traiter rapidement', color: 'orange' },
        { name: 'Normale', value: 'normal', description: 'Priorité standard', color: 'blue' },
        { name: 'Basse', value: 'low', description: 'Peut attendre', color: 'green' }
      ],
      
      departments: [
        { name: 'Réception', value: 'reception' },
        { name: 'Maintenance', value: 'maintenance' },
        { name: 'Ménage', value: 'menage' },
        { name: 'Restaurant', value: 'restaurant' },
        { name: 'Direction', value: 'direction' }
      ]
    };

    let totalAdded = 0;
    
    // Ajouter les données par catégorie
    for (const [category, items] of Object.entries(dropdownsData)) {
      console.log(`📝 Ajout ${category}...`);
      
      for (const item of items) {
        await addDoc(collection(db, 'dropdownOptions'), {
          ...item,
          category: category,
          active: true,
          createdAt: serverTimestamp(),
          createdBy: userId,
          createdByName: userName || 'System'
        });
        totalAdded++;
      }
      
      console.log(`✅ ${category}: ${items.length} éléments ajoutés`);
    }

    // Ajouter quelques techniciens de test
    console.log('👷 Ajout de techniciens...');
    
    const technicians = [
      { name: 'Jean Dupont', specialty: 'Plomberie', phone: '06 12 34 56 78', email: 'jean.dupont@hotel.com' },
      { name: 'Marie Martin', specialty: 'Électricité', phone: '06 23 45 67 89', email: 'marie.martin@hotel.com' },
      { name: 'Pierre Durand', specialty: 'Climatisation', phone: '06 34 56 78 90', email: 'pierre.durand@hotel.com' },
      { name: 'Sophie Bernard', specialty: 'Menuiserie', phone: '06 45 67 89 01', email: 'sophie.bernard@hotel.com' }
    ];

    for (const tech of technicians) {
      await addDoc(collection(db, 'technicians'), {
        ...tech,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: userId,
        createdByName: userName || 'System'
      });
      totalAdded++;
    }
    
    console.log(`✅ Techniciens: ${technicians.length} ajoutés`);

    // Ajouter quelques fournisseurs de test
    console.log('🏭 Ajout de fournisseurs...');
    
    const suppliers = [
      { name: 'Plomberie Pro', contact: 'Jean Plombier', phone: '01 23 45 67 89', email: 'contact@plomberie-pro.fr' },
      { name: 'Électricité Services', contact: 'Marie Électricien', phone: '01 34 56 78 90', email: 'info@elec-services.fr' },
      { name: 'Clim Expert', contact: 'Pierre Climatisation', phone: '01 45 67 89 01', email: 'contact@clim-expert.fr' }
    ];

    for (const supplier of suppliers) {
      await addDoc(collection(db, 'suppliers'), {
        ...supplier,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: userId,
        createdByName: userName || 'System'
      });
      totalAdded++;
    }
    
    console.log(`✅ Fournisseurs: ${suppliers.length} ajoutés`);

    // Ajouter quelques équipements de test
    console.log('🔧 Ajout d\'équipements...');
    
    const equipment = [
      { name: 'Robinet lavabo', category: 'Plomberie', reference: 'ROB-LAV-001', unitPrice: 45 },
      { name: 'Ampoule LED E27', category: 'Électricité', reference: 'AMP-LED-E27', unitPrice: 8 },
      { name: 'Filtre climatisation', category: 'Climatisation', reference: 'FIL-CLIM-001', unitPrice: 25 },
      { name: 'Poignée de porte', category: 'Menuiserie', reference: 'POI-POR-001', unitPrice: 15 }
    ];

    for (const equip of equipment) {
      await addDoc(collection(db, 'equipment'), {
        ...equip,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: userId,
        createdByName: userName || 'System'
      });
      totalAdded++;
    }
    
    console.log(`✅ Équipements: ${equipment.length} ajoutés`);

    // Créer quelques interventions d'exemple
    console.log('📋 Ajout d\'interventions d\'exemple...');
    
    const sampleInterventions = [
      {
        roomType: 'chambre',
        location: 'Chambre 101',
        missionType: 'plomberie',
        missionSummary: 'Fuite robinet salle de bain',
        missionComment: 'Le robinet de la salle de bain fuit depuis ce matin',
        status: 'todo',
        priority: 'high',
        interventionType: 'reparation'
      },
      {
        roomType: 'chambre',
        location: 'Chambre 205',
        missionType: 'electricite',
        missionSummary: 'Lampe de chevet ne fonctionne pas',
        missionComment: 'La lampe de chevet côté gauche ne s\'allume plus',
        status: 'todo',
        priority: 'normal',
        interventionType: 'reparation'
      },
      {
        roomType: 'suite',
        location: 'Suite 301',
        missionType: 'climatisation',
        missionSummary: 'Climatisation trop bruyante',
        missionComment: 'Client se plaint du bruit de la climatisation',
        status: 'inprogress',
        priority: 'high',
        interventionType: 'maintenance-preventive'
      }
    ];

    for (const intervention of sampleInterventions) {
      await addDoc(collection(db, 'interventions'), {
        ...intervention,
        assignedTo: userId,
        assignedToName: userName || 'Technicien',
        creator: userId,
        creatorName: userName || 'System',
        photos: [],
        messages: [],
        history: [{
          status: intervention.status,
          date: new Date().toISOString(),
          by: userId,
          byName: userName || 'System',
          comment: 'Intervention créée'
        }],
        createdAt: serverTimestamp(),
        createdBy: userId,
        createdByName: userName || 'System',
        estimatedDuration: 60,
        actualDuration: 0
      });
      totalAdded++;
    }
    
    console.log(`✅ Interventions: ${sampleInterventions.length} ajoutées`);

    console.log(`\n🎉 Initialisation terminée !`);
    console.log(`📊 Total: ${totalAdded} documents créés`);
    
    return { 
      success: true, 
      message: `${totalAdded} éléments créés avec succès`,
      count: totalAdded 
    };

  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};