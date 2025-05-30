/**
 * Script pour générer des données de test pour Postman
 * Utilisez ce script dans l'onglet "Pre-request Script" de vos requêtes Postman
 */

// Générer un prénom aléatoire
function generateRandomFirstName() {
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Thomas', 'Claire', 'François', 'Julie', 'Michel', 'Isabelle'];
    return firstNames[Math.floor(Math.random() * firstNames.length)];
}

// Générer un nom de famille aléatoire
function generateRandomLastName() {
    const lastNames = ['Dupont', 'Martin', 'Bernard', 'Petit', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Moreau', 'Simon'];
    return lastNames[Math.floor(Math.random() * lastNames.length)];
}

// Générer un email aléatoire
function generateRandomEmail(firstName, lastName) {
    const domains = ['gmail.com', 'yahoo.fr', 'outlook.com', 'protonmail.com', 'example.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${domain}`;
}

// Générer un numéro de téléphone français aléatoire
function generateRandomPhone() {
    let phone = '06';
    for (let i = 0; i < 8; i++) {
        phone += Math.floor(Math.random() * 10);
    }
    return phone;
}

// Générer une date de naissance aléatoire entre 18 et 90 ans
function generateRandomBirthDate() {
    const now = new Date();
    const minAge = 18;
    const maxAge = 90;
    
    const minYear = now.getFullYear() - maxAge;
    const maxYear = now.getFullYear() - minAge;
    
    const year = minYear + Math.floor(Math.random() * (maxYear - minYear));
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1; // Évite les problèmes de mois à 30/31 jours
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Générer un UUID aléatoire (version 4)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Exemple d'utilisation dans un Pre-request Script de Postman
/*
const firstName = generateRandomFirstName();
const lastName = generateRandomLastName();
const email = generateRandomEmail(firstName, lastName);

// Stockage dans les variables d'environnement Postman
pm.environment.set('randomFirstName', firstName);
pm.environment.set('randomLastName', lastName);
pm.environment.set('randomEmail', email);
pm.environment.set('randomPhone', generateRandomPhone());
pm.environment.set('randomBirthDate', generateRandomBirthDate());
pm.environment.set('randomUUID', generateUUID());
*/

// Exporter les fonctions pour utilisation dans Postman
if (typeof module !== 'undefined') {
    module.exports = {
        generateRandomFirstName,
        generateRandomLastName,
        generateRandomEmail,
        generateRandomPhone,
        generateRandomBirthDate,
        generateUUID
    };
} 