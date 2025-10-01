import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types/index.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('voice-delete')
    .setDescription('Supprimer votre salon vocal privé')
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
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

      const channelName = voiceChannel.name;
      
      await interaction.editReply({
        content: `✅ Le salon **${channelName}** sera supprimé dans 3 secondes...`
      });

      setTimeout(async () => {
        try {
          await voiceChannel.delete();
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
        }
      }, 3000);

    } catch (error) {
      console.error('Erreur:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue.',
      });
    }
  },
};

export default command;

