const fs = require('fs');
const path = require('path');

// Configuration des modules et leurs routes
const moduleRoutes = {
  auth: {
    baseUrl: '/auth',
    routes: [
      { method: 'POST', path: '/login', description: 'Connexion utilisateur', requiresAuth: false },
      { method: 'POST', path: '/refresh', description: 'Rafraîchir le token', requiresAuth: false },
      { method: 'POST', path: '/logout', description: 'Déconnexion utilisateur', requiresAuth: false }
    ]
  },
  users: {
    baseUrl: '/users',
    routes: [
      { method: 'POST', path: '', description: 'Créer un utilisateur', requiresAuth: true, roles: ['SUPERADMIN', 'CLINIC_ADMIN'] },
      { method: 'GET', path: '', description: 'Lister les utilisateurs', requiresAuth: true, roles: ['SUPERADMIN', 'CLINIC_ADMIN'] },
      { method: 'GET', path: '/:id', description: 'Obtenir un utilisateur', requiresAuth: true, roles: ['SUPERADMIN', 'CLINIC_ADMIN'] },
      { method: 'PATCH', path: '/:id', description: 'Modifier un utilisateur', requiresAuth: true, roles: ['SUPERADMIN', 'CLINIC_ADMIN'] },
      { method: 'DELETE', path: '/:id', description: 'Supprimer un utilisateur', requiresAuth: true, roles: ['SUPERADMIN', 'CLINIC_ADMIN'] }
    ]
  },
  admin: {
    baseUrl: '/admin',
    routes: [
      { method: 'GET', path: '/tenants', description: 'Lister les tenants', requiresAuth: true, roles: ['SUPERADMIN'] },
      { method: 'POST', path: '/tenants', description: 'Créer un tenant', requiresAuth: true, roles: ['SUPERADMIN'] },
      { method: 'POST', path: '/tenants/:id/deactivate', description: 'Désactiver un tenant', requiresAuth: true, roles: ['SUPERADMIN'] },
      { method: 'POST', path: '/tenants/:id/reactivate', description: 'Réactiver un tenant', requiresAuth: true, roles: ['SUPERADMIN'] }
    ]
  },
  patients: {
    baseUrl: '/patients',
    routes: [
      { method: 'POST', path: '', description: 'Créer un patient', requiresAuth: true, roles: ['CLINIC_ADMIN', 'EMPLOYEE'] },
      { method: 'GET', path: '', description: 'Lister les patients', requiresAuth: true, roles: ['CLINIC_ADMIN', 'EMPLOYEE'] },
      { method: 'GET', path: '/search', description: 'Rechercher des patients', requiresAuth: true, roles: ['CLINIC_ADMIN', 'EMPLOYEE'] },
      { method: 'GET', path: '/:id', description: 'Obtenir un patient', requiresAuth: true, roles: ['CLINIC_ADMIN', 'EMPLOYEE'] },
      { method: 'PUT', path: '/:id', description: 'Modifier un patient', requiresAuth: true, roles: ['CLINIC_ADMIN', 'EMPLOYEE'] },
      { method: 'DELETE', path: '/:id', description: 'Archiver un patient', requiresAuth: true, roles: ['CLINIC_ADMIN'] }
    ]
  },
  'medical-history': {
    baseUrl: '/patients/:patientId/medical-history',
    routes: [
      { method: 'POST', path: '', description: 'Ajouter un élément d\'historique médical', requiresAuth: true },
      { method: 'GET', path: '', description: 'Obtenir l\'historique médical', requiresAuth: true },
      { method: 'PUT', path: '/:id', description: 'Modifier un élément d\'historique', requiresAuth: true },
      { method: 'DELETE', path: '/:id', description: 'Supprimer un élément d\'historique', requiresAuth: true }
    ]
  },
  documents: {
    baseUrl: '/patients/:patientId/documents',
    routes: [
      { method: 'POST', path: '/upload', description: 'Télécharger un document', requiresAuth: true },
      { method: 'GET', path: '', description: 'Lister les documents', requiresAuth: true },
      { method: 'GET', path: '/:id', description: 'Télécharger un document', requiresAuth: true },
      { method: 'DELETE', path: '/:id', description: 'Supprimer un document', requiresAuth: true }
    ]
  },
  appointments: {
    baseUrl: '/appointments',
    routes: [
      { method: 'POST', path: '', description: 'Créer un rendez-vous', requiresAuth: true },
      { method: 'PUT', path: '/reschedule', description: 'Reprogrammer un rendez-vous', requiresAuth: true },
      { method: 'POST', path: '/:id/cancel', description: 'Annuler un rendez-vous', requiresAuth: true },
      { method: 'GET', path: '/practitioner/:practitionerId', description: 'Agenda du praticien', requiresAuth: true }
    ]
  },
  practitioners: {
    baseUrl: '/practitioners',
    routes: [
      { method: 'GET', path: '', description: 'Lister les praticiens', requiresAuth: true }
    ]
  },
  'wait-queue': {
    baseUrl: '/wait-queue',
    routes: [
      { method: 'POST', path: '/add', description: 'Ajouter à la file d\'attente', requiresAuth: true },
      { method: 'GET', path: '', description: 'Obtenir la file d\'attente', requiresAuth: true },
      { method: 'POST', path: '/serve/:id', description: 'Servir le patient suivant', requiresAuth: true }
    ]
  },
  encounters: {
    baseUrl: '/encounters',
    routes: [
      { method: 'POST', path: '', description: 'Créer une consultation', requiresAuth: true },
      { method: 'GET', path: '/patient/:patientId', description: 'Consultations du patient', requiresAuth: true },
      { method: 'GET', path: '/:id', description: 'Obtenir une consultation', requiresAuth: true },
      { method: 'PUT', path: '/:id', description: 'Modifier une consultation', requiresAuth: true },
      { method: 'POST', path: '/:id/lock', description: 'Verrouiller une consultation', requiresAuth: true }
    ]
  },
  prescriptions: {
    baseUrl: '/prescriptions',
    routes: [
      { method: 'POST', path: '', description: 'Créer une prescription', requiresAuth: true },
      { method: 'GET', path: '/encounter/:encounterId', description: 'Prescriptions de la consultation', requiresAuth: true },
      { method: 'PUT', path: '/:id', description: 'Modifier une prescription', requiresAuth: true }
    ]
  },
  'lab-results': {
    baseUrl: '/lab-results',
    routes: [
      { method: 'POST', path: '', description: 'Créer un résultat de laboratoire', requiresAuth: true },
      { method: 'GET', path: '/encounter/:encounterId', description: 'Résultats de la consultation', requiresAuth: true },
      { method: 'PUT', path: '/:id', description: 'Modifier un résultat', requiresAuth: true }
    ]
  },
  invoices: {
    baseUrl: '/invoices',
    routes: [
      { method: 'POST', path: '', description: 'Créer une facture', requiresAuth: true },
      { method: 'GET', path: '', description: 'Lister les factures', requiresAuth: true },
      { method: 'GET', path: '/:id', description: 'Obtenir une facture', requiresAuth: true },
      { method: 'PUT', path: '/:id', description: 'Modifier une facture', requiresAuth: true },
      { method: 'POST', path: '/:id/send', description: 'Envoyer une facture', requiresAuth: true },
      { method: 'GET', path: '/:id/pdf', description: 'Télécharger PDF facture', requiresAuth: true }
    ]
  },
  tariffs: {
    baseUrl: '/tariffs',
    routes: [
      { method: 'GET', path: '', description: 'Lister les tarifs', requiresAuth: true },
      { method: 'POST', path: '', description: 'Créer un tarif', requiresAuth: true },
      { method: 'PUT', path: '/:code', description: 'Modifier un tarif', requiresAuth: true },
      { method: 'DELETE', path: '/:code', description: 'Supprimer un tarif', requiresAuth: true }
    ]
  },
  payments: {
    baseUrl: '/payments',
    routes: [
      { method: 'POST', path: '', description: 'Enregistrer un paiement', requiresAuth: true }
    ]
  },
  inventory: {
    baseUrl: '/inventory',
    routes: [
      { method: 'GET', path: '/items', description: 'Lister les articles', requiresAuth: true },
      { method: 'POST', path: '/items', description: 'Créer un article', requiresAuth: true },
      { method: 'GET', path: '/items/:id', description: 'Obtenir un article', requiresAuth: true },
      { method: 'PUT', path: '/items/:id', description: 'Modifier un article', requiresAuth: true },
      { method: 'POST', path: '/movements', description: 'Enregistrer un mouvement', requiresAuth: true },
      { method: 'GET', path: '/movements', description: 'Lister les mouvements', requiresAuth: true }
    ]
  },
  reports: {
    baseUrl: '/reports',
    routes: [
      { method: 'GET', path: '/dashboard', description: 'Tableau de bord', requiresAuth: true },
      { method: 'GET', path: '/patients', description: 'Rapport patients', requiresAuth: true },
      { method: 'GET', path: '/appointments', description: 'Rapport rendez-vous', requiresAuth: true },
      { method: 'GET', path: '/revenue', description: 'Rapport revenus', requiresAuth: true },
      { method: 'GET', path: '/inventory', description: 'Rapport inventaire', requiresAuth: true },
      { method: 'POST', path: '/export', description: 'Exporter un rapport', requiresAuth: true }
    ]
  }
};

// Exemples de données pour les tests
const sampleData = {
  login: {
    email: "admin@example.com",
    password: "password123"
  },
  createUser: {
    email: "user@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    role: "EMPLOYEE",
    tenantId: "{{tenantId}}"
  },
  createTenant: {
    name: "Clinique Test",
    slug: "clinique-test",
    adminEmail: "admin@clinique-test.com",
    adminPassword: "password123",
    adminFirstName: "Admin",
    adminLastName: "Clinique"
  },
  createPatient: {
    firstName: "Jean",
    lastName: "Dupont",
    dateOfBirth: "1980-01-15",
    gender: "M",
    phone: "+33123456789",
    email: "jean.dupont@email.com",
    address: {
      street: "123 Rue de la Paix",
      city: "Paris",
      postalCode: "75001",
      country: "France"
    },
    emergencyContact: {
      name: "Marie Dupont",
      phone: "+33987654321",
      relationship: "Épouse"
    }
  },
  createAppointment: {
    patientId: "{{patientId}}",
    practitionerId: "{{practitionerId}}",
    startAt: "2024-01-15T09:00:00Z",
    endAt: "2024-01-15T09:30:00Z",
    reason: "Consultation de routine",
    urgency: "ROUTINE"
  },
  createEncounter: {
    patientId: "{{patientId}}",
    practitionerId: "{{practitionerId}}",
    startAt: "2024-01-15T09:00:00Z",
    motive: "Consultation de routine",
    exam: "Examen clinique normal",
    diagnosis: "Bonne santé générale",
    icd10Codes: ["Z00.0"]
  },
  createInvoice: {
    patientId: "{{patientId}}",
    lines: [
      {
        tariffCode: "CONS",
        quantity: 1,
        unitPrice: 50.00,
        description: "Consultation générale"
      }
    ],
    billingAddress: {
      name: "Jean Dupont",
      street: "123 Rue de la Paix",
      city: "Paris",
      postalCode: "75001",
      country: "France"
    }
  }
};

// Fonction pour générer une collection Postman
function generatePostmanCollection(moduleName, moduleConfig) {
  const collection = {
    info: {
      _postman_id: require('crypto').randomUUID(),
      name: `Module ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} - Medical`,
      description: `Collection complète pour le module ${moduleName} du système médical`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: []
  };

  const folderName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  const folder = {
    name: folderName,
    item: []
  };

  moduleConfig.routes.forEach(route => {
    const request = generateRequest(route, moduleConfig.baseUrl, moduleName);
    folder.item.push(request);
  });

  collection.item.push(folder);
  return collection;
}

// Fonction pour générer une requête Postman
function generateRequest(route, baseUrl, moduleName) {
  const request = {
    name: route.description,
    event: [],
    request: {
      method: route.method,
      header: [
        {
          key: "Content-Type",
          value: "application/json"
        }
      ],
      url: {
        raw: `{{baseUrl}}${baseUrl}${route.path}`,
        host: ["{{baseUrl}}"],
        path: (baseUrl + route.path).split('/').filter(p => p)
      }
    },
    response: []
  };

  // Ajouter l'authentification si nécessaire
  if (route.requiresAuth) {
    request.request.header.push({
      key: "Authorization",
      value: "Bearer {{accessToken}}"
    });
  }

  // Ajouter le corps de la requête pour les méthodes POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
    const bodyData = getBodyData(route, moduleName);
    if (bodyData) {
      request.request.body = {
        mode: "raw",
        raw: JSON.stringify(bodyData, null, 2)
      };
    }
  }

  // Ajouter des scripts de test pour certaines routes
  if (route.path === '/login' && moduleName === 'auth') {
    request.event.push({
      listen: "test",
      script: {
        exec: [
          "var jsonData = pm.response.json();",
          "if (jsonData.accessToken) {",
          "    pm.environment.set('accessToken', jsonData.accessToken);",
          "}",
          "if (jsonData.refreshToken) {",
          "    pm.environment.set('refreshToken', jsonData.refreshToken);",
          "}",
          "if (jsonData.user && jsonData.user.tenantId) {",
          "    pm.environment.set('tenantId', jsonData.user.tenantId);",
          "}"
        ],
        type: "text/javascript"
      }
    });
  }

  // Scripts pour sauvegarder les IDs créés
  if (route.method === 'POST' && !route.path.includes(':')) {
    const idField = getIdField(moduleName);
    if (idField) {
      request.event.push({
        listen: "test",
        script: {
          exec: [
            "var jsonData = pm.response.json();",
            `if (jsonData.${idField.property}) {`,
            `    pm.environment.set('${idField.variable}', jsonData.${idField.property});`,
            "}"
          ],
          type: "text/javascript"
        }
      });
    }
  }

  return request;
}

// Fonction pour obtenir les données du corps de la requête
function getBodyData(route, moduleName) {
  const routeKey = `${moduleName}${route.path.replace(/[/:]/g, '')}`;
  
  if (route.path === '/login') return sampleData.login;
  if (route.path === '' && route.method === 'POST') {
    switch (moduleName) {
      case 'users': return sampleData.createUser;
      case 'patients': return sampleData.createPatient;
      case 'appointments': return sampleData.createAppointment;
      case 'encounters': return sampleData.createEncounter;
      case 'invoices': return sampleData.createInvoice;
      case 'admin' && route.path === '/tenants': return sampleData.createTenant;
    }
  }
  
  return null;
}

// Fonction pour obtenir le champ ID à sauvegarder
function getIdField(moduleName) {
  const idMappings = {
    'patients': { property: 'id', variable: 'patientId' },
    'users': { property: 'id', variable: 'userId' },
    'appointments': { property: 'id', variable: 'appointmentId' },
    'encounters': { property: 'id', variable: 'encounterId' },
    'invoices': { property: 'id', variable: 'invoiceId' },
    'admin': { property: 'id', variable: 'tenantId' }
  };
  
  return idMappings[moduleName];
}

// Générer toutes les collections
function generateAllCollections() {
  const outputDir = './generated-collections';
  
  // Créer le dossier de sortie s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Générer chaque collection
  Object.entries(moduleRoutes).forEach(([moduleName, moduleConfig]) => {
    const collection = generatePostmanCollection(moduleName, moduleConfig);
    const filename = `module-${moduleName}.postman_collection.json`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(collection, null, 2));
    console.log(`✅ Collection générée: ${filename}`);
  });

  // Générer la collection principale
  generateMainCollection(outputDir);
  
  // Générer le script d'import
  generateImportScript(outputDir);
  
  console.log(`\n🎉 Toutes les collections ont été générées dans ${outputDir}`);
}

// Générer la collection principale
function generateMainCollection(outputDir) {
  const mainCollection = {
    info: {
      _postman_id: require('crypto').randomUUID(),
      name: "Medical System - Complete API",
      description: "Collection principale regroupant toutes les APIs du système médical",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: [
      {
        name: "🔐 Authentication",
        description: "Routes d'authentification et gestion des utilisateurs",
        item: []
      },
      {
        name: "👥 Patients",
        description: "Gestion des patients et de leurs données",
        item: []
      },
      {
        name: "📅 Scheduling",
        description: "Gestion des rendez-vous et planning",
        item: []
      },
      {
        name: "🏥 EHR (Electronic Health Records)",
        description: "Dossiers médicaux électroniques",
        item: []
      },
      {
        name: "💰 Billing",
        description: "Facturation et paiements",
        item: []
      },
      {
        name: "📦 Inventory",
        description: "Gestion des stocks et inventaire",
        item: []
      },
      {
        name: "📊 Analytics",
        description: "Rapports et analyses",
        item: []
      }
    ]
  };

  const filename = 'Medical-Complete-API.postman_collection.json';
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(mainCollection, null, 2));
  console.log(`✅ Collection principale générée: ${filename}`);
}

// Générer le script d'import
function generateImportScript(outputDir) {
  const script = `#!/bin/bash

# Script d'import automatique des collections Postman
# Assurez-vous d'avoir Newman installé: npm install -g newman

echo "🚀 Import des collections Postman pour le système médical"
echo "=================================================="

# Vérifier si Newman est installé
if ! command -v newman &> /dev/null; then
    echo "❌ Newman n'est pas installé. Installez-le avec: npm install -g newman"
    exit 1
fi

# Importer l'environnement
echo "📁 Import de l'environnement..."
cp ../Medical-Environment.json ./

# Lister les collections générées
echo "📋 Collections disponibles:"
ls -la *.postman_collection.json

echo ""
echo "✅ Collections prêtes à être importées dans Postman"
echo "💡 Vous pouvez aussi les tester avec Newman:"
echo "   newman run module-auth.postman_collection.json -e Medical-Environment.json"
echo ""
echo "🔧 Pour importer dans Postman:"
echo "   1. Ouvrez Postman"
echo "   2. Cliquez sur 'Import'"
echo "   3. Sélectionnez les fichiers .json"
echo "   4. Importez l'environnement Medical-Environment.json"
`;

  const scriptPath = path.join(outputDir, 'import-collections.sh');
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  console.log(`✅ Script d'import généré: import-collections.sh`);
}

// Exécuter la génération
if (require.main === module) {
  generateAllCollections();
}

module.exports = {
  generatePostmanCollection,
  generateAllCollections,
  moduleRoutes,
  sampleData
}; 