#!/bin/bash

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
