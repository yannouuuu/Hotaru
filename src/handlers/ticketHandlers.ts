/**
 * Gestionnaire des tickets de support
 * Création et fermeture de tickets avec salons privés
 */

import { 
  ButtonInteraction,
  EmbedBuilder, 
  ChannelType, 
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel
} from 'discord.js';
import type { BotClient } from '../types/index.ts';

const activeTickets = new Map<string, string>();

export const handleTicketCreate = async (interaction: ButtonInteraction, client: BotClient): Promise<void> => {
  await interaction.deferReply({ ephemeral: true });

  try {
    console.log('🎫 Tentative de création de ticket par:', interaction.user.tag);
    
    // Vérifier si l'utilisateur a déjà un ticket ouvert
    if (activeTickets.has(interaction.user.id)) {
      const channelId = activeTickets.get(interaction.user.id);
      console.log('⚠️ Ticket déjà existant');
      await interaction.editReply({
        content: `❌ Vous avez déjà un ticket ouvert: <#${channelId}>`,
      });
      return;
    }

    if (!interaction.guild) {
      console.log('❌ Pas de guild');
      await interaction.editReply({ content: '❌ Erreur: serveur introuvable.' });
      return;
    }

    console.log('📁 Catégorie tickets ID:', process.env.CATEGORY_TICKETS_ID || 'undefined');
    console.log('🏰 Guild:', interaction.guild.name);
    console.log('👤 User:', interaction.user.username);

    // Vérifier si la catégorie existe
    const categoryId = process.env.CATEGORY_TICKETS_ID;
    let parentCategory = undefined;
    
    if (categoryId) {
      const category = interaction.guild.channels.cache.get(categoryId);
      if (category && category.type === ChannelType.GuildCategory) {
        parentCategory = categoryId;
        console.log('✅ Catégorie trouvée:', category.name);
      } else {
        console.warn('⚠️ Catégorie non trouvée, création sans parent');
      }
    }

    // Créer le salon de ticket
    console.log('🔨 Création du salon...');
    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: parentCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });
    
    console.log('✅ Salon créé:', ticketChannel.name, ticketChannel.id);

    // Sauvegarder le ticket en mémoire
    activeTickets.set(interaction.user.id, ticketChannel.id);

    // Message dans le ticket
    const ticketEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🎫 Nouveau ticket')
      .setDescription(
        `Bonjour ${interaction.user} !\n\n` +
        'Merci d\'avoir ouvert un ticket. Un membre de l\'équipe va vous répondre sous peu.\n' +
        'Décrivez votre problème ou votre question en détail.\n\n' +
        '**Pour fermer ce ticket, cliquez sur le bouton ci-dessous.**'
      )
      .setFooter({ text: `Ticket créé le ${new Date().toLocaleString('fr-FR')}` })
      .setTimestamp();

    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Fermer le ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

    await ticketChannel.send({ 
      content: `${interaction.user}`,
      embeds: [ticketEmbed], 
      components: [row] 
    });

    await interaction.editReply({
      content: `✅ Ticket créé ! Rendez-vous dans ${ticketChannel}`,
    });
  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error);
    await interaction.editReply({
      content: '❌ Une erreur est survenue lors de la création du ticket.',
    });
  }
};

// Fermer le ticket
export const handleTicketClose = async (
  interaction: ButtonInteraction,
  client: BotClient
): Promise<void> => {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Trouver l'utilisateur du ticket
    let ticketUserId: string | undefined;
    for (const [userId, channelId] of activeTickets.entries()) {
      if (channelId === interaction.channelId) {
        ticketUserId = userId;
        break;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🔒 Ticket fermé')
      .setDescription(`Ce ticket a été fermé par ${interaction.user}\n\nLe salon sera supprimé dans 5 secondes...`)
      .setTimestamp();

    await (interaction.channel as TextChannel)?.send({ embeds: [embed] });
    await interaction.editReply({ content: '✅ Le ticket sera supprimé dans 5 secondes...' });

    // Retirer du Map
    if (ticketUserId) {
      activeTickets.delete(ticketUserId);
    }

    setTimeout(async () => {
      try {
        await interaction.channel?.delete();
      } catch (error) {
        console.error('Erreur lors de la suppression du salon:', error);
      }
    }, 5000);
  } catch (error) {
    console.error('Erreur:', error);
    await interaction.editReply({ content: '❌ Une erreur est survenue.' });
  }
};

