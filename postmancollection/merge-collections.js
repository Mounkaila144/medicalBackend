const fs = require('fs');
const path = require('path');

// Script pour fusionner toutes les collections dans Medical-Complete-API
// avec la belle structure et toutes les requêtes

function readCollection(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture de ${filePath}:`, error.message);
    return null;
  }
}

function saveCollection(filePath, collection) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour extraire les requêtes d'une collection
function extractRequests(collection) {
  const requests = [];
  
  function traverseItems(items) {
    items.forEach(item => {
      if (item.item) {
        // C'est un dossier, parcourir récursivement
        traverseItems(item.item);
      } else if (item.request) {
        // C'est une requête
        requests.push(item);
      }
    });
  }
  
  if (collection.item) {
    traverseItems(collection.item);
  }
  
  return requests;
}

// Configuration des modules et leurs collections correspondantes
const moduleMapping = {
  '🔐 Authentication': {
    files: ['module-auth.postman_collection.json'],
    icon: '🔐',
    description: 'Authentification, gestion des utilisateurs et sécurité'
  },
  '👥 Patients': {
    files: ['module-patients.postman_collection.json'],
    icon: '👥',
    description: 'Gestion complète des patients et de leurs données'
  },
  '📅 Scheduling': {
    files: ['module-scheduling.postman_collection.json'],
    icon: '📅',
    description: 'Gestion des rendez-vous, planning et file d\'attente'
  },
  '🏥 EHR (Electronic Health Records)': {
    files: ['module-ehr.postman_collection.json'],
    icon: '🏥',
    description: 'Dossiers médicaux électroniques, consultations et prescriptions'
  },
  '💰 Billing': {
    files: ['module-billing.postman_collection.json'],
    icon: '💰',
    description: 'Facturation, tarifs et gestion des paiements'
  },
  '📦 Inventory': {
    files: [], // Pas de collection séparée, sera dans generated-collections
    icon: '📦',
    description: 'Gestion des stocks et inventaire médical'
  },
  '📊 Analytics': {
    files: ['module-analytics.postman_collection.json'],
    icon: '📊',
    description: 'Rapports, analyses et tableaux de bord'
  }
};

// Fonction principale pour créer la collection unifiée
function createUnifiedCollection() {
  console.log('🚀 Création de la collection Medical-Complete-API unifiée');
  console.log('='.repeat(60));
  
  // Structure de base élégante
  const unifiedCollection = {
    info: {
      _postman_id: require('crypto').randomUUID(),
      name: "🏥 Medical System - Complete API",
      description: "Collection complète et élégante regroupant toutes les APIs du système médical NestJS",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      _exporter_id: "medical-system-api"
    },
    item: [],
    event: [
      {
        listen: "prerequest",
        script: {
          type: "text/javascript",
          exec: [
            "// Script global de pré-requête",
            "console.log('🚀 Exécution de la requête:', pm.info.requestName);",
            "",
            "// Vérifier si on a un token d'accès",
            "const accessToken = pm.environment.get('accessToken');",
            "if (!accessToken && !pm.info.requestName.includes('Login')) {",
            "    console.warn('⚠️ Aucun token d\\'accès trouvé. Exécutez d\\'abord la requête de login.');",
            "}"
          ]
        }
      },
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: [
            "// Script global de test",
            "const responseTime = pm.response.responseTime;",
            "const statusCode = pm.response.code;",
            "",
            "console.log(`📊 Réponse: ${statusCode} en ${responseTime}ms`);",
            "",
            "// Tests globaux",
            "pm.test('Temps de réponse acceptable', function () {",
            "    pm.expect(responseTime).to.be.below(5000);",
            "});",
            "",
            "pm.test('Statut de réponse valide', function () {",
            "    pm.expect(statusCode).to.be.oneOf([200, 201, 204, 400, 401, 403, 404, 422]);",
            "});"
          ]
        }
      }
    ],
    variable: [
      {
        key: "baseUrl",
        value: "http://localhost:3000",
        type: "string",
        description: "URL de base de l'API médicale"
      }
    ]
  };
  
  let totalRequests = 0;
  
  // Traiter chaque module
  Object.entries(moduleMapping).forEach(([moduleName, config]) => {
    console.log(`\n📁 Traitement du module: ${moduleName}`);
    
    const moduleFolder = {
      name: moduleName,
      description: config.description,
      item: []
    };
    
    let moduleRequestCount = 0;
    
    // Traiter les fichiers de collection pour ce module
    config.files.forEach(fileName => {
      if (fs.existsSync(fileName)) {
        console.log(`   📄 Lecture de ${fileName}...`);
        const collection = readCollection(fileName);
        
        if (collection) {
          const requests = extractRequests(collection);
          
          // Organiser les requêtes par sous-dossiers si nécessaire
          if (requests.length > 0) {
            // Grouper les requêtes par type/fonction
            const groupedRequests = groupRequestsByType(requests, moduleName);
            
            Object.entries(groupedRequests).forEach(([groupName, groupRequests]) => {
              if (groupRequests.length === 1 && groupName === 'default') {
                // Si une seule requête sans groupe spécial, l'ajouter directement
                moduleFolder.item.push(...groupRequests);
              } else {
                // Créer un sous-dossier
                moduleFolder.item.push({
                  name: groupName,
                  item: groupRequests
                });
              }
            });
            
            moduleRequestCount += requests.length;
            console.log(`   ✅ ${requests.length} requêtes ajoutées`);
          }
        }
      } else {
        console.log(`   ⚠️  Fichier non trouvé: ${fileName}`);
      }
    });
    
    // Ajouter des requêtes depuis generated-collections si nécessaire
    if (config.files.length === 0) {
      const generatedFile = `generated-collections/module-${moduleName.toLowerCase().replace(/[^a-z]/g, '')}.postman_collection.json`;
      if (fs.existsSync(generatedFile)) {
        console.log(`   📄 Lecture de ${generatedFile}...`);
        const collection = readCollection(generatedFile);
        if (collection) {
          const requests = extractRequests(collection);
          moduleFolder.item.push(...requests);
          moduleRequestCount += requests.length;
          console.log(`   ✅ ${requests.length} requêtes ajoutées depuis generated-collections`);
        }
      }
    }
    
    if (moduleRequestCount > 0) {
      unifiedCollection.item.push(moduleFolder);
      totalRequests += moduleRequestCount;
      console.log(`   📊 Total module: ${moduleRequestCount} requêtes`);
    } else {
      console.log(`   ⚠️  Aucune requête trouvée pour ce module`);
    }
  });
  
  // Ajouter une section utilitaires
  const utilitiesFolder = {
    name: "🔧 Utilities",
    description: "Requêtes utilitaires et de maintenance",
    item: [
      {
        name: "🏥 Health Check",
        request: {
          method: "GET",
          header: [],
          url: {
            raw: "{{baseUrl}}/health",
            host: ["{{baseUrl}}"],
            path: ["health"]
          },
          description: "Vérifier l'état de santé de l'API"
        }
      },
      {
        name: "📊 API Info",
        request: {
          method: "GET",
          header: [],
          url: {
            raw: "{{baseUrl}}/",
            host: ["{{baseUrl}}"]
          },
          description: "Informations sur l'API"
        }
      }
    ]
  };
  
  unifiedCollection.item.push(utilitiesFolder);
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   • Modules traités: ${Object.keys(moduleMapping).length}`);
  console.log(`   • Total requêtes: ${totalRequests}`);
  console.log(`   • Sections: ${unifiedCollection.item.length}`);
  
  return unifiedCollection;
}

// Fonction pour grouper les requêtes par type
function groupRequestsByType(requests, moduleName) {
  const groups = { default: [] };
  
  requests.forEach(request => {
    const name = request.name.toLowerCase();
    const method = request.request?.method || '';
    
    // Logique de groupement intelligente
    if (moduleName.includes('Authentication')) {
      if (name.includes('login') || name.includes('connexion')) {
        if (!groups['🔑 Connexion']) groups['🔑 Connexion'] = [];
        groups['🔑 Connexion'].push(request);
      } else if (name.includes('user') || name.includes('utilisateur')) {
        if (!groups['👤 Utilisateurs']) groups['👤 Utilisateurs'] = [];
        groups['👤 Utilisateurs'].push(request);
      } else if (name.includes('admin')) {
        if (!groups['⚙️ Administration']) groups['⚙️ Administration'] = [];
        groups['⚙️ Administration'].push(request);
      } else {
        groups.default.push(request);
      }
    } else if (moduleName.includes('Patients')) {
      if (name.includes('document')) {
        if (!groups['📄 Documents']) groups['📄 Documents'] = [];
        groups['📄 Documents'].push(request);
      } else if (name.includes('history') || name.includes('historique')) {
        if (!groups['📋 Historique']) groups['📋 Historique'] = [];
        groups['📋 Historique'].push(request);
      } else {
        if (!groups['👥 Gestion Patients']) groups['👥 Gestion Patients'] = [];
        groups['👥 Gestion Patients'].push(request);
      }
    } else if (moduleName.includes('EHR')) {
      if (name.includes('encounter') || name.includes('consultation')) {
        if (!groups['🏥 Consultations']) groups['🏥 Consultations'] = [];
        groups['🏥 Consultations'].push(request);
      } else if (name.includes('prescription')) {
        if (!groups['💊 Prescriptions']) groups['💊 Prescriptions'] = [];
        groups['💊 Prescriptions'].push(request);
      } else if (name.includes('lab') || name.includes('laboratoire')) {
        if (!groups['🧪 Laboratoire']) groups['🧪 Laboratoire'] = [];
        groups['🧪 Laboratoire'].push(request);
      } else {
        groups.default.push(request);
      }
    } else {
      // Pour les autres modules, grouper par méthode HTTP
      if (method === 'POST') {
        if (!groups['➕ Création']) groups['➕ Création'] = [];
        groups['➕ Création'].push(request);
      } else if (method === 'GET') {
        if (!groups['📖 Consultation']) groups['📖 Consultation'] = [];
        groups['📖 Consultation'].push(request);
      } else if (method === 'PUT' || method === 'PATCH') {
        if (!groups['✏️ Modification']) groups['✏️ Modification'] = [];
        groups['✏️ Modification'].push(request);
      } else if (method === 'DELETE') {
        if (!groups['🗑️ Suppression']) groups['🗑️ Suppression'] = [];
        groups['🗑️ Suppression'].push(request);
      } else {
        groups.default.push(request);
      }
    }
  });
  
  // Supprimer les groupes vides
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });
  
  return groups;
}

// Fonction principale
function main() {
  console.log('🎨 Création de la collection Medical-Complete-API élégante');
  console.log('='.repeat(70));
  
  // Créer la collection unifiée
  const unifiedCollection = createUnifiedCollection();
  
  // Sauvegarder la nouvelle collection
  const outputPath = './Medical-Complete-API-Unified.postman_collection.json';
  
  if (saveCollection(outputPath, unifiedCollection)) {
    console.log(`\n✅ Collection unifiée créée avec succès !`);
    console.log(`📁 Fichier: ${outputPath}`);
    console.log(`\n🎯 Prochaines étapes:`);
    console.log(`   1. Supprimez l'ancienne collection vide dans Postman`);
    console.log(`   2. Importez ${outputPath} dans Postman`);
    console.log(`   3. Importez l'environnement Medical-Environment-Enhanced.json`);
    console.log(`   4. Profitez de votre belle collection unifiée ! 🎉`);
  } else {
    console.log(`\n❌ Erreur lors de la création de la collection`);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  createUnifiedCollection,
  main
}; 