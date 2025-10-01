import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types/index.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('voice-kick')
    .setDescription('Expulser quelqu\'un de votre salon vocal privé')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('L\'utilisateur à expulser')
        .setRequired(true)
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const targetUser = interaction.options.getUser('utilisateur', true);

      if (!interaction.guild) {
        await interaction.editReply('❌ Erreur: serveur introuvable.');
        return;
      }

      // Vérifier que l'utilisateur est dans un vocal
      const voiceState = interaction.guild.members.cache.get(interaction.user.id)?.voice;
      if (!voiceState?.channel) {
        await interaction.editReply('❌ Vous devez être dans un salon vocal.');
        return;
      }

      const voiceChannel = voiceState.channel;

      // Vérifier que c'est un salon privé
      if (!voiceChannel.name.startsWith('🔒')) {
        await interaction.editReply('❌ Cette commande fonctionne uniquement dans les salons vocaux privés.');
        return;
      }

      // Vérifier les permissions
      const permissions = voiceChannel.permissionsFor(interaction.user.id);
      if (!permissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.editReply('❌ Vous n\'êtes pas le propriétaire de ce salon.');
        return;
      }

      // Retirer les permissions
      await voiceChannel.permissionOverwrites.delete(targetUser.id);

      // Déconnecter l'utilisateur s'il est dans le salon
      const targetMember = interaction.guild.members.cache.get(targetUser.id);
      if (targetMember?.voice.channelId === voiceChannel.id) {
        await targetMember.voice.disconnect('Expulsé du salon vocal privé');
      }

      await interaction.editReply({
        content: `✅ ${targetUser.tag} a été expulsé de ${voiceChannel.name} !`
      });
    } catch (error) {
      console.error('Erreur lors de l\'expulsion:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue.',
      });
    }
  },
};

export default command;

