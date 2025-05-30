# Collections Postman pour l'Application Médicale

Ce dossier contient les collections Postman pour tester l'API de l'application médicale.

## Structure des collections

Les collections sont organisées par modules fonctionnels:

- `module-auth.postman_collection.json` - Authentification et administration
- `module-patients.postman_collection.json` - Gestion des patients
- `module-scheduling.postman_collection.json` - Planification des rendez-vous
- `module-ehr.postman_collection.json` - Dossier médical électronique
- `module-billing.postman_collection.json` - Facturation et paiements
- `module-analytics.postman_collection.json` - Analyses et rapports
- `Medical-Main-Collection.json` - Collection principale regroupant toutes les fonctionnalités

## Comment utiliser ces collections

1. Importez les collections et l'environnement dans Postman
2. Sélectionnez l'environnement "Medical App Environment"
3. Commencez par vous authentifier avec la route `/auth/login`
4. Le token d'accès sera automatiquement sauvegardé dans les variables d'environnement

### Ordre suggéré pour les tests:

1. Authentification (`/auth/login`)
2. Création d'un tenant (pour les superadmins)
3. Création de patients
4. Création de praticiens
5. Planification de rendez-vous
6. Création de dossiers médicaux
7. Facturation
8. Génération de rapports

## Variables d'environnement

Les collections utilisent les variables d'environnement suivantes:

- `baseUrl` - L'URL de base de l'API (par défaut: http://localhost:3000)
- `accessToken` - Token JWT pour l'authentification
- `refreshToken` - Token de rafraîchissement
- `tenantId` - ID du tenant courant
- `patientId` - ID du patient pour les tests
- `practitionerId` - ID du praticien pour les tests
- `appointmentId` - ID du rendez-vous pour les tests
- `reportId` - ID du rapport pour les tests
- `invoiceId` - ID de la facture pour les tests

## Authentification

Pour utiliser l'API, vous devez d'abord vous authentifier via `/auth/login`. Les tests sont configurés pour sauvegarder automatiquement les tokens dans vos variables d'environnement.

## Notes importantes

- Les collections sont configurées pour un environnement de développement local (localhost:3000)
- Pour utiliser en production, modifiez la variable `baseUrl`
- Certaines requêtes nécessitent des autorisations spécifiques (SUPERADMIN, CLINIC_ADMIN, etc.) 