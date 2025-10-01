import { Events, ActivityType } from 'discord.js';
import type { BotClient } from '../types/index.ts';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: BotClient) {
    console.log(`✨ Bot connecté en tant que ${client.user?.tag}`);
    
    // Définir le statut du bot
    client.user?.setActivity('les étudiants de BUT Info', { 
      type: ActivityType.Watching 
    });

    console.log(`🎯 Prêt à servir ${client.guilds.cache.size} serveur(s)`);
    console.log(`📝 ${client.commands.size} commande(s) chargée(s)`);
  },
};

