import {
    ApplicationCommandType,
    PermissionFlagsBits,
    SlashCommandSubcommandBuilder
} from 'discord.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

const buildRefreshSubcommand = () =>
    new SlashCommandSubcommandBuilder()
        .setName('refresh')
        .setDescription('Rafraîchir immédiatement les offres France Travail.');

const buildStatusSubcommand = () =>
    new SlashCommandSubcommandBuilder()
        .setName('statut')
        .setDescription('Afficher le statut du flux d\'offres d\'emploi.');

export default new ApplicationCommand({
    command: {
        name: 'jobs',
        description: 'Gérer les offres d\'emploi France Travail.',
        type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
        options: [
            buildRefreshSubcommand().toJSON(),
            buildStatusSubcommand().toJSON()
        ]
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inGuild() || !interaction.guildId) {
            await interaction.reply({
                content: '❌ Cette commande doit être utilisée dans un serveur.',
                flags: 64
            });
            return;
        }

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                content: '❌ Vous n\'avez pas la permission de gérer les offres d\'emploi.',
                flags: 64
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'refresh') {
            await interaction.deferReply({ flags: 64 });
            const result = await client.jobsManager.refreshGuild(interaction.guildId, { reason: 'manual' });

            if (result.error) {
                await interaction.editReply({
                    content: `❌ Erreur lors du rafraîchissement des offres : ${result.error}`
                });
                return;
            }

            const lines = [
                `✅ Rafraîchissement terminé : ${result.published} nouvelle(s) offre(s) publiée(s), ${result.skipped} ignorée(s).`
            ];

            if (result.notice) {
                lines.push(`ℹ️ ${result.notice}`);
            }

            await interaction.editReply({
                content: lines.join('\n')
            });
            return;
        }

        if (subcommand === 'statut') {
            const status = client.jobsManager.getStatus(interaction.guildId);
            const lines: string[] = [];

            lines.push(status.hasCredentials ? '🔐 Authentification France Travail : configurée' : '🔐 Authentification France Travail : manquante');
            lines.push(status.isConfigured && status.channelId ? `💬 Salon cible : <#${status.channelId}>` : '💬 Salon cible : non configuré');
            lines.push(`🔄 Intervalle d'actualisation : ${(status.updateIntervalMs / 60_000).toFixed(1)} min`);
            lines.push(`📦 Offres connues : ${status.knownOffers}`);

            if (status.lastFetchAt) {
                lines.push(`⏱️ Dernier appel API : <t:${Math.floor(status.lastFetchAt / 1000)}:R>`);
            }

            if (status.lastPublishAt) {
                lines.push(`📰 Dernière publication : <t:${Math.floor(status.lastPublishAt / 1000)}:R>`);
            }

            if (status.lastError) {
                lines.push(`⚠️ Dernière erreur : ${status.lastError}`);
            }

            await interaction.reply({
                content: lines.join('\n'),
                flags: 64
            });
            return;
        }
    }
}).toJSON();
