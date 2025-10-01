import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { logAction } from '../../utils/logger.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un membre du serveur')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre à bannir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('La raison du bannissement')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('jours')
        .setDescription('Nombre de jours de messages à supprimer (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
    const deleteMessageDays = interaction.options.getInteger('jours') || 0;

    if (!member || typeof member === 'string') {
      await interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
      return;
    }

    if (!('bannable' in member) || !member.bannable) {
      await interaction.reply({ content: '❌ Je ne peux pas bannir ce membre.', ephemeral: true });
      return;
    }

    try {
      await member.ban({ 
        reason,
        deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60
      });
      
      await logAction(
        interaction.client as any,
        'Bannissement',
        interaction.user.tag,
        member.user.tag,
        reason,
        0xe74c3c,
        'moderation'
      );

      await interaction.reply({
        content: `✅ ${member.user.tag} a été banni.\n**Raison:** ${reason}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
    }
  },
};

export default command;

