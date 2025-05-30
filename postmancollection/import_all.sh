#!/bin/bash

# Script pour importer facilement toutes les collections dans Postman

echo "Ce script va ouvrir Postman avec toutes les collections et l'environnement."
echo "Assurez-vous que Postman est installé sur votre système."

# Vérifier si Postman est installé
if ! command -v postman &> /dev/null; then
    echo "Erreur: Postman n'est pas installé ou n'est pas dans le PATH."
    echo "Veuillez télécharger et installer Postman depuis https://www.postman.com/downloads/"
    exit 1
fi

# Chemin absolu du dossier des collections
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Ouvrir les collections dans Postman
echo "Ouverture des collections dans Postman..."
open -a Postman "$DIR/module-auth.postman_collection.json"
open -a Postman "$DIR/module-patients.postman_collection.json"
open -a Postman "$DIR/module-scheduling.postman_collection.json"
open -a Postman "$DIR/module-ehr.postman_collection.json"
open -a Postman "$DIR/module-billing.postman_collection.json"
open -a Postman "$DIR/module-analytics.postman_collection.json"
open -a Postman "$DIR/Medical-Main-Collection.json"
open -a Postman "$DIR/Medical-Environment.json"

echo "Collections ouvertes dans Postman. Veuillez les importer manuellement si nécessaire."
echo "N'oubliez pas de sélectionner l'environnement 'Medical App Environment' pour vos tests." 