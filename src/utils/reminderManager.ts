/**
 * Gestionnaire de rappels
 * Gère la planification et l'exécution des rappels
 */

import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { 
  getActiveReminders, 
  getReminder, 
  updateReminderStatus,
  updateReminderTime,
  type ReminderData 
} from './database.ts';

// Map pour stocker les timeouts actifs
const activeTimeouts = new Map<string, NodeJS.Timeout>();

let client: Client | null = null;

/**
 * Initialiser le gestionnaire de rappels avec le client Discord
 */
export const initReminderManager = (discordClient: Client): void => {
  client = discordClient;
  
  // Charger tous les rappels actifs au démarrage
  loadActiveReminders();
  
  console.log('✅ Gestionnaire de rappels initialisé');
};

/**
 * Charger tous les rappels actifs depuis la base de données
 */
const loadActiveReminders = (): void => {
  const reminders = getActiveReminders();
  const now = Date.now();
  
  let scheduled = 0;
  let expired = 0;
  
  reminders.forEach(reminder => {
    if (reminder.reminderTime <= now) {
      // Le rappel est déjà expiré, l'exécuter immédiatement
      executeReminder(reminder.id!);
      expired++;
    } else {
      // Planifier le rappel
      scheduleReminder(reminder.id!);
      scheduled++;
    }
  });
  
  if (scheduled > 0 || expired > 0) {
    console.log(`📋 Rappels chargés: ${scheduled} planifiés, ${expired} exécutés immédiatement`);
  }
};

/**
 * Planifier un rappel
 */
export const scheduleReminder = (reminderId: string): void => {
  const reminder = getReminder(reminderId);
  
  if (!reminder || reminder.status !== 'active') {
    return;
  }
  
  const now = Date.now();
  const delay = reminder.reminderTime - now;
  
  // Si le délai est négatif ou nul, exécuter immédiatement
  if (delay <= 0) {
    executeReminder(reminderId);
    return;
  }
  
  // Annuler le timeout existant s'il y en a un
  if (activeTimeouts.has(reminderId)) {
    clearTimeout(activeTimeouts.get(reminderId)!);
  }
  
  // Créer le nouveau timeout
  // Note: setTimeout a une limite de ~24.8 jours (2^31-1 ms)
  // Si le délai est trop long, on va le vérifier périodiquement
  const MAX_TIMEOUT = 2147483647; // ~24.8 jours
  
  if (delay > MAX_TIMEOUT) {
    // Pour les rappels très lointains, planifier une vérification dans 1 jour
    const checkDelay = 24 * 60 * 60 * 1000; // 1 jour
    const timeout = setTimeout(() => {
      scheduleReminder(reminderId); // Re-planifier
    }, checkDelay);
    
    activeTimeouts.set(reminderId, timeout);
  } else {
    const timeout = setTimeout(() => {
      executeReminder(reminderId);
    }, delay);
    
    activeTimeouts.set(reminderId, timeout);
  }
};

/**
 * Exécuter un rappel
 */
const executeReminder = async (reminderId: string): Promise<void> => {
  if (!client) {
    console.error('❌ Client Discord non initialisé');
    return;
  }
  
  const reminder = getReminder(reminderId);
  
  if (!reminder || reminder.status !== 'active') {
    return;
  }
  
  try {
    // Créer l'embed du rappel
    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle('⏰ Rappel !')
      .setDescription(reminder.message)
      .addFields(
        { 
          name: '📅 Créé le', 
          value: `<t:${Math.floor(reminder.createdAt / 1000)}:F>`, 
          inline: true 
        }
      )
      .setFooter({ text: `ID: ${reminderId}` })
      .setTimestamp();
    
    if (reminder.recurring) {
      embed.addFields({
        name: '🔄 Répétition',
        value: reminder.recurring,
        inline: true
      });
    }
    
    // Envoyer le rappel
    try {
      if (reminder.isPrivate) {
        // Envoyer en MP
        const user = await client.users.fetch(reminder.userId);
        await user.send({ embeds: [embed] });
      } else if (reminder.channelId) {
        // Envoyer dans le salon
        const channel = await client.channels.fetch(reminder.channelId);
        if (channel && channel.isTextBased()) {
          await (channel as TextChannel).send({
            content: `<@${reminder.userId}>`,
            embeds: [embed]
          });
        }
      }
      
      console.log(`✅ Rappel ${reminderId} envoyé à ${reminder.userId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi du rappel ${reminderId}:`, error);
    }
    
    // Gérer la répétition ou marquer comme complété
    if (reminder.recurring && reminder.recurring !== 'non') {
      // Calculer le prochain rappel
      let nextDelay = 0;
      
      switch (reminder.recurring) {
        case 'quotidien':
          nextDelay = 24 * 60 * 60 * 1000; // 1 jour
          break;
        case 'hebdomadaire':
          nextDelay = 7 * 24 * 60 * 60 * 1000; // 7 jours
          break;
        case 'mensuel':
          nextDelay = 30 * 24 * 60 * 60 * 1000; // 30 jours
          break;
      }
      
      if (nextDelay > 0) {
        const nextTime = Date.now() + nextDelay;
        updateReminderTime(reminderId, nextTime);
        scheduleReminder(reminderId);
        console.log(`🔄 Rappel ${reminderId} replanifié pour ${new Date(nextTime).toISOString()}`);
      }
    } else {
      // Marquer comme complété
      updateReminderStatus(reminderId, 'completed');
      activeTimeouts.delete(reminderId);
      console.log(`✅ Rappel ${reminderId} complété`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution du rappel ${reminderId}:`, error);
  }
};

/**
 * Annuler un rappel
 */
export const cancelScheduledReminder = (reminderId: string): boolean => {
  if (activeTimeouts.has(reminderId)) {
    clearTimeout(activeTimeouts.get(reminderId)!);
    activeTimeouts.delete(reminderId);
    updateReminderStatus(reminderId, 'cancelled');
    console.log(`❌ Rappel ${reminderId} annulé`);
    return true;
  }
  return false;
};

/**
 * Obtenir le nombre de rappels actifs en mémoire
 */
export const getActiveReminderCount = (): number => {
  return activeTimeouts.size;
};

