import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import type { Command } from '../../types/index.ts';
import { createReminder } from '../../utils/database.ts';
import { scheduleReminder } from '../../utils/reminderManager.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('📝 Créer un rappel personnel')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Le message de rappel')
        .setRequired(true)
        .setMaxLength(500)
    )
    .addIntegerOption(option =>
      option
        .setName('temps')
        .setDescription('Le délai avant le rappel')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(9999)
    )
    .addStringOption(option =>
      option
        .setName('unite')
        .setDescription('L\'unité de temps')
        .setRequired(true)
        .addChoices(
          { name: '⏱️ Minutes', value: 'minutes' },
          { name: '🕐 Heures', value: 'heures' },
          { name: '📅 Jours', value: 'jours' },
          { name: '📆 Semaines', value: 'semaines' }
        )
    )
    .addBooleanOption(option =>
      option
        .setName('prive')
        .setDescription('Recevoir le rappel en message privé (défaut: dans le salon actuel)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('repeter')
        .setDescription('Répéter le rappel automatiquement')
        .setRequired(false)
        .addChoices(
          { name: '🔄 Non (une seule fois)', value: 'non' },
          { name: '🔁 Quotidien', value: 'quotidien' },
          { name: '📅 Hebdomadaire', value: 'hebdomadaire' },
          { name: '📆 Mensuel', value: 'mensuel' }
        )
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString('message', true);
    const temps = interaction.options.getInteger('temps', true);
    const unite = interaction.options.getString('unite', true);
    const prive = interaction.options.getBoolean('prive') ?? false;
    const repeter = interaction.options.getString('repeter') ?? 'non';

    // Calculer le timestamp du rappel
    const now = Date.now();
    let delaiMs = 0;

    switch (unite) {
      case 'minutes':
        delaiMs = temps * 60 * 1000;
        break;
      case 'heures':
        delaiMs = temps * 60 * 60 * 1000;
        break;
      case 'jours':
        delaiMs = temps * 24 * 60 * 60 * 1000;
        break;
      case 'semaines':
        delaiMs = temps * 7 * 24 * 60 * 60 * 1000;
        break;
    }

    const reminderTime = now + delaiMs;

    // Vérifier que le délai n'est pas trop court (minimum 1 minute)
    if (delaiMs < 60 * 1000) {
      await interaction.reply({
        content: '⚠️ Le délai minimum pour un rappel est de 1 minute.',
        flags: 64
      });
      return;
    }

    // Vérifier que le délai n'est pas trop long (maximum 1 an)
    if (delaiMs > 365 * 24 * 60 * 60 * 1000) {
      await interaction.reply({
        content: '⚠️ Le délai maximum pour un rappel est de 1 an.',
        flags: 64
      });
      return;
    }

    try {
      // Créer le rappel dans la base de données
      const reminderId = createReminder({
        userId: interaction.user.id,
        channelId: prive ? null : interaction.channelId,
        guildId: interaction.guildId,
        message: message,
        reminderTime: reminderTime,
        isPrivate: prive,
        recurring: repeter !== 'non' ? repeter : null,
        originalDelay: delaiMs,
        createdAt: now,
        status: 'active'
      });

      // Programmer le rappel
      scheduleReminder(reminderId);

      // Formater la date du rappel
      const reminderDate = new Date(reminderTime);
      const formattedDate = `<t:${Math.floor(reminderTime / 1000)}:F>`;
      const relativeTime = `<t:${Math.floor(reminderTime / 1000)}:R>`;

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('⏰ Rappel créé avec succès !')
        .setDescription(`Je te rappellerai ${relativeTime}`)
        .addFields(
          { name: '📝 Message', value: message, inline: false },
          { name: '📅 Date et heure', value: formattedDate, inline: false },
          { name: '⏱️ Dans', value: `${temps} ${unite}`, inline: true },
          { name: '📍 Où', value: prive ? '📨 Message privé' : '💬 Dans ce salon', inline: true }
        )
        .setFooter({ text: `ID du rappel: ${reminderId}` })
        .setTimestamp();

      if (repeter !== 'non') {
        embed.addFields({ 
          name: '🔄 Répétition', 
          value: repeter.charAt(0).toUpperCase() + repeter.slice(1), 
          inline: true 
        });
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`reminder_cancel_${reminderId}`)
          .setLabel('❌ Annuler ce rappel')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: prive ? 64 : undefined
      });

    } catch (error) {
      console.error('Erreur lors de la création du rappel:', error);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de la création du rappel.',
        flags: 64
      });
    }
  },
};

export default command;

