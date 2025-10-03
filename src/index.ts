/**
 * Hotaru - Bot Discord pour le BUT Informatique de l'Université de Lille
 * 
 * Point d'entrée principal du bot
 * - Initialise le client Discord
 * - Charge les commandes et événements
 * - Déploie les commandes slash
 * - Gère la connexion à Discord
 */

import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import type { BotClient } from './types/index.ts';
import { loadCommands } from './loaders/commandLoader.ts';
import { loadEvents } from './loaders/eventLoader.ts';

config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN et CLIENT_ID doivent être définis dans le fichier .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
}) as BotClient;

client.commands = new Collection();

// Fonction principale
async function main() {
  console.log('🚀 Démarrage de Hotaru...\n');

  // Charger les commandes
  console.log('📦 Chargement des commandes...');
  client.commands = await loadCommands();
  console.log(`✅ ${client.commands.size} commande(s) chargée(s)`);

  console.log('📦 Chargement des événements...');
  await loadEvents(client);
  console.log('✅ Événements chargés');

  console.log('🔄 Déploiement des commandes slash...');
  await deployCommands();
  console.log('✅ Commandes déployées');

  /* // ⚠️ SERVEUR CAS - Désactivé pour l'instant
  // Raison : Le CAS de l'Université de Lille nécessite une URL publique pré-enregistrée
  // Pour activer :
  //   1. Héberger le bot sur un serveur avec domaine public (ex: votrebot.com)
  //   2. Configurer CAS_CALLBACK_URL dans .env avec l'URL publique
  //   3. Demander à l'université d'enregistrer l'URL dans leur CAS
  //   4. Décommenter ce code
  
  */

  // Se connecter à Discord
  console.log('🔌 Connexion à Discord...');
  await client.login(TOKEN);
}

// Déployer les commandes slash
async function deployCommands() {
  const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
  const rest = new REST().setToken(TOKEN!);

  try {
    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID!, GUILD_ID),
        { body: [] }
      );
      await rest.put(
        Routes.applicationCommands(CLIENT_ID!),
        { body: [] }
      );
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID!, GUILD_ID),
        { body: commands }
      );
    } else {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID!),
        { body: [] }
      );
      await rest.put(
        Routes.applicationCommands(CLIENT_ID!),
        { body: commands }
      );
    }
  } catch (error) {
    console.error('❌ Erreur lors du déploiement des commandes:', error);
  }
}

// Gestion des erreurs
process.on('unhandledRejection', (error: Error) => {
  console.error('❌ Erreur non gérée:', error);
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Lancer le bot
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
