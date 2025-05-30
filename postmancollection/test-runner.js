const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration des tests
const testConfig = {
  environment: './Medical-Environment-Enhanced.json',
  collections: [
    {
      name: 'Authentication',
      file: './module-auth.postman_collection.json',
      priority: 1,
      required: true
    },
    {
      name: 'Patients',
      file: './module-patients.postman_collection.json',
      priority: 2,
      required: true
    },
    {
      name: 'Scheduling',
      file: './module-scheduling.postman_collection.json',
      priority: 3,
      required: false
    },
    {
      name: 'EHR',
      file: './module-ehr.postman_collection.json',
      priority: 4,
      required: false
    },
    {
      name: 'Billing',
      file: './module-billing.postman_collection.json',
      priority: 5,
      required: false
    },
    {
      name: 'Analytics',
      file: './module-analytics.postman_collection.json',
      priority: 6,
      required: false
    }
  ],
  newman: {
    timeout: 30000,
    insecure: true,
    reporters: ['cli', 'json'],
    outputDir: './test-results'
  }
};

// Fonction pour vérifier si Newman est installé
function checkNewman() {
  return new Promise((resolve, reject) => {
    exec('newman --version', (error, stdout, stderr) => {
      if (error) {
        reject(new Error('Newman n\'est pas installé. Installez-le avec: npm install -g newman'));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Fonction pour vérifier si l'API est accessible
function checkApiHealth() {
  return new Promise((resolve, reject) => {
    exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', (error, stdout, stderr) => {
      if (error || stdout !== '200') {
        reject(new Error('L\'API n\'est pas accessible sur http://localhost:3000'));
      } else {
        resolve(true);
      }
    });
  });
}

// Fonction pour exécuter une collection avec Newman
function runCollection(collection) {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(testConfig.newman.outputDir, `${collection.name.toLowerCase()}-results.json`);
    
    const command = [
      'newman run',
      `"${collection.file}"`,
      `-e "${testConfig.environment}"`,
      `--timeout ${testConfig.newman.timeout}`,
      testConfig.newman.insecure ? '--insecure' : '',
      `--reporters ${testConfig.newman.reporters.join(',')}`,
      `--reporter-json-export "${outputFile}"`
    ].filter(Boolean).join(' ');

    console.log(`🚀 Exécution de la collection ${collection.name}...`);
    console.log(`📝 Commande: ${command}`);

    const startTime = Date.now();
    
    exec(command, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        console.error(`❌ Erreur lors de l'exécution de ${collection.name}:`);
        console.error(stderr);
        reject({
          collection: collection.name,
          error: error.message,
          duration,
          required: collection.required
        });
      } else {
        console.log(`✅ Collection ${collection.name} exécutée avec succès (${duration}ms)`);
        
        // Parser les résultats si le fichier JSON existe
        let results = null;
        if (fs.existsSync(outputFile)) {
          try {
            results = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
          } catch (parseError) {
            console.warn(`⚠️  Impossible de parser les résultats de ${collection.name}`);
          }
        }
        
        resolve({
          collection: collection.name,
          success: true,
          duration,
          results,
          stdout
        });
      }
    });
  });
}

// Fonction pour créer le dossier de résultats
function createResultsDir() {
  if (!fs.existsSync(testConfig.newman.outputDir)) {
    fs.mkdirSync(testConfig.newman.outputDir, { recursive: true });
    console.log(`📁 Dossier de résultats créé: ${testConfig.newman.outputDir}`);
  }
}

// Fonction pour générer un rapport de synthèse
function generateSummaryReport(results) {
  const reportPath = path.join(testConfig.newman.outputDir, 'summary-report.md');
  
  let report = '# Rapport de test automatique - API Médicale\n\n';
  report += `**Date d'exécution**: ${new Date().toLocaleString()}\n\n`;
  
  // Statistiques globales
  const totalCollections = results.length;
  const successfulCollections = results.filter(r => r.success).length;
  const failedCollections = results.filter(r => !r.success).length;
  const requiredFailed = results.filter(r => !r.success && r.required).length;
  
  report += '## 📊 Statistiques globales\n\n';
  report += `- **Collections testées**: ${totalCollections}\n`;
  report += `- **Succès**: ${successfulCollections}\n`;
  report += `- **Échecs**: ${failedCollections}\n`;
  report += `- **Échecs critiques**: ${requiredFailed}\n\n`;
  
  // Détail par collection
  report += '## 📋 Détail par collection\n\n';
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const required = result.required ? '🔴 Critique' : '🟡 Optionnel';
    
    report += `### ${status} ${result.collection} (${required})\n\n`;
    report += `- **Durée**: ${result.duration}ms\n`;
    
    if (result.success && result.results) {
      const stats = result.results.run?.stats;
      if (stats) {
        report += `- **Requêtes**: ${stats.requests?.total || 0}\n`;
        report += `- **Tests**: ${stats.tests?.total || 0}\n`;
        report += `- **Assertions**: ${stats.assertions?.total || 0}\n`;
        report += `- **Échecs**: ${stats.assertions?.failed || 0}\n`;
      }
    } else if (!result.success) {
      report += `- **Erreur**: ${result.error}\n`;
    }
    
    report += '\n';
  });
  
  // Recommandations
  report += '## 🔧 Recommandations\n\n';
  
  if (requiredFailed > 0) {
    report += '❌ **Actions critiques requises**:\n';
    results.filter(r => !r.success && r.required).forEach(result => {
      report += `- Corriger les erreurs dans la collection ${result.collection}\n`;
    });
    report += '\n';
  }
  
  if (failedCollections > 0 && requiredFailed === 0) {
    report += '⚠️ **Actions recommandées**:\n';
    results.filter(r => !r.success && !r.required).forEach(result => {
      report += `- Examiner les erreurs dans la collection ${result.collection}\n`;
    });
    report += '\n';
  }
  
  if (successfulCollections === totalCollections) {
    report += '🎉 **Tous les tests sont passés avec succès !**\n\n';
    report += 'L\'API fonctionne correctement et toutes les collections sont opérationnelles.\n';
  }
  
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Rapport de synthèse généré: ${reportPath}`);
  
  return {
    totalCollections,
    successfulCollections,
    failedCollections,
    requiredFailed,
    reportPath
  };
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Démarrage des tests automatiques de l\'API médicale');
  console.log('='.repeat(60));
  
  try {
    // Vérifications préliminaires
    console.log('🔍 Vérifications préliminaires...');
    
    const newmanVersion = await checkNewman();
    console.log(`✅ Newman installé (version ${newmanVersion})`);
    
    await checkApiHealth();
    console.log('✅ API accessible');
    
    // Vérifier l'environnement
    if (!fs.existsSync(testConfig.environment)) {
      throw new Error(`Fichier d'environnement non trouvé: ${testConfig.environment}`);
    }
    console.log('✅ Environnement Postman trouvé');
    
    // Créer le dossier de résultats
    createResultsDir();
    
    // Trier les collections par priorité
    const sortedCollections = testConfig.collections
      .filter(c => fs.existsSync(c.file))
      .sort((a, b) => a.priority - b.priority);
    
    console.log(`\n📋 ${sortedCollections.length} collections à tester`);
    
    // Exécuter les tests
    const results = [];
    
    for (const collection of sortedCollections) {
      try {
        const result = await runCollection(collection);
        results.push(result);
        
        // Pause entre les collections pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push(error);
        
        // Arrêter si une collection critique échoue
        if (error.required) {
          console.error(`💥 Collection critique ${error.collection} échouée. Arrêt des tests.`);
          break;
        }
      }
    }
    
    // Générer le rapport de synthèse
    console.log('\n📊 Génération du rapport de synthèse...');
    const summary = generateSummaryReport(results);
    
    // Afficher le résumé
    console.log('\n📋 RÉSUMÉ FINAL');
    console.log('='.repeat(30));
    console.log(`✅ Collections réussies: ${summary.successfulCollections}/${summary.totalCollections}`);
    console.log(`❌ Collections échouées: ${summary.failedCollections}`);
    console.log(`🔴 Échecs critiques: ${summary.requiredFailed}`);
    
    if (summary.requiredFailed === 0) {
      console.log('\n🎉 Tests terminés avec succès !');
      process.exit(0);
    } else {
      console.log('\n💥 Tests échoués - Actions requises');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Erreur lors de l\'exécution des tests:');
    console.error(error.message);
    process.exit(1);
  }
}

// Fonction pour exécuter un test spécifique
async function runSpecificTest(collectionName) {
  const collection = testConfig.collections.find(c => 
    c.name.toLowerCase() === collectionName.toLowerCase()
  );
  
  if (!collection) {
    console.error(`❌ Collection non trouvée: ${collectionName}`);
    console.log('Collections disponibles:');
    testConfig.collections.forEach(c => console.log(`  - ${c.name}`));
    process.exit(1);
  }
  
  try {
    await checkNewman();
    await checkApiHealth();
    createResultsDir();
    
    const result = await runCollection(collection);
    console.log('\n✅ Test terminé avec succès');
    
  } catch (error) {
    console.error('\n❌ Test échoué:', error.message);
    process.exit(1);
  }
}

// Interface en ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    runAllTests();
  } else if (args[0] === '--collection' && args[1]) {
    runSpecificTest(args[1]);
  } else {
    console.log('Usage:');
    console.log('  node test-runner.js                    # Exécuter tous les tests');
    console.log('  node test-runner.js --collection auth  # Exécuter une collection spécifique');
    console.log('\nCollections disponibles:');
    testConfig.collections.forEach(c => console.log(`  - ${c.name.toLowerCase()}`));
  }
}

module.exports = {
  runAllTests,
  runSpecificTest,
  testConfig
}; 