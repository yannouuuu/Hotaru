import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { logAction } from '../../utils/logger.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un membre du serveur')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre à expulser')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('La raison de l\'expulsion')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';

    if (!member || typeof member === 'string') {
      await interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
      return;
    }

    if (!('kickable' in member) || !member.kickable) {
      await interaction.reply({ content: '❌ Je ne peux pas expulser ce membre.', ephemeral: true });
      return;
    }

    try {
      await member.kick(reason);
      
      await logAction(
        interaction.client as any,
        'Expulsion',
        interaction.user.tag,
        member.user.tag,
        reason,
        0xe74c3c,
        'moderation'
      );

      await interaction.reply({
        content: `✅ ${member.user.tag} a été expulsé.\n**Raison:** ${reason}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Erreur lors de l\'expulsion:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
    }
  },
};

export default command;

