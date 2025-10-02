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
    .addStringOption(option =>
      option
        .setName('apres')
        .setDescription('ID du message : supprimer les messages au-dessus de ce message')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('contient')
        .setDescription('Supprimer uniquement les messages contenant ce texte')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('bots')
        .setDescription('Supprimer uniquement les messages des bots')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('nombre', true);
    const targetUser = interaction.options.getUser('utilisateur');
    const afterMessageId = interaction.options.getString('apres');
    const containsText = interaction.options.getString('contient');
    const botsOnly = interaction.options.getBoolean('bots');

    if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
      await interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un salon textuel.', ephemeral: true });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      // Récupérer les messages
      let fetchOptions: any = { limit: amount };
      if (afterMessageId) {
        fetchOptions.after = afterMessageId;
      }

      const messages = await interaction.channel.messages.fetch(fetchOptions);
      
      // Filtrer les messages selon les critères
      let messagesToDelete = messages;
      
      // Filtre par utilisateur
      if (targetUser) {
        messagesToDelete = messagesToDelete.filter(msg => msg.author.id === targetUser.id);
      }
      
      // Filtre par contenu
      if (containsText) {
        messagesToDelete = messagesToDelete.filter(msg => 
          msg.content.toLowerCase().includes(containsText.toLowerCase())
        );
      }
      
      // Filtre bots uniquement
      if (botsOnly) {
        messagesToDelete = messagesToDelete.filter(msg => msg.author.bot);
      }

      if (messagesToDelete.size === 0) {
        await interaction.editReply({ 
          content: '⚠️ Aucun message trouvé correspondant aux critères.' 
        });
        return;
      }

      const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);
      
      // Construire le message de log
      let filterDescription = `${deleted.size} message(s) supprimé(s)`;
      const filters = [];
      if (targetUser) filters.push(`Utilisateur: ${targetUser.tag}`);
      if (afterMessageId) filters.push(`Après message ID: ${afterMessageId}`);
      if (containsText) filters.push(`Contenant: "${containsText}"`);
      if (botsOnly) filters.push('Bots uniquement');
      
      if (filters.length > 0) {
        filterDescription += `\nFiltres: ${filters.join(', ')}`;
      }
      
      await logAction(
        interaction.client as any,
        'Suppression de messages',
        interaction.user.tag,
        targetUser?.tag,
        filterDescription,
        0x9b59b6,
        'moderation'
      );

      // Message de confirmation
      let confirmMessage = `✅ ${deleted.size} message(s) supprimé(s)`;
      if (targetUser) confirmMessage += ` de ${targetUser.tag}`;
      if (containsText) confirmMessage += ` contenant "${containsText}"`;
      if (botsOnly) confirmMessage += ' (bots)';
      if (afterMessageId) confirmMessage += ` au-dessus du message ${afterMessageId}`;

      await interaction.editReply({ content: confirmMessage });

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
      await interaction.editReply({ 
        content: '❌ Une erreur est survenue. Les messages de plus de 14 jours ne peuvent pas être supprimés en masse.' 
      });
    }
  },
};

export default command;

