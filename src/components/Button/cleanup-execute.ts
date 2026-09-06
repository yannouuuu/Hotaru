import {
    EmbedBuilder,
    Colors,
    ChannelType
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { SetupManager } from '../../utils/SetupManager.js';

export default new Component({
    customId: 'cleanup_execute',
    type: 'button',

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;

        const guild = interaction.guild;

        // Récupérer les données du setup
        const setupData = SetupManager.getSetupData(client, guild.id);
        if (!setupData) {
            await interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Erreur')
                        .setDescription('Aucune configuration trouvée à supprimer.')
                        .setColor(Colors.Red)
                ],
                components: []
            });
            return;
        }

        // Message de progression
        const progressEmbed = new EmbedBuilder()
            .setTitle('🔄 Nettoyage en cours...')
            .setDescription('Suppression de tous les éléments créés par le setup.\n\nCela peut prendre quelques instants...')
            .setColor(Colors.Blue)
            .setFooter({ text: 'Hotaru - Nettoyage en cours' })
            .setTimestamp();

        await interaction.update({
            embeds: [progressEmbed],
            components: []
        });

        try {
            let deletedChannels = 0;
            let deletedCategories = 0;
            let deletedRoles = 0;

            // Étape 1 : Supprimer tous les salons
            if (setupData.channels) {
                for (const channelId of Object.values(setupData.channels)) {
                    try {
                        const channel = guild.channels.cache.get(channelId);
                        if (channel) {
                            await channel.delete('Cleanup du setup');
                            deletedChannels++;
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    } catch (error) {
                        console.error(`Erreur lors de la suppression du salon ${channelId}:`, error);
                    }
                }
            }

            // Étape 2 : Supprimer toutes les catégories
            if (setupData.categories) {
                for (const categoryId of Object.values(setupData.categories)) {
                    try {
                        const category = guild.channels.cache.get(categoryId);
                        if (category && category.type === ChannelType.GuildCategory) {
                            await category.delete('Cleanup du setup');
                            deletedCategories++;
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    } catch (error) {
                        console.error(`Erreur lors de la suppression de la catégorie ${categoryId}:`, error);
                    }
                }
            }

            // Étape 3 : Supprimer tous les rôles (sauf @everyone)
            if (setupData.roles) {
                for (const roleId of Object.values(setupData.roles)) {
                    try {
                        const role = guild.roles.cache.get(roleId);
                        if (role && role.id !== guild.id) { // Ne pas supprimer @everyone
                            await role.delete('Cleanup du setup');
                            deletedRoles++;
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    } catch (error) {
                        console.error(`Erreur lors de la suppression du rôle ${roleId}:`, error);
                    }
                }
            }

            // Étape 3.5 : Supprimer les artefacts du mode promo (groupes A–N)
            let deletedPromoChannels = 0;
            let deletedPromoCategories = 0;
            let deletedPromoRoles = 0;

            const promo = setupData.promo;
            if (promo?.mode && promo.groups) {
                for (const group of Object.values(promo.groups)) {
                    for (const channelId of Object.values(group.channels)) {
                        try {
                            const channel = guild.channels.cache.get(channelId);
                            if (channel) {
                                await channel.delete('Cleanup du setup (promo)');
                                deletedPromoChannels++;
                                await new Promise(resolve => setTimeout(resolve, 300));
                            }
                        } catch (error) {
                            console.error(`Erreur lors de la suppression du salon promo ${channelId}:`, error);
                        }
                    }

                    try {
                        const category = guild.channels.cache.get(group.categoryId);
                        if (category && category.type === ChannelType.GuildCategory) {
                            await category.delete('Cleanup du setup (promo)');
                            deletedPromoCategories++;
                            await new Promise(resolve => setTimeout(resolve, 300));
                        }
                    } catch (error) {
                        console.error(`Erreur lors de la suppression de la catégorie promo ${group.categoryId}:`, error);
                    }

                    try {
                        const role = guild.roles.cache.get(group.roleId);
                        if (role && role.id !== guild.id) {
                            await role.delete('Cleanup du setup (promo)');
                            deletedPromoRoles++;
                            await new Promise(resolve => setTimeout(resolve, 300));
                        }
                    } catch (error) {
                        console.error(`Erreur lors de la suppression du rôle promo ${group.roleId}:`, error);
                    }
                }
            }

            // Étape 4 : Supprimer les données de la base de données
            SetupManager.deleteSetupData(client, guild.id);

            // Message de confirmation
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Nettoyage terminé !')
                .setDescription(
                    '**Tous les éléments créés par le setup ont été supprimés.**\n\n' +
                    '**Résumé de la suppression :**\n' +
                    `💬 **Salons supprimés :** ${deletedChannels + deletedPromoChannels}\n` +
                    `📁 **Catégories supprimées :** ${deletedCategories + deletedPromoCategories}\n` +
                    `🎭 **Rôles supprimés :** ${deletedRoles + deletedPromoRoles}\n` +
                    (deletedPromoRoles > 0 ? `🎓 **Groupes promo supprimés :** ${deletedPromoRoles}\n` : '') +
                    '**Base de données nettoyée.**\n\n' +
                    'Vous pouvez maintenant refaire un `/setup` si vous le souhaitez.'
                )
                .setColor(Colors.Green)
                .setFooter({ text: 'Hotaru - Nettoyage terminé' })
                .setTimestamp();

            await interaction.editReply({
                embeds: [successEmbed]
            });

        } catch (error) {
            console.error('Erreur lors du cleanup:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erreur lors du nettoyage')
                .setDescription(
                    '**Une erreur s\'est produite lors du nettoyage.**\n\n' +
                    `**Erreur :** ${error instanceof Error ? error.message : 'Erreur inconnue'}\n\n` +
                    'Certains éléments ont peut-être été supprimés. ' +
                    'Vérifiez l\'état du serveur et réessayez si nécessaire.'
                )
                .setColor(Colors.Red)
                .setFooter({ text: 'Hotaru - Erreur' })
                .setTimestamp();

            await interaction.editReply({
                embeds: [errorEmbed]
            });
        }
    }
}).toJSON();
