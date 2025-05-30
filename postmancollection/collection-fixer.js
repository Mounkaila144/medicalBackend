const fs = require('fs');
const path = require('path');

// Fonction pour lire et parser une collection JSON
function readCollection(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture de ${filePath}:`, error.message);
    return null;
  }
}

// Fonction pour sauvegarder une collection
function saveCollection(filePath, collection) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour créer une sauvegarde
function createBackup(filePath) {
  const backupPath = filePath.replace('.json', '.backup.json');
  try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`💾 Sauvegarde créée: ${path.basename(backupPath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la sauvegarde:`, error.message);
    return false;
  }
}

// Fonction pour normaliser les variables d'environnement
function normalizeEnvironmentVariables(collection) {
  const variableMapping = {
    '{{id}}': '{{encounterId}}',
    '{{tenantId}}': '{{tenantId}}', // Garder tel quel
    '{{reportId}}': '{{reportId}}' // Garder tel quel
  };

  function updateUrl(url) {
    if (typeof url === 'string') {
      Object.entries(variableMapping).forEach(([old, newVar]) => {
        if (old !== newVar) {
          url = url.replace(new RegExp(old.replace(/[{}]/g, '\\$&'), 'g'), newVar);
        }
      });
      return url;
    } else if (url && url.raw) {
      Object.entries(variableMapping).forEach(([old, newVar]) => {
        if (old !== newVar) {
          url.raw = url.raw.replace(new RegExp(old.replace(/[{}]/g, '\\$&'), 'g'), newVar);
        }
      });
    }
    return url;
  }

  function traverseItems(items) {
    items.forEach(item => {
      if (item.item) {
        traverseItems(item.item);
      } else if (item.request && item.request.url) {
        item.request.url = updateUrl(item.request.url);
      }
    });
  }

  if (collection.item) {
    traverseItems(collection.item);
  }

  return collection;
}

// Fonction pour ajouter l'authentification manquante
function addMissingAuthentication(collection) {
  function traverseItems(items) {
    items.forEach(item => {
      if (item.item) {
        traverseItems(item.item);
      } else if (item.request) {
        const url = item.request.url;
        let urlString = '';
        
        if (typeof url === 'string') {
          urlString = url;
        } else if (url && url.raw) {
          urlString = url.raw;
        }

        // Vérifier si c'est une route protégée
        const isProtectedRoute = urlString.includes('/admin') || 
                                urlString.includes('/users') ||
                                urlString.includes('/patients') ||
                                urlString.includes('/appointments') ||
                                urlString.includes('/encounters') ||
                                urlString.includes('/invoices') ||
                                urlString.includes('/reports');

        const isPublicRoute = urlString.includes('/auth/login') ||
                             urlString.includes('/auth/refresh') ||
                             urlString.includes('/auth/logout');

        if (isProtectedRoute && !isPublicRoute) {
          // Vérifier si l'authentification existe déjà
          const hasAuth = item.request.header?.some(h => h.key === 'Authorization');
          
          if (!hasAuth) {
            if (!item.request.header) {
              item.request.header = [];
            }
            
            item.request.header.push({
              key: "Authorization",
              value: "Bearer {{accessToken}}",
              type: "text"
            });
          }
        }
      }
    });
  }

  if (collection.item) {
    traverseItems(collection.item);
  }

  return collection;
}

// Fonction pour ajouter des corps de requête manquants
function addMissingRequestBodies(collection) {
  const sampleBodies = {
    'Create Tenant': {
      name: "Clinique Test",
      slug: "clinique-test",
      adminEmail: "admin@clinique-test.com",
      adminPassword: "password123",
      adminFirstName: "Admin",
      adminLastName: "Clinique"
    },
    'Create User': {
      email: "user@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "EMPLOYEE",
      tenantId: "{{tenantId}}"
    },
    'Create Patient': {
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
      }
    },
    'Update Patient': {
      phone: "+33123456789",
      email: "jean.dupont.updated@email.com"
    },
    'Créer une prescription': {
      encounterId: "{{encounterId}}",
      medication: "Paracétamol",
      dosage: "500mg",
      frequency: "3 fois par jour",
      duration: "7 jours"
    }
  };

  function traverseItems(items) {
    items.forEach(item => {
      if (item.item) {
        traverseItems(item.item);
      } else if (item.request) {
        const method = item.request.method;
        const needsBody = ['POST', 'PUT', 'PATCH'].includes(method);
        
        if (needsBody && !item.request.body && sampleBodies[item.name]) {
          item.request.body = {
            mode: "raw",
            raw: JSON.stringify(sampleBodies[item.name], null, 2),
            options: {
              raw: {
                language: "json"
              }
            }
          };
          
          // S'assurer que le Content-Type est défini
          if (!item.request.header) {
            item.request.header = [];
          }
          
          const hasContentType = item.request.header.some(h => h.key === 'Content-Type');
          if (!hasContentType) {
            item.request.header.push({
              key: "Content-Type",
              value: "application/json",
              type: "text"
            });
          }
        }
      }
    });
  }

  if (collection.item) {
    traverseItems(collection.item);
  }

  return collection;
}

// Fonction pour ajouter des scripts de test
function addTestScripts(collection) {
  function traverseItems(items) {
    items.forEach(item => {
      if (item.item) {
        traverseItems(item.item);
      } else if (item.request) {
        // Ajouter des scripts pour sauvegarder les IDs
        if (item.request.method === 'POST' && !item.event) {
          item.event = [];
          
          if (item.name.includes('Login')) {
            item.event.push({
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
          } else if (item.name.includes('Patient')) {
            item.event.push({
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.id) {",
                  "    pm.environment.set('patientId', jsonData.id);",
                  "}"
                ],
                type: "text/javascript"
              }
            });
          } else if (item.name.includes('Encounter')) {
            item.event.push({
              listen: "test",
              script: {
                exec: [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.id) {",
                  "    pm.environment.set('encounterId', jsonData.id);",
                  "}"
                ],
                type: "text/javascript"
              }
            });
          }
        }
      }
    });
  }

  if (collection.item) {
    traverseItems(collection.item);
  }

  return collection;
}

// Fonction principale pour corriger une collection
function fixCollection(filePath) {
  console.log(`\n🔧 Correction de ${path.basename(filePath)}`);
  console.log('='.repeat(50));
  
  // Créer une sauvegarde
  if (!createBackup(filePath)) {
    return false;
  }
  
  // Lire la collection
  let collection = readCollection(filePath);
  if (!collection) {
    return false;
  }
  
  // Appliquer les corrections
  console.log('📝 Normalisation des variables d\'environnement...');
  collection = normalizeEnvironmentVariables(collection);
  
  console.log('🔐 Ajout de l\'authentification manquante...');
  collection = addMissingAuthentication(collection);
  
  console.log('📄 Ajout des corps de requête manquants...');
  collection = addMissingRequestBodies(collection);
  
  console.log('🧪 Ajout des scripts de test...');
  collection = addTestScripts(collection);
  
  // Sauvegarder la collection corrigée
  if (saveCollection(filePath, collection)) {
    console.log('✅ Collection corrigée avec succès');
    return true;
  }
  
  return false;
}

// Fonction pour créer un environnement Postman amélioré
function createEnhancedEnvironment() {
  const environment = {
    id: require('crypto').randomUUID(),
    name: "Medical App Environment - Enhanced",
    values: [
      {
        key: "baseUrl",
        value: "http://localhost:3000",
        type: "default",
        enabled: true
      },
      {
        key: "accessToken",
        value: "",
        type: "secret",
        enabled: true
      },
      {
        key: "refreshToken",
        value: "",
        type: "secret",
        enabled: true
      },
      {
        key: "tenantId",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "userId",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "patientId",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "practitionerId",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "appointmentId",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "encounterId",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "prescriptionId",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "labResultId",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "invoiceId",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "reportId",
        value: "",
        type: "default",
        enabled: true
      },
      {
        key: "itemId",
        value: "",
        type: "default",
        enabled: true
      }
    ],
    _postman_variable_scope: "environment",
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: "Medical Collection Fixer"
  };

  const envPath = './Medical-Environment-Enhanced.json';
  if (saveCollection(envPath, environment)) {
    console.log(`✅ Environnement amélioré créé: ${path.basename(envPath)}`);
    return true;
  }
  
  return false;
}

// Fonction principale
function fixAllCollections() {
  console.log('🚀 Correction automatique des collections Postman');
  console.log('='.repeat(60));
  
  const collectionsToFix = [
    'module-auth.postman_collection.json',
    'module-patients.postman_collection.json',
    'module-scheduling.postman_collection.json',
    'module-ehr.postman_collection.json',
    'module-billing.postman_collection.json',
    'module-analytics.postman_collection.json'
  ];
  
  let successCount = 0;
  
  collectionsToFix.forEach(collectionFile => {
    if (fs.existsSync(collectionFile)) {
      if (fixCollection(collectionFile)) {
        successCount++;
      }
    } else {
      console.log(`⚠️  Collection non trouvée: ${collectionFile}`);
    }
  });
  
  // Créer l'environnement amélioré
  console.log('\n🌍 Création de l\'environnement amélioré...');
  createEnhancedEnvironment();
  
  // Résumé
  console.log('\n📋 RÉSUMÉ');
  console.log('='.repeat(30));
  console.log(`✅ Collections corrigées: ${successCount}/${collectionsToFix.length}`);
  console.log(`💾 Sauvegardes créées: ${successCount}`);
  console.log(`🌍 Environnement amélioré: créé`);
  
  if (successCount === collectionsToFix.length) {
    console.log('\n🎉 Toutes les collections ont été corrigées avec succès !');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Importez les collections corrigées dans Postman');
    console.log('   2. Importez l\'environnement Medical-Environment-Enhanced.json');
    console.log('   3. Testez les routes en commençant par l\'authentification');
  } else {
    console.log('\n⚠️  Certaines collections n\'ont pas pu être corrigées');
    console.log('   Vérifiez les erreurs ci-dessus et corrigez manuellement si nécessaire');
  }
}

// Exécuter la correction si le script est appelé directement
if (require.main === module) {
  fixAllCollections();
}

module.exports = {
  fixCollection,
  fixAllCollections,
  createEnhancedEnvironment
}; 