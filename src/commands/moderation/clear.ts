import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { logAction } from '../../utils/logger.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprimer des messages')
    .addIntegerOption(option =>
      option
        .setName('nombre')
        .setDescription('Nombre de messages à supprimer (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Supprimer uniquement les messages de cet utilisateur')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('nombre', true);
    const targetUser = interaction.options.getUser('utilisateur');

    if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
      await interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un salon textuel.', ephemeral: true });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      const messages = await interaction.channel.messages.fetch({ limit: amount });
      
      let messagesToDelete = messages;
      if (targetUser) {
        messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
      }

      const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);
      
      await logAction(
        interaction.client as any,
        'Suppression de messages',
        interaction.user.tag,
        targetUser?.tag,
        `${deleted.size} message(s) supprimé(s)`,
        0x9b59b6,
        'moderation'
      );

      await interaction.editReply({
        content: `✅ ${deleted.size} message(s) supprimé(s).${targetUser ? ` (de ${targetUser.tag})` : ''}`,
      });

      // Supprimer le message de confirmation après 5 secondes
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (error) {
          console.error('Erreur lors de la suppression du message de confirmation:', error);
        }
      }, 5000);
    } catch (error) {
      console.error('Erreur lors de la suppression des messages:', error);
      await interaction.editReply({ content: '❌ Une erreur est survenue. Les messages de plus de 14 jours ne peuvent pas être supprimés en masse.' });
    }
  },
};

export default command;

