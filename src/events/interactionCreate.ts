import { Events, ChatInputCommandInteraction, ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import type { BotClient } from '../types/index.ts';
import { handleTicketCreate, handleTicketClose } from '../handlers/ticketHandlers.ts';
import { handleVerifyModal } from '../handlers/verifyHandlers.ts';
import { handleQuoteModal } from '../handlers/quoteHandlers.ts';
import { handleCleanupButtons } from '../commands/setup/cleanup.ts';
import { handleLinksMenu } from '../handlers/linksHandlers.ts';
import { handleRoleToggle } from '../handlers/rolesHandlers.ts';
import { handlePanelActions } from '../handlers/panelHandlers.ts';
import { handleReminderButtons } from '../handlers/reminderHandlers.ts';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction, client: BotClient) {
    // Gérer les commandes slash
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`Commande inconnue: ${interaction.commandName}`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Erreur lors de l'exécution de ${interaction.commandName}:`, error);
        
        const errorMessage = {
          content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.',
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Gérer les select menus
    if (interaction.isStringSelectMenu()) {
      const { customId } = interaction;

      if (customId === 'links_menu') {
        await handleLinksMenu(interaction);
      } else if (customId === 'channel_refresh_select') {
        const { handleChannelRefreshSelect } = await import('../handlers/channelManagerHandlers.ts');
        await handleChannelRefreshSelect(interaction);
      }
    }

    // Gérer les boutons
    if (interaction.isButton()) {
      const { customId } = interaction;

      // Gérer les boutons de tickets
      if (customId === 'create_ticket') {
        await handleTicketCreate(interaction, client);
      } else if (customId === 'close_ticket') {
        await handleTicketClose(interaction, client);
      }
      // Gérer les boutons de rôles
      else if (customId.startsWith('toggle_')) {
        await handleRoleToggle(interaction);
      }
      // Gérer les boutons du panel de contrôle
      else if (customId.startsWith('refresh_') || customId === 'git_pull' || customId === 'manage_channels' || customId.startsWith('git_pull_')) {
        await handlePanelActions(interaction);
      }
      // Gérer les boutons de rafraîchissement des salons
      else if (customId.startsWith('confirm_refresh_') || customId === 'cancel_refresh') {
        const { handleChannelRefreshConfirm } = await import('../handlers/channelManagerHandlers.ts');
        await handleChannelRefreshConfirm(interaction);
      }
      // Gérer les boutons de cleanup
      else if (customId.startsWith('cleanup_')) {
        await handleCleanupButtons(interaction);
      }
      // Gérer les boutons de rappels
      else if (customId.startsWith('reminder_')) {
        await handleReminderButtons(interaction);
      }
    }

    // Gérer les modals
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;

      if (customId === 'verify_modal') {
        await handleVerifyModal(interaction, client);
      } else if (customId === 'quote_modal') {
        await handleQuoteModal(interaction, client);
      }
    }
  },
};

