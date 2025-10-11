/**
 * 🗄️ Script simple d'initialisation de la base de données
 * 
 * Usage : bun run src/utils/init-db-simple.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'database.yml');

console.log('\n╔════════════════════════════════════════╗');
console.log('║   🗄️ Initialisation de la DB         ║');
console.log('╚════════════════════════════════════════╝\n');

// Vérifier si database.yml existe
if (!existsSync(DB_PATH)) {
    console.error('❌ Fichier database.yml introuvable!');
    console.error(`   Attendu: ${DB_PATH}\n`);
    process.exit(1);
}

// Lire le contenu actuel
let content = readFileSync(DB_PATH, 'utf-8');

// Vérifier si la configuration verification_config existe déjà
if (content.includes('verification_config:')) {
    console.log('✅ La configuration verification_config existe déjà dans database.yml\n');
    console.log('📋 Étapes suivantes:');
    console.log('   1. Ouvrez database.yml');
    console.log('   2. Cherchez la section "verification_config"');
    console.log('   3. Remplacez "ROLE_ID_A_REMPLACER" par l\'ID du rôle "✅ Vérifié"\n');
    console.log('💡 Pour obtenir l\'ID du rôle:');
    console.log('   - Sur Discord: Paramètres → Avancés → Activer le Mode développeur');
    console.log('   - Clic droit sur le rôle "✅ Vérifié" → Copier l\'identifiant\n');
    process.exit(0);
}

// Configuration par défaut
const verificationConfig = `

# ==========================================
# 📧 Configuration du système de vérification
# ==========================================
verification_config:
  enabled: true
  
  # Les rôles sont automatiquement récupérés depuis le setup du serveur
  # - Rôle "✅ Vérifié" : setup_GUILD_ID.roles.verifie
  # - Rôle "Étudiant" : setup_GUILD_ID.roles.etudiant
  # Pas besoin de configuration manuelle ! 🎉
  
  # Canal pour les logs de vérification (optionnel)
  logChannelId: null
  
  # Canal de bienvenue (optionnel)
  welcomeChannelId: null
  
  # Domaines d'email autorisés
  allowedDomains:
    - domain: "univ-lille.fr"
      description: "Université de Lille"
      enabled: true
    - domain: "etu.univ-lille.fr"
      description: "Étudiants Université de Lille"
      enabled: true
  
  # Paramètres de sécurité
  codeLength: 8
  codeExpiration: 900000  # 15 minutes en millisecondes
  cooldownBetweenAttempts: 300000  # 5 minutes en millisecondes
  maxAttemptsPerDay: 3
  maxValidationAttempts: 3
  requireUniqueEmail: true

# Structure des données de vérification (créée automatiquement par serveur)
# Format: verification_GUILD_ID avec pendingCodes, verifiedUsers, attempts, logs
`;

// Ajouter la configuration
content += verificationConfig;

// Sauvegarder
writeFileSync(DB_PATH, content, 'utf-8');

console.log('✅ Configuration ajoutée avec succès dans database.yml!\n');
console.log('📋 Configuration par défaut:');
console.log('   - Système activé: Oui');
console.log('   - Rôles: Récupérés automatiquement depuis le setup ✨');
console.log('   - Domaines autorisés: univ-lille.fr, etu.univ-lille.fr');
console.log('   - Durée du code: 15 minutes');
console.log('   - Cooldown: 5 minutes');
console.log('   - Tentatives max/jour: 3\n');

console.log('✅ Configuration automatique des rôles!\n');
console.log('� Le système utilise automatiquement:');
console.log('   - Le rôle "vérifié" créé par /setup');
console.log('   - Le rôle "étudiant" créé par /setup');
console.log('   → Aucune configuration manuelle requise ! 🎉\n');

console.log('╔════════════════════════════════════════╗');
console.log('║   ✅ Initialisation terminée!         ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('🚀 Prochaines étapes:');
console.log('   1. Assurez-vous d\'avoir exécuté /setup sur votre serveur Discord');
console.log('   2. Lancez le bot: bun start');
console.log('   3. Testez avec /verify sur Discord');
console.log('   4. Les rôles "vérifié" et "étudiant" seront automatiquement attribués ! 🎉\n');
