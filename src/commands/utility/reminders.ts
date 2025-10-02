import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import type { Command } from '../../types/index.ts';
import { getUserReminders, cancelReminder } from '../../utils/database.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('reminders')
    .setDescription('📋 Voir tous vos rappels actifs')
    .addStringOption(option =>
      option
        .setName('filtre')
        .setDescription('Filtrer les rappels')
        .setRequired(false)
        .addChoices(
          { name: '🔔 Tous', value: 'tous' },
          { name: '⏳ Actifs', value: 'active' },
          { name: '✅ Complétés', value: 'completed' },
          { name: '❌ Annulés', value: 'cancelled' }
        )
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const filtre = interaction.options.getString('filtre') ?? 'active';
    
    try {
      const reminders = getUserReminders(
        interaction.user.id, 
        filtre === 'tous' ? undefined : filtre as 'active' | 'completed' | 'cancelled'
      );

      if (reminders.length === 0) {
        const noRemindersEmbed = new EmbedBuilder()
          .setColor(0x95a5a6)
          .setTitle('📋 Aucun rappel')
          .setDescription(
            filtre === 'active' 
              ? '🔕 Tu n\'as aucun rappel actif pour le moment.\n\nUtilise `/remind` pour en créer un !' 
              : `🔕 Aucun rappel ${filtre === 'completed' ? 'complété' : filtre === 'cancelled' ? 'annulé' : ''} trouvé.`
          )
          .setTimestamp();

        await interaction.reply({
          embeds: [noRemindersEmbed],
          flags: 64
        });
        return;
      }

      // Limiter à 10 rappels par page
      const remindersPerPage = 10;
      const totalPages = Math.ceil(reminders.length / remindersPerPage);
      const page = 0; // Première page

      const startIdx = page * remindersPerPage;
      const endIdx = startIdx + remindersPerPage;
      const pageReminders = reminders.slice(startIdx, endIdx);

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('📋 Vos rappels')
        .setDescription(
          `Vous avez **${reminders.length}** rappel(s) ${
            filtre === 'active' ? 'actif(s)' : 
            filtre === 'completed' ? 'complété(s)' : 
            filtre === 'cancelled' ? 'annulé(s)' : ''
          }`
        )
        .setFooter({ text: `Page 1/${totalPages} • Total: ${reminders.length} rappel(s)` })
        .setTimestamp();

      // Ajouter chaque rappel comme field
      pageReminders.forEach((reminder, index) => {
        const actualIndex = startIdx + index + 1;
        const relativeTime = `<t:${Math.floor(reminder.reminderTime / 1000)}:R>`;
        const fullTime = `<t:${Math.floor(reminder.reminderTime / 1000)}:F>`;
        
        let statusEmoji = '';
        switch (reminder.status) {
          case 'active':
            statusEmoji = '⏳';
            break;
          case 'completed':
            statusEmoji = '✅';
            break;
          case 'cancelled':
            statusEmoji = '❌';
            break;
        }

        let fieldValue = `${statusEmoji} **${reminder.message}**\n`;
        fieldValue += `📅 ${fullTime} (${relativeTime})\n`;
        fieldValue += `📍 ${reminder.isPrivate ? 'Message privé' : 'Dans un salon'}`;
        
        if (reminder.recurring) {
          fieldValue += `\n🔄 Répétition: ${reminder.recurring}`;
        }
        
        fieldValue += `\n🆔 \`${reminder.id}\``;

        embed.addFields({
          name: `${actualIndex}. Rappel`,
          value: fieldValue,
          inline: false
        });
      });

      // Boutons pour annuler les rappels actifs
      const components: ActionRowBuilder<ButtonBuilder>[] = [];
      
      if (filtre === 'active' && reminders.length > 0) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('reminder_cancel_all')
            .setLabel('❌ Annuler tous les rappels')
            .setStyle(ButtonStyle.Danger)
        );
        components.push(row);
      }

      await interaction.reply({
        embeds: [embed],
        components: components,
        flags: 64
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des rappels:', error);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de la récupération de vos rappels.',
        flags: 64
      });
    }
  },
};

export default command;

