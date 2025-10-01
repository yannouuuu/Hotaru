import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types/index.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('voice-invite')
    .setDescription('Inviter quelqu\'un dans votre salon vocal privé')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('L\'utilisateur à inviter')
        .setRequired(true)
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const targetUser = interaction.options.getUser('utilisateur', true);
      const member = interaction.member;

      if (!member || !interaction.guild) {
        await interaction.editReply('❌ Erreur: données introuvables.');
        return;
      }

      // Vérifier que l'utilisateur est dans un vocal
      const voiceState = interaction.guild.members.cache.get(interaction.user.id)?.voice;
      if (!voiceState?.channel) {
        await interaction.editReply('❌ Vous devez être dans un salon vocal pour utiliser cette commande.');
        return;
      }

      const voiceChannel = voiceState.channel;

      // Vérifier que c'est un salon privé (commence par 🔒)
      if (!voiceChannel.name.startsWith('🔒')) {
        await interaction.editReply('❌ Cette commande fonctionne uniquement dans les salons vocaux privés.');
        return;
      }

      // Vérifier les permissions de l'utilisateur
      const permissions = voiceChannel.permissionsFor(interaction.user.id);
      if (!permissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.editReply('❌ Vous n\'êtes pas le propriétaire de ce salon.');
        return;
      }

      // Ajouter les permissions pour l'utilisateur invité
      await voiceChannel.permissionOverwrites.create(targetUser.id, {
        ViewChannel: true,
        Connect: true,
        Speak: true,
      });

      await interaction.editReply({
        content: `✅ ${targetUser.tag} a été invité dans ${voiceChannel.name} !\n\nIl peut maintenant rejoindre le salon.`
      });
    } catch (error) {
      console.error('Erreur lors de l\'invitation:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue.',
      });
    }
  },
};

export default command;

