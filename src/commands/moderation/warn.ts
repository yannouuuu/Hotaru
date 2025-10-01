import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { logAction } from '../../utils/logger.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un membre')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre à avertir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('raison')
        .setDescription('La raison de l\'avertissement')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.options.getMember('membre');
    const reason = interaction.options.getString('raison', true);

    if (!member || typeof member === 'string' || !('user' in member)) {
      await interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
      return;
    }

    try {
      const warnEmbed = new EmbedBuilder()
        .setColor(0xf39c12)
        .setTitle('⚠️ Avertissement')
        .setDescription(`Vous avez reçu un avertissement sur le serveur **${interaction.guild?.name}**.`)
        .addFields({ name: 'Raison', value: reason })
        .setTimestamp();

      try {
        if ('send' in member) {
          await member.send({ embeds: [warnEmbed] });
        }
      } catch {
        console.log(`Impossible d'envoyer un MP à ${member.user.tag}`);
      }
      
      await logAction(
        interaction.client as any,
        'Avertissement',
        interaction.user.tag,
        member.user.tag,
        reason,
        0xf39c12,
        'moderation'
      );

      await interaction.reply({
        content: `✅ ${member.user.tag} a été averti.\n**Raison:** ${reason}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Erreur lors de l\'avertissement:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
    }
  },
};

export default command;

