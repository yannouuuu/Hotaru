import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { logAction } from '../../utils/logger.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Mettre un membre en timeout')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre à timeout')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('durée')
        .setDescription('Durée en minutes')
        .setMinValue(1)
        .setMaxValue(40320) // 28 jours max
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('La raison du timeout')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.options.getMember('membre');
    const duration = interaction.options.getInteger('durée', true);
    const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';

    if (!member || typeof member === 'string') {
      await interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
      return;
    }

    if (!('moderatable' in member) || !member.moderatable) {
      await interaction.reply({ content: '❌ Je ne peux pas timeout ce membre.', ephemeral: true });
      return;
    }

    try {
      const durationMs = duration * 60 * 1000;
      await member.timeout(durationMs, reason);
      
      await logAction(
        interaction.client as any,
        'Timeout',
        interaction.user.tag,
        member.user.tag,
        `${reason} (${duration} minutes)`,
        0xf39c12,
        'moderation'
      );

      await interaction.reply({
        content: `✅ ${member.user.tag} a été mis en timeout pour ${duration} minute(s).\n**Raison:** ${reason}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Erreur lors du timeout:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
    }
  },
};

export default command;

