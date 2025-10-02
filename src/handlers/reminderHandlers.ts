/**
 * Handlers pour les interactions liées aux rappels
 */

import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { cancelReminder, cancelAllUserReminders } from '../utils/database.ts';
import { cancelScheduledReminder } from '../utils/reminderManager.ts';

/**
 * Gérer les boutons d'annulation de rappels
 */
export const handleReminderButtons = async (interaction: ButtonInteraction): Promise<void> => {
  const { customId } = interaction;
  
  // Annuler tous les rappels
  if (customId === 'reminder_cancel_all') {
    try {
      const cancelled = cancelAllUserReminders(interaction.user.id);
      
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('❌ Rappels annulés')
        .setDescription(`✅ ${cancelled} rappel(s) ont été annulés avec succès.`)
        .setTimestamp();
      
      await interaction.update({
        embeds: [embed],
        components: []
      });
    } catch (error) {
      console.error('Erreur lors de l\'annulation des rappels:', error);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de l\'annulation des rappels.',
        flags: 64
      });
    }
    return;
  }
  
  // Annuler un rappel spécifique
  if (customId.startsWith('reminder_cancel_')) {
    const reminderId = customId.replace('reminder_cancel_', '');
    
    try {
      const success = cancelReminder(reminderId);
      
      if (success) {
        // Annuler également le timeout
        cancelScheduledReminder(reminderId);
        
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('❌ Rappel annulé')
          .setDescription('✅ Votre rappel a été annulé avec succès.')
          .setFooter({ text: `ID: ${reminderId}` })
          .setTimestamp();
        
        await interaction.update({
          embeds: [embed],
          components: []
        });
      } else {
        await interaction.reply({
          content: '⚠️ Ce rappel n\'existe pas ou a déjà été annulé.',
          flags: 64
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation du rappel:', error);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de l\'annulation du rappel.',
        flags: 64
      });
    }
  }
};

