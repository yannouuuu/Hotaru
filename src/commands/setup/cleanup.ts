import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ChannelType
} from 'discord.js';
import type { Command } from '../../types/index.ts';
import Database from 'better-sqlite3';
import { join } from 'path';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('cleanup')
    .setDescription('⚠️ DANGER - Nettoyer complètement le serveur (salons, rôles, base de données)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const warningEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('⚠️ ATTENTION - Nettoyage complet du serveur')
      .setDescription(
        '**Cette action est IRRÉVERSIBLE et va supprimer :**\n\n' +
        '🗑️ Tous les salons créés par le bot\n' +
        '🗑️ Tous les rôles créés par le bot\n' +
        '🗑️ Toute la base de données (citations, tickets, vérifications)\n\n' +
        '**⚠️ CETTE ACTION NE PEUT PAS ÊTRE ANNULÉE ⚠️**\n\n' +
        '**Salons qui seront supprimés :**\n' +
        '• Tous les salons dans les catégories GÉNÉRAL, INFORMATIONS, TICKETS, PUBLIC\n' +
        '• Les catégories elles-mêmes\n\n' +
        '**Rôles qui seront supprimés :**\n' +
        '• Admin, Délégué, Support, Vérifié, Étudiant, Bot/Hotaru\n\n' +
        '**Êtes-vous ABSOLUMENT sûr de vouloir continuer ?**'
      )
      .setFooter({ text: 'Cette action est destinée aux tests uniquement !' })
      .setTimestamp();

    const confirmButton = new ButtonBuilder()
      .setCustomId('cleanup_confirm_step1')
      .setLabel('⚠️ Oui, je veux nettoyer')
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cleanup_cancel')
      .setLabel('❌ Annuler')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton, confirmButton);

    await interaction.reply({
      embeds: [warningEmbed],
      components: [row],
      flags: 64, // MessageFlags.Ephemeral
    });
  },
};

// Handler pour les boutons de confirmation
export const handleCleanupButtons = async (interaction: ButtonInteraction): Promise<void> => {
  const { customId } = interaction;

  if (customId === 'cleanup_cancel') {
    await interaction.update({
      content: '✅ Nettoyage annulé.',
      embeds: [],
      components: [],
    });
    return;
  }

  if (customId === 'cleanup_confirm_step1') {
    const confirmEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('⚠️ DERNIÈRE CONFIRMATION')
      .setDescription(
        '**ÊTES-VOUS VRAIMENT SÛR ?**\n\n' +
        'Cette action va **TOUT SUPPRIMER** :\n' +
        '• Tous les salons créés\n' +
        '• Tous les rôles créés\n' +
        '• Toutes les données en base\n\n' +
        '**Il n\'y aura AUCUN MOYEN de récupérer ces données !**\n\n' +
        'Cliquez sur "🔴 OUI, SUPPRIMER TOUT" pour confirmer définitivement.'
      );

    const finalConfirmButton = new ButtonBuilder()
      .setCustomId('cleanup_confirm_final')
      .setLabel('🔴 OUI, SUPPRIMER TOUT')
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cleanup_cancel')
      .setLabel('❌ Non, annuler')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton, finalConfirmButton);

    await interaction.update({
      embeds: [confirmEmbed],
      components: [row],
    });
    return;
  }

  if (customId === 'cleanup_confirm_final') {
    await interaction.update({
      content: '⏳ Nettoyage en cours... Ne fermez pas Discord !',
      embeds: [],
      components: [],
    });

    try {
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply('❌ Erreur: serveur introuvable.');
        return;
      }

      let deletedChannels = 0;
      let deletedRoles = 0;
      let deletedCategories = 0;

      // ÉTAPE 1 : Supprimer tous les salons dans les catégories créées
      const categories = guild.channels.cache.filter(
        c => c.type === ChannelType.GuildCategory && 
        (c.name.toUpperCase().includes('SYSTÈME') || 
         c.name.toUpperCase().includes('SYSTEME') ||
         c.name.toUpperCase().includes('DISCUSSIONS') || 
         c.name.toUpperCase().includes('DISCUSSION') ||
         c.name.toUpperCase().includes('VOCAUX') || 
         c.name.toUpperCase().includes('VOCAL') ||
         c.name.toUpperCase().includes('COURS') ||
         c.name.toUpperCase().includes('ENTRAIDE') ||
         c.name.toUpperCase().includes('SUPPORT') ||
         c.name.toUpperCase().includes('LOGS') ||
         c.name.toUpperCase().includes('MODÉRATION') ||
         c.name.toUpperCase().includes('MODERATION') ||
         c.name.toUpperCase().includes('GÉNÉRAL') || 
         c.name.toUpperCase().includes('GENERAL') ||
         c.name.toUpperCase().includes('INFORMATIONS') || 
         c.name.toUpperCase().includes('INFORMATION') ||
         c.name.toUpperCase().includes('TICKETS') || 
         c.name.toUpperCase().includes('TICKET') ||
         c.name.toUpperCase().includes('PUBLIC'))
      );

      for (const [, category] of categories) {
        const channelsInCategory = guild.channels.cache.filter(c => c.parentId === category.id);
        
        for (const [, channel] of channelsInCategory) {
          try {
            await channel.delete();
            deletedChannels++;
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Erreur lors de la suppression du salon ${channel.name}:`, error);
          }
        }
      }

      await interaction.editReply(`⏳ ${deletedChannels} salon(s) supprimé(s)... Suppression des catégories...`);

      // ÉTAPE 2 : Supprimer les catégories (re-fetch pour être sûr)
      const categoriesToDelete = guild.channels.cache.filter(
        c => c.type === ChannelType.GuildCategory && 
        (c.name.toUpperCase().includes('SYSTÈME') || 
         c.name.toUpperCase().includes('SYSTEME') ||
         c.name.toUpperCase().includes('DISCUSSIONS') || 
         c.name.toUpperCase().includes('DISCUSSION') ||
         c.name.toUpperCase().includes('VOCAUX') || 
         c.name.toUpperCase().includes('VOCAL') ||
         c.name.toUpperCase().includes('COURS') ||
         c.name.toUpperCase().includes('ENTRAIDE') ||
         c.name.toUpperCase().includes('SUPPORT') ||
         c.name.toUpperCase().includes('LOGS') ||
         c.name.toUpperCase().includes('MODÉRATION') ||
         c.name.toUpperCase().includes('MODERATION') ||
         c.name.toUpperCase().includes('GÉNÉRAL') || 
         c.name.toUpperCase().includes('GENERAL') ||
         c.name.toUpperCase().includes('INFORMATIONS') || 
         c.name.toUpperCase().includes('INFORMATION') ||
         c.name.toUpperCase().includes('TICKETS') || 
         c.name.toUpperCase().includes('TICKET') ||
         c.name.toUpperCase().includes('PUBLIC'))
      );

      for (const [, category] of categoriesToDelete) {
        try {
          await category.delete();
          deletedCategories++;
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Erreur lors de la suppression de la catégorie ${category.name}:`, error);
        }
      }

      await interaction.editReply(`⏳ ${deletedCategories} catégorie(s) supprimée(s)... Suppression des rôles...`);

      // ÉTAPE 3 : Supprimer les rôles créés
      const rolesToDelete = guild.roles.cache.filter(
        role => 
          role.name.includes('Admin') ||
          role.name.includes('Délégué') ||
          role.name.includes('Support') ||
          role.name.includes('Vérifié') ||
          role.name.includes('Étudiant') ||
          role.name.includes('Bot') ||
          role.name.includes('Hotaru') ||
          role.name.includes('Jobs')
      );

      for (const [, role] of rolesToDelete) {
        try {
          // Ne pas supprimer le rôle @everyone ou les rôles managed
          if (role.id !== guild.id && !role.managed) {
            await role.delete();
            deletedRoles++;
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error(`Erreur lors de la suppression du rôle ${role.name}:`, error);
        }
      }

      await interaction.editReply(`⏳ ${deletedRoles} rôle(s) supprimé(s)... Nettoyage de la base de données...`);

      // ÉTAPE 4 : Nettoyer la base de données
      try {
        const dataDir = join(process.cwd(), 'data');
        const dbPath = join(dataDir, 'hotaru.db');
        const db = new Database(dbPath);

        // Vider toutes les tables
        db.exec('DELETE FROM quotes');
        db.exec('DELETE FROM tickets');
        db.exec('DELETE FROM verified_users');
        db.exec('DELETE FROM photo_counter');
        db.exec('DELETE FROM reminders');

        db.close();
      } catch (error) {
        console.error('Erreur lors du nettoyage de la base de données:', error);
      }

      await interaction.editReply('⏳ Base de données nettoyée... Finalisation...');

      // ÉTAPE 5 : Résumé final
      const summaryEmbed = new EmbedBuilder()
        .setColor(0x00b894)
        .setTitle('✅ Nettoyage terminé !')
        .setDescription(
          '**Serveur nettoyé avec succès !**\n\n' +
          `🗑️ **${deletedChannels}** salon(s) supprimé(s)\n` +
          `🗑️ **${deletedCategories}** catégorie(s) supprimée(s)\n` +
          `🗑️ **${deletedRoles}** rôle(s) supprimé(s)\n` +
          `🗑️ **Base de données** vidée\n\n` +
          '**Le serveur est maintenant vide et prêt pour un nouveau `/setup` !**\n\n' +
          '⚠️ N\'oubliez pas de vider les IDs dans votre fichier `.env` si vous refaites un setup.'
        )
        .setFooter({ text: 'Vous pouvez maintenant relancer /setup' })
        .setTimestamp();

      await interaction.editReply({
        content: '',
        embeds: [summaryEmbed],
      });

    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue lors du nettoyage. Vérifiez les logs.',
      });
    }
  }
};

export default command;

