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

// Fonction pour extraire toutes les routes d'une collection
function extractRoutes(collection) {
  const routes = [];
  
  function traverseItems(items, parentPath = '') {
    items.forEach(item => {
      if (item.item) {
        // C'est un dossier, parcourir récursivement
        traverseItems(item.item, parentPath);
      } else if (item.request) {
        // C'est une requête
        const method = item.request.method;
        const url = item.request.url;
        let path = '';
        
        if (typeof url === 'string') {
          path = url.replace('{{baseUrl}}', '');
        } else if (url && url.raw) {
          path = url.raw.replace('{{baseUrl}}', '');
        } else if (url && url.path) {
          path = '/' + url.path.join('/');
        }
        
        routes.push({
          name: item.name,
          method: method,
          path: path,
          hasAuth: item.request.header?.some(h => h.key === 'Authorization'),
          hasBody: !!item.request.body,
          bodyType: item.request.body?.mode || null
        });
      }
    });
  }
  
  if (collection.item) {
    traverseItems(collection.item);
  }
  
  return routes;
}

// Fonction pour analyser une collection existante
function analyzeExistingCollection(filePath) {
  console.log(`\n🔍 Analyse de ${path.basename(filePath)}`);
  console.log('='.repeat(50));
  
  const collection = readCollection(filePath);
  if (!collection) return null;
  
  const routes = extractRoutes(collection);
  console.log(`📊 Nombre total de routes: ${routes.length}`);
  
  // Analyser les erreurs potentielles
  const errors = [];
  const warnings = [];
  
  routes.forEach((route, index) => {
    // Vérifier les URLs malformées
    if (!route.path || route.path === '{{baseUrl}}') {
      errors.push(`Route ${index + 1} (${route.name}): URL manquante ou malformée`);
    }
    
    // Vérifier les méthodes HTTP
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(route.method)) {
      errors.push(`Route ${index + 1} (${route.name}): Méthode HTTP invalide: ${route.method}`);
    }
    
    // Vérifier l'authentification pour les routes protégées
    if (route.path.includes('/admin') || route.path.includes('/users')) {
      if (!route.hasAuth) {
        warnings.push(`Route ${index + 1} (${route.name}): Route admin sans authentification`);
      }
    }
    
    // Vérifier le corps des requêtes POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      if (!route.hasBody) {
        warnings.push(`Route ${index + 1} (${route.name}): ${route.method} sans corps de requête`);
      } else if (route.bodyType !== 'raw') {
        warnings.push(`Route ${index + 1} (${route.name}): Type de corps non-standard: ${route.bodyType}`);
      }
    }
    
    // Vérifier les variables d'environnement
    if (route.path.includes('{{') && route.path.includes('}}')) {
      const variables = route.path.match(/\{\{([^}]+)\}\}/g);
      variables?.forEach(variable => {
        if (!['{{baseUrl}}', '{{patientId}}', '{{userId}}', '{{appointmentId}}', '{{encounterId}}', '{{invoiceId}}'].includes(variable)) {
          warnings.push(`Route ${index + 1} (${route.name}): Variable d'environnement non standard: ${variable}`);
        }
      });
    }
  });
  
  // Afficher les résultats
  if (errors.length > 0) {
    console.log(`\n❌ Erreurs trouvées (${errors.length}):`);
    errors.forEach(error => console.log(`   • ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  Avertissements (${warnings.length}):`);
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Aucune erreur détectée');
  }
  
  return { routes, errors, warnings };
}

// Fonction pour comparer avec les nouvelles collections
function compareWithGenerated(existingRoutes, generatedFilePath) {
  const generatedCollection = readCollection(generatedFilePath);
  if (!generatedCollection) return;
  
  const generatedRoutes = extractRoutes(generatedCollection);
  
  console.log(`\n🔄 Comparaison avec la collection générée`);
  console.log('-'.repeat(40));
  
  // Routes manquantes dans l'existante
  const missingRoutes = [];
  generatedRoutes.forEach(genRoute => {
    const exists = existingRoutes.some(existRoute => 
      existRoute.method === genRoute.method && 
      existRoute.path.replace(/\{\{[^}]+\}\}/g, ':param') === genRoute.path.replace(/\{\{[^}]+\}\}/g, ':param')
    );
    
    if (!exists) {
      missingRoutes.push(genRoute);
    }
  });
  
  // Routes en trop dans l'existante
  const extraRoutes = [];
  existingRoutes.forEach(existRoute => {
    const exists = generatedRoutes.some(genRoute => 
      genRoute.method === existRoute.method && 
      genRoute.path.replace(/\{\{[^}]+\}\}/g, ':param') === existRoute.path.replace(/\{\{[^}]+\}\}/g, ':param')
    );
    
    if (!exists) {
      extraRoutes.push(existRoute);
    }
  });
  
  if (missingRoutes.length > 0) {
    console.log(`\n❌ Routes manquantes (${missingRoutes.length}):`);
    missingRoutes.forEach(route => {
      console.log(`   • ${route.method} ${route.path} - ${route.name}`);
    });
  }
  
  if (extraRoutes.length > 0) {
    console.log(`\n⚠️  Routes supplémentaires (${extraRoutes.length}):`);
    extraRoutes.forEach(route => {
      console.log(`   • ${route.method} ${route.path} - ${route.name}`);
    });
  }
  
  if (missingRoutes.length === 0 && extraRoutes.length === 0) {
    console.log('✅ Collections synchronisées');
  }
  
  return { missingRoutes, extraRoutes };
}

// Fonction principale d'analyse
function analyzeAllCollections() {
  console.log('🚀 Analyse des collections Postman existantes');
  console.log('='.repeat(60));
  
  const existingCollections = [
    'module-auth.postman_collection.json',
    'module-patients.postman_collection.json',
    'module-scheduling.postman_collection.json',
    'module-ehr.postman_collection.json',
    'module-billing.postman_collection.json',
    'module-analytics.postman_collection.json'
  ];
  
  const generatedDir = './generated-collections';
  const results = {};
  
  existingCollections.forEach(collectionFile => {
    if (fs.existsSync(collectionFile)) {
      const analysis = analyzeExistingCollection(collectionFile);
      
      // Vérifier si l'analyse a réussi
      if (analysis) {
        // Comparer avec la version générée si elle existe
        const generatedFile = path.join(generatedDir, collectionFile);
        if (fs.existsSync(generatedFile)) {
          const comparison = compareWithGenerated(analysis.routes, generatedFile);
          results[collectionFile] = { ...analysis, comparison };
        } else {
          results[collectionFile] = analysis;
        }
      } else {
        // L'analyse a échoué, créer un résultat par défaut
        results[collectionFile] = {
          routes: [],
          errors: ['Impossible de parser la collection JSON'],
          warnings: []
        };
      }
    } else {
      console.log(`⚠️  Collection non trouvée: ${collectionFile}`);
    }
  });
  
  // Résumé global
  console.log('\n📋 RÉSUMÉ GLOBAL');
  console.log('='.repeat(60));
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalMissing = 0;
  
  Object.entries(results).forEach(([file, result]) => {
    totalErrors += result.errors?.length || 0;
    totalWarnings += result.warnings?.length || 0;
    totalMissing += result.comparison?.missingRoutes?.length || 0;
  });
  
  console.log(`📊 Collections analysées: ${Object.keys(results).length}`);
  console.log(`❌ Total erreurs: ${totalErrors}`);
  console.log(`⚠️  Total avertissements: ${totalWarnings}`);
  console.log(`📝 Total routes manquantes: ${totalMissing}`);
  
  if (totalErrors === 0 && totalWarnings === 0 && totalMissing === 0) {
    console.log('\n🎉 Toutes les collections sont en bon état !');
  } else {
    console.log('\n🔧 Actions recommandées:');
    if (totalErrors > 0) {
      console.log('   1. Corriger les erreurs critiques dans les collections existantes');
    }
    if (totalMissing > 0) {
      console.log('   2. Ajouter les routes manquantes depuis les collections générées');
    }
    if (totalWarnings > 0) {
      console.log('   3. Examiner et corriger les avertissements');
    }
  }
  
  return results;
}

// Fonction pour générer un rapport détaillé
function generateReport(results) {
  const reportPath = './analysis-report.md';
  let report = '# Rapport d\'analyse des collections Postman\n\n';
  report += `Généré le: ${new Date().toLocaleString()}\n\n`;
  
  report += '## Résumé exécutif\n\n';
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalMissing = 0;
  
  Object.values(results).forEach(result => {
    totalErrors += result.errors?.length || 0;
    totalWarnings += result.warnings?.length || 0;
    totalMissing += result.comparison?.missingRoutes?.length || 0;
  });
  
  report += `- **Collections analysées**: ${Object.keys(results).length}\n`;
  report += `- **Erreurs critiques**: ${totalErrors}\n`;
  report += `- **Avertissements**: ${totalWarnings}\n`;
  report += `- **Routes manquantes**: ${totalMissing}\n\n`;
  
  report += '## Détail par collection\n\n';
  
  Object.entries(results).forEach(([file, result]) => {
    report += `### ${file}\n\n`;
    report += `- Routes: ${result.routes?.length || 0}\n`;
    report += `- Erreurs: ${result.errors?.length || 0}\n`;
    report += `- Avertissements: ${result.warnings?.length || 0}\n`;
    
    if (result.errors?.length > 0) {
      report += '\n**Erreurs:**\n';
      result.errors.forEach(error => {
        report += `- ${error}\n`;
      });
    }
    
    if (result.warnings?.length > 0) {
      report += '\n**Avertissements:**\n';
      result.warnings.forEach(warning => {
        report += `- ${warning}\n`;
      });
    }
    
    if (result.comparison?.missingRoutes?.length > 0) {
      report += '\n**Routes manquantes:**\n';
      result.comparison.missingRoutes.forEach(route => {
        report += `- ${route.method} ${route.path} - ${route.name}\n`;
      });
    }
    
    report += '\n';
  });
  
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Rapport détaillé généré: ${reportPath}`);
}

// Exécuter l'analyse si le script est appelé directement
if (require.main === module) {
  const results = analyzeAllCollections();
  generateReport(results);
}

module.exports = {
  analyzeExistingCollection,
  compareWithGenerated,
  analyzeAllCollections,
  generateReport
}; 