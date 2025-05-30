# Rapport d'analyse des collections Postman

Généré le: 5/30/2025, 7:44:26 AM

## Résumé exécutif

- **Collections analysées**: 6
- **Erreurs critiques**: 0
- **Avertissements**: 14
- **Routes manquantes**: 5

## Détail par collection

### module-auth.postman_collection.json

- Routes: 8
- Erreurs: 0
- Avertissements: 5

**Avertissements:**
- Route 5 (Deactivate Tenant): PATCH sans corps de requête
- Route 5 (Deactivate Tenant): Variable d'environnement non standard: {{tenantId}}
- Route 6 (Reactivate Tenant): PATCH sans corps de requête
- Route 6 (Reactivate Tenant): Variable d'environnement non standard: {{tenantId}}
- Route 8 (Deactivate User): PATCH sans corps de requête

### module-patients.postman_collection.json

- Routes: 7
- Erreurs: 0
- Avertissements: 1

**Avertissements:**
- Route 6 (Upload Patient Document): Type de corps non-standard: formdata

**Routes manquantes:**
- GET /patients - Lister les patients
- GET /patients/search - Rechercher des patients
- GET /patients/:id - Obtenir un patient
- PUT /patients/:id - Modifier un patient
- DELETE /patients/:id - Archiver un patient

### module-scheduling.postman_collection.json

- Routes: 3
- Erreurs: 0
- Avertissements: 0

### module-ehr.postman_collection.json

- Routes: 5
- Erreurs: 0
- Avertissements: 4

**Avertissements:**
- Route 2 (Verrouiller un Encounter): PATCH sans corps de requête
- Route 2 (Verrouiller un Encounter): Variable d'environnement non standard: {{id}}
- Route 3 (Créer une prescription): Variable d'environnement non standard: {{id}}
- Route 4 (Obtenir un Encounter): Variable d'environnement non standard: {{id}}

### module-billing.postman_collection.json

- Routes: 6
- Erreurs: 0
- Avertissements: 3

**Avertissements:**
- Route 3 (Ajouter une ligne à la facture): Variable d'environnement non standard: {{id}}
- Route 4 (Envoyer la facture): Variable d'environnement non standard: {{id}}
- Route 5 (Marquer la facture comme payée): Variable d'environnement non standard: {{id}}

### module-analytics.postman_collection.json

- Routes: 3
- Erreurs: 0
- Avertissements: 1

**Avertissements:**
- Route 2 (Télécharger un rapport): Variable d'environnement non standard: {{reportId}}

