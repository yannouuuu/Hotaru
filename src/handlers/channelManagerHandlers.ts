import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { refreshSupport } from './panelHandlers.ts';
import { refreshLinks } from './panelHandlers.ts';
import { refreshVerify } from './panelHandlers.ts';
import { refreshRoles } from './panelHandlers.ts';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Handler principal pour la gestion des salons
export const handleChannelManagement = async (interaction: ButtonInteraction) => {
  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('🔄 Rafraîchir les Salons')
    .setDescription(
      '**Rafraîchir un salon individuellement**\n\n' +
      'Sélectionnez le salon que vous souhaitez recréer.\n' +
      'Cela supprimera l\'ancien et le recréera avec le code actuel.\n\n' +
      '⚠️ **Attention :** Les messages seront perdus (sauf messages du panel)'
    )
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('channel_refresh_select')
    .setPlaceholder('Choisissez un salon à rafraîchir')
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel('🎟️ Support')
        .setDescription('Salon avec le système de tickets')
        .setValue('support')
        .setEmoji('🎟️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔗 Liens Utiles')
        .setDescription('Salon avec le menu de liens')
        .setValue('links')
        .setEmoji('🔗'),
      new StringSelectMenuOptionBuilder()
        .setLabel('✅ Vérification')
        .setDescription('Salon de vérification des étudiants')
        .setValue('verify')
        .setEmoji('✅'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🎭 Rôles')
        .setDescription('Salon de sélection des rôles')
        .setValue('roles')
        .setEmoji('🎭'),
    ]);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
};

// Handler pour la sélection du salon à rafraîchir
export const handleChannelRefreshSelect = async (interaction: StringSelectMenuInteraction) => {
  const channelType = interaction.values[0];
  
  if (!channelType) {
    await interaction.reply({ content: '❌ Erreur : type de salon invalide.', ephemeral: true });
    return;
  }

  // Demander confirmation avant de supprimer
  const confirmEmbed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('⚠️ Confirmation de rafraîchissement')
    .setDescription(
      `Vous êtes sur le point de rafraîchir le salon **${getChannelLabel(channelType)}**.\n\n` +
      '**Ce qui va se passer :**\n' +
      '• L\'ancien salon sera supprimé\n' +
      '• Un nouveau salon sera créé avec le code actuel\n' +
      '• Le message principal sera recréé\n' +
      '• Les anciens messages seront perdus\n\n' +
      '⚠️ Voulez-vous continuer ?'
    )
    .setTimestamp();

  const confirmButton = new ButtonBuilder()
    .setCustomId(`confirm_refresh_${channelType}`)
    .setLabel('Rafraîchir')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('🔄');

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel_refresh')
    .setLabel('Annuler')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton, confirmButton);

  await interaction.update({
    embeds: [confirmEmbed],
    components: [row],
  });
};

// Handler pour la confirmation du rafraîchissement
export const handleChannelRefreshConfirm = async (interaction: ButtonInteraction) => {
  const channelType = interaction.customId.replace('confirm_refresh_', '');

  if (channelType === 'cancel_refresh' || interaction.customId === 'cancel_refresh') {
    await interaction.update({
      content: '❌ Rafraîchissement annulé.',
      embeds: [],
      components: [],
    });
    return;
  }

  await interaction.update({
    content: '🔄 Rafraîchissement en cours...',
    embeds: [],
    components: [],
  });

  try {
    // Utiliser les fonctions de refresh existantes
    switch (channelType) {
      case 'support':
        await refreshSupport(interaction);
        break;
      case 'links':
        await refreshLinks(interaction);
        break;
      case 'verify':
        await refreshVerify(interaction);
        break;
      case 'roles':
        await refreshRoles(interaction);
        break;
      default:
        await interaction.followUp({
          content: '❌ Type de salon non supporté pour le rafraîchissement automatique.',
          ephemeral: true,
        });
    }
  } catch (error) {
    console.error('Erreur lors du rafraîchissement:', error);
    await interaction.followUp({
      content: '❌ Une erreur est survenue lors du rafraîchissement du salon.',
      ephemeral: true,
    });
  }
};

// Fonction helper pour obtenir le label du salon
function getChannelLabel(type: string): string {
  const labels: Record<string, string> = {
    support: '🎟️ Support',
    links: '🔗 Liens Utiles',
    verify: '✅ Vérification',
    roles: '🎭 Rôles',
    welcome: '👋 Bienvenue',
    quotes: '💬 Citations',
    pictures: '📸 Photos',
    polls: '📊 Sondages',
    logs_bots: '🤖 Logs Bots',
    logs_moderation: '🛡️ Logs Modération',
    logs_server: '📋 Logs Serveur',
    panel: '⚙️ Panel Contrôle',
  };
  return labels[type] || '📝 Salon';
}
