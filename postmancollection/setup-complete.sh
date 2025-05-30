#!/bin/bash

# Script de configuration complète pour les collections Postman
# Système médical NestJS

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    print_status "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command_exists node; then
        print_error "Node.js n'est pas installé"
        exit 1
    fi
    print_success "Node.js installé ($(node --version))"
    
    # Vérifier npm
    if ! command_exists npm; then
        print_error "npm n'est pas installé"
        exit 1
    fi
    print_success "npm installé ($(npm --version))"
    
    # Vérifier Docker
    if ! command_exists docker; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    print_success "Docker installé ($(docker --version | cut -d' ' -f3 | cut -d',' -f1))"
    
    # Vérifier Docker Compose
    if ! command_exists docker-compose; then
        print_error "Docker Compose n'est pas installé"
        exit 1
    fi
    print_success "Docker Compose installé ($(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1))"
}

# Fonction pour installer Newman si nécessaire
install_newman() {
    if ! command_exists newman; then
        print_status "Installation de Newman..."
        npm install -g newman
        print_success "Newman installé"
    else
        print_success "Newman déjà installé ($(newman --version))"
    fi
}

# Fonction pour démarrer les services Docker
start_docker_services() {
    print_status "Démarrage des services Docker..."
    
    # Aller au répertoire racine du projet
    cd ..
    
    # Démarrer les services
    docker-compose up -d
    
    # Attendre que les services soient prêts
    print_status "Attente du démarrage des services..."
    sleep 10
    
    # Vérifier que PostgreSQL est prêt
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec medical-db-1 pg_isready -U postgres >/dev/null 2>&1; then
            print_success "Base de données PostgreSQL prête"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Timeout: La base de données n'est pas prête après 30 tentatives"
            exit 1
        fi
        
        print_status "Tentative $attempt/$max_attempts - Attente de la base de données..."
        sleep 2
        ((attempt++))
    done
    
    # Retourner au dossier postmancollection
    cd postmancollection
}

# Fonction pour démarrer l'application NestJS
start_nestjs_app() {
    print_status "Démarrage de l'application NestJS..."
    
    cd ..
    
    # Vérifier si les dépendances sont installées
    if [ ! -d "node_modules" ]; then
        print_status "Installation des dépendances npm..."
        npm install
    fi
    
    # Démarrer l'application en arrière-plan
    print_status "Lancement de l'application..."
    npm run start:dev > nestjs.log 2>&1 &
    NESTJS_PID=$!
    
    # Sauvegarder le PID pour pouvoir arrêter l'application plus tard
    echo $NESTJS_PID > nestjs.pid
    
    # Attendre que l'application soit prête
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "Application NestJS prête sur http://localhost:3000"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Timeout: L'application n'est pas prête après 30 tentatives"
            print_error "Vérifiez les logs dans nestjs.log"
            exit 1
        fi
        
        print_status "Tentative $attempt/$max_attempts - Attente de l'application..."
        sleep 2
        ((attempt++))
    done
    
    cd postmancollection
}

# Fonction pour générer et corriger les collections
setup_collections() {
    print_status "Génération des collections Postman..."
    
    # Générer les nouvelles collections
    node route-analyzer.js
    
    print_status "Analyse des collections existantes..."
    
    # Analyser les collections existantes
    node collection-analyzer.js
    
    print_status "Correction automatique des collections..."
    
    # Corriger les collections
    node collection-fixer.js
    
    print_success "Collections configurées avec succès"
}

# Fonction pour exécuter les tests
run_tests() {
    print_status "Exécution des tests automatiques..."
    
    # Attendre un peu pour s'assurer que tout est prêt
    sleep 5
    
    # Exécuter les tests
    if node test-runner.js; then
        print_success "Tous les tests sont passés avec succès !"
    else
        print_warning "Certains tests ont échoué. Consultez les rapports pour plus de détails."
    fi
}

# Fonction pour afficher le résumé
show_summary() {
    echo ""
    echo "=========================================="
    echo "🎉 CONFIGURATION TERMINÉE"
    echo "=========================================="
    echo ""
    echo "📁 Fichiers générés:"
    echo "   - Collections Postman corrigées"
    echo "   - Environnement amélioré: Medical-Environment-Enhanced.json"
    echo "   - Collections complètes dans: generated-collections/"
    echo "   - Rapports de test dans: test-results/"
    echo ""
    echo "🚀 Services en cours d'exécution:"
    echo "   - PostgreSQL: http://localhost:5432"
    echo "   - RabbitMQ Management: http://localhost:15672"
    echo "   - MinIO Console: http://localhost:9001"
    echo "   - API NestJS: http://localhost:3000"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "   1. Importez les collections dans Postman"
    echo "   2. Importez l'environnement Medical-Environment-Enhanced.json"
    echo "   3. Testez l'authentification avec admin@example.com / password123"
    echo "   4. Consultez le guide: GUIDE-UTILISATION.md"
    echo ""
}

# Fonction pour créer le script d'arrêt
create_stop_script() {
    cat > stop-services.sh << 'EOF'
#!/bin/bash

echo "🛑 Arrêt des services..."

# Arrêter l'application NestJS
if [ -f nestjs.pid ]; then
    PID=$(cat nestjs.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ Application NestJS arrêtée"
    fi
    rm -f nestjs.pid
fi

# Arrêter les services Docker
cd ..
docker-compose down
echo "✅ Services Docker arrêtés"

echo "🎉 Tous les services ont été arrêtés"
EOF

    chmod +x stop-services.sh
    print_success "Script d'arrêt créé: stop-services.sh"
}

# Fonction de nettoyage en cas d'interruption
cleanup() {
    print_warning "Interruption détectée. Nettoyage en cours..."
    
    # Arrêter l'application NestJS si elle est en cours d'exécution
    if [ -f nestjs.pid ]; then
        PID=$(cat nestjs.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
        fi
        rm -f nestjs.pid
    fi
    
    exit 1
}

# Capturer les signaux d'interruption
trap cleanup INT TERM

# Fonction principale
main() {
    echo "🚀 Configuration complète du système de collections Postman"
    echo "=========================================================="
    echo ""
    
    # Vérifier les prérequis
    check_prerequisites
    
    # Installer Newman
    install_newman
    
    # Démarrer les services Docker
    start_docker_services
    
    # Démarrer l'application NestJS
    start_nestjs_app
    
    # Configurer les collections
    setup_collections
    
    # Exécuter les tests
    if [ "$1" != "--no-tests" ]; then
        run_tests
    else
        print_status "Tests ignorés (option --no-tests)"
    fi
    
    # Créer le script d'arrêt
    create_stop_script
    
    # Afficher le résumé
    show_summary
}

# Vérifier les arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --no-tests    Ne pas exécuter les tests automatiques"
    echo "  --help, -h    Afficher cette aide"
    echo ""
    echo "Ce script configure automatiquement:"
    echo "  - Les services Docker (PostgreSQL, RabbitMQ, MinIO)"
    echo "  - L'application NestJS"
    echo "  - Les collections Postman"
    echo "  - Les tests automatiques"
    exit 0
fi

# Exécuter le script principal
main "$@" 