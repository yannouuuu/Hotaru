import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, PermissionFlagsBits } from 'discord.js';
import type { Command } from '../../types/index.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('private-voice')
    .setDescription('Créer un salon vocal privé temporaire')
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription('Nom du salon vocal')
        .setRequired(false)
        .setMaxLength(50)
    )
    .addIntegerOption(option =>
      option
        .setName('limite')
        .setDescription('Nombre maximum de personnes (par défaut: 5)')
        .setMinValue(2)
        .setMaxValue(20)
        .setRequired(false)
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const voiceName = interaction.options.getString('nom') || `Salon de ${interaction.user.username}`;
      const userLimit = interaction.options.getInteger('limite') || 5;
      const categoryVoiceId = process.env.CATEGORY_VOICE_ID;

      if (!interaction.guild) {
        await interaction.editReply('❌ Erreur: serveur introuvable.');
        return;
      }

      // Créer le salon vocal privé
      const voiceChannel = await interaction.guild.channels.create({
        name: `🔒 ${voiceName}`,
        type: ChannelType.GuildVoice,
        parent: categoryVoiceId || undefined,
        userLimit: userLimit,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
            ],
          },
        ],
      });

      await interaction.editReply({
        content: `✅ Salon vocal privé créé : ${voiceChannel}\n\n` +
          `🔒 **Propriétaire** : Vous\n` +
          `👥 **Limite** : ${userLimit} personne(s)\n\n` +
          `**Pour inviter quelqu'un** : \`/voice-invite\`\n` +
          `**Pour expulser quelqu'un** : \`/voice-kick\`\n` +
          `**Pour supprimer le salon** : \`/voice-delete\`\n\n` +
          `⚠️ Le salon sera automatiquement supprimé s'il reste vide pendant 5 minutes.`
      });

    } catch (error) {
      console.error('Erreur lors de la création du salon vocal:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue lors de la création du salon vocal.',
      });
    }
  },
};

export default command;

