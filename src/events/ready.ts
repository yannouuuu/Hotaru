import { Events, ActivityType } from 'discord.js';
import type { BotClient } from '../types/index.ts';
import { initReminderManager } from '../utils/reminderManager.ts';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: BotClient) {
    console.log(`✨ Bot connecté en tant que ${client.user?.tag}`);
    
    // Initialiser le gestionnaire de rappels
    initReminderManager(client);

      const activities = [
      { name: '/help pour démarrer ! 🚀', type: ActivityType.Playing },
      { name: 'les citations de profs 📖', type: ActivityType.Listening },
      { name: 'vos questions en ticket 🎟️', type: ActivityType.Watching },
      { name: 'du code avec /ai-gen 💻', type: ActivityType.Playing },
      { name: 'les BUT Info 🎓', type: ActivityType.Competing },
      { name: 'les étudiants réviser ☕', type: ActivityType.Watching },
      { name: '/quote pour immortaliser 🌟', type: ActivityType.Playing },
      { name: 'des explications d\'IA 🤖', type: ActivityType.Listening },
    ];

    let currentIndex = 0;

      const updateActivity = () => {
      const activity = activities[currentIndex]!;
      client.user?.setPresence({
        activities: [{
          name: activity.name,
          type: activity.type,
        }],
        status: 'online',
      });
      currentIndex = (currentIndex + 1) % activities.length;
    };

    updateActivity();
    
    setInterval(updateActivity, 30000);

    console.log(`🎯 Prêt à servir ${client.guilds.cache.size} serveur(s)`);
    console.log(`📝 ${client.commands.size} commande(s) chargée(s)`);
  },
};

