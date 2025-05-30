# Guide d'utilisation des collections Postman - Système Médical

## 📋 Vue d'ensemble

Ce guide vous explique comment utiliser les collections Postman pour tester l'API du système médical NestJS. Les collections ont été automatiquement générées et corrigées pour couvrir toutes les routes de l'API.

## 🚀 Installation et configuration

### 1. Prérequis

- Postman installé sur votre machine
- Docker et Docker Compose pour la base de données
- Node.js pour exécuter l'application NestJS

### 2. Démarrage de l'environnement

```bash
# Démarrer les services Docker
docker-compose up -d

# Vérifier que les services sont en cours d'exécution
docker ps

# Démarrer l'application NestJS
npm run start:dev
```

### 3. Import des collections dans Postman

1. **Ouvrez Postman**
2. **Cliquez sur "Import"**
3. **Sélectionnez les fichiers suivants :**
   - `Medical-Environment-Enhanced.json` (environnement)
   - Toutes les collections `module-*.postman_collection.json`
   - Ou utilisez `Medical-Complete-API.postman_collection.json` pour tout importer

4. **Sélectionnez l'environnement "Medical App Environment - Enhanced"**

## 📁 Structure des collections

### Collections disponibles

| Collection | Description | Routes |
|------------|-------------|---------|
| **module-auth** | Authentification et gestion des utilisateurs | Login, Refresh, Logout |
| **module-patients** | Gestion des patients | CRUD patients, documents, historique médical |
| **module-scheduling** | Gestion des rendez-vous | Appointments, praticiens, file d'attente |
| **module-ehr** | Dossiers médicaux électroniques | Consultations, prescriptions, résultats |
| **module-billing** | Facturation et paiements | Factures, tarifs, paiements |
| **module-analytics** | Rapports et analyses | Tableaux de bord, exports |
| **module-inventory** | Gestion des stocks | Articles, mouvements |

### Collections générées (nouvelles)

Dans le dossier `generated-collections/`, vous trouverez des collections complètes avec toutes les routes détectées dans le code source.

## 🔐 Authentification

### Étapes d'authentification

1. **Exécutez la requête "Login"** dans la collection `module-auth`
   - Email par défaut : `admin@example.com`
   - Mot de passe : `password123`

2. **Les tokens sont automatiquement sauvegardés** dans l'environnement :
   - `accessToken` : pour l'authentification des requêtes
   - `refreshToken` : pour renouveler le token
   - `tenantId` : ID du tenant de l'utilisateur

3. **Toutes les autres requêtes** utilisent automatiquement le `accessToken`

## 📝 Variables d'environnement

### Variables principales

| Variable | Description | Exemple |
|----------|-------------|---------|
| `baseUrl` | URL de base de l'API | `http://localhost:3000` |
| `accessToken` | Token d'authentification | Auto-généré |
| `refreshToken` | Token de rafraîchissement | Auto-généré |
| `tenantId` | ID du tenant | Auto-généré |

### Variables d'entités

| Variable | Description | Usage |
|----------|-------------|-------|
| `patientId` | ID du patient créé | Routes patients |
| `appointmentId` | ID du rendez-vous | Routes scheduling |
| `encounterId` | ID de la consultation | Routes EHR |
| `invoiceId` | ID de la facture | Routes billing |
| `practitionerId` | ID du praticien | Routes scheduling |

## 🧪 Scénarios de test

### Scénario 1 : Workflow complet patient

1. **Authentification**
   ```
   POST /auth/login
   ```

2. **Créer un patient**
   ```
   POST /patients
   ```

3. **Rechercher le patient**
   ```
   GET /patients/search?name=Dupont
   ```

4. **Créer un rendez-vous**
   ```
   POST /appointments
   ```

5. **Créer une consultation**
   ```
   POST /encounters
   ```

6. **Créer une facture**
   ```
   POST /invoices
   ```

### Scénario 2 : Gestion administrative

1. **Authentification admin**
   ```
   POST /auth/login
   ```

2. **Créer un tenant**
   ```
   POST /admin/tenants
   ```

3. **Créer un utilisateur**
   ```
   POST /users
   ```

4. **Gérer les tarifs**
   ```
   GET /tariffs
   POST /tariffs
   ```

## 🔧 Dépannage

### Problèmes courants

#### 1. Erreur 401 Unauthorized
- **Cause** : Token expiré ou manquant
- **Solution** : Exécutez à nouveau la requête de login

#### 2. Erreur 403 Forbidden
- **Cause** : Permissions insuffisantes
- **Solution** : Vérifiez le rôle de l'utilisateur connecté

#### 3. Erreur 404 Not Found
- **Cause** : Route inexistante ou ID invalide
- **Solution** : Vérifiez l'URL et les paramètres

#### 4. Variables d'environnement vides
- **Cause** : Scripts de test non exécutés
- **Solution** : Vérifiez que les scripts de test sont activés

### Vérification de l'environnement

```bash
# Vérifier que l'API est accessible
curl http://localhost:3000

# Vérifier la base de données
docker exec -it medical-db-1 psql -U postgres -d medical -c "\dt"

# Vérifier les logs de l'application
npm run start:dev
```

## 📊 Scripts de test automatiques

### Scripts inclus dans les collections

1. **Sauvegarde automatique des IDs** : Les IDs créés sont automatiquement sauvegardés
2. **Gestion des tokens** : Les tokens d'authentification sont gérés automatiquement
3. **Validation des réponses** : Vérification des codes de statut

### Utilisation avec Newman (CLI)

```bash
# Installer Newman
npm install -g newman

# Exécuter une collection
newman run module-auth.postman_collection.json -e Medical-Environment-Enhanced.json

# Exécuter avec rapport HTML
newman run module-auth.postman_collection.json -e Medical-Environment-Enhanced.json -r html
```

## 🔄 Mise à jour des collections

### Régénération automatique

```bash
# Analyser les routes actuelles
node route-analyzer.js

# Analyser les erreurs
node collection-analyzer.js

# Corriger automatiquement
node collection-fixer.js
```

### Ajout de nouvelles routes

1. **Modifiez le fichier `route-analyzer.js`**
2. **Ajoutez les nouvelles routes dans `moduleRoutes`**
3. **Régénérez les collections**
4. **Testez les nouvelles routes**

## 📈 Bonnes pratiques

### Organisation des tests

1. **Commencez toujours par l'authentification**
2. **Utilisez l'ordre logique** : Créer → Lire → Modifier → Supprimer
3. **Testez les cas d'erreur** : données invalides, permissions
4. **Nettoyez après les tests** : supprimez les données de test

### Gestion des données

1. **Utilisez des données cohérentes** dans tous les tests
2. **Évitez les données en dur** : utilisez les variables d'environnement
3. **Documentez vos tests** : ajoutez des descriptions claires

### Sécurité

1. **Ne commitez jamais les tokens** dans le contrôle de version
2. **Utilisez des environnements séparés** pour dev/test/prod
3. **Changez les mots de passe par défaut** en production

## 🆘 Support

### Ressources

- **Documentation API** : Consultez le schema GraphQL dans `src/schema.gql`
- **Code source** : Examinez les contrôleurs dans `src/*/controllers/`
- **Tests unitaires** : Référez-vous aux tests dans `src/**/*.spec.ts`

### Contact

Pour toute question ou problème :
1. Vérifiez ce guide
2. Consultez les logs de l'application
3. Examinez le code source des contrôleurs
4. Créez un ticket avec les détails de l'erreur

---

**Dernière mise à jour** : ${new Date().toLocaleDateString()}
**Version** : 1.0.0 