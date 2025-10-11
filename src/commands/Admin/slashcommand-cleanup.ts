import {
    PermissionFlagsBits,
    ApplicationCommandType,
    Colors,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} from 'discord.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { SetupManager } from '../../utils/SetupManager.js';

export default new ApplicationCommand({
    command: {
        name: 'cleanup',
        description: 'Supprime complètement la configuration du serveur (IRRÉVERSIBLE)',
        type: ApplicationCommandType.ChatInput,
        defaultMemberPermissions: PermissionFlagsBits.Administrator,
        dmPermission: false,
        options: []
    },

    options: {
        cooldown: 30000 // 30 secondes de cooldown
    },

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) {
            await interaction.reply({
                content: '❌ Cette commande ne peut être utilisée que dans un serveur.',
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // Vérifier si un setup existe
        const setupData = SetupManager.getSetupData(client, interaction.guildId);
        if (!setupData) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('⚠️ Aucune configuration trouvée')
                        .setDescription(
                            'Ce serveur n\'a pas encore été configuré.\n\n' +
                            'Utilisez `/setup` pour configurer le serveur.'
                        )
                        .setColor(Colors.Orange)
                        .setFooter({ text: 'Hotaru - Cleanup' })
                        .setTimestamp()
                ],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // Premier avertissement
        const firstWarningEmbed = new EmbedBuilder()
            .setTitle('⚠️ AVERTISSEMENT - Nettoyage du serveur')
            .setDescription(
                '**Vous êtes sur le point de SUPPRIMER COMPLÈTEMENT la configuration du serveur.**\n\n' +
                '**Cela inclut :**\n' +
                `• ${Object.keys(setupData.roles).length} rôles\n` +
                `• ${Object.keys(setupData.categories).length} catégories\n` +
                `• ${Object.keys(setupData.channels).length} salons\n` +
                `• Tous les messages interactifs\n` +
                `• Toutes les données de la base de données\n\n` +
                '⚠️ **CETTE ACTION EST IRRÉVERSIBLE !**\n\n' +
                'Êtes-vous absolument sûr de vouloir continuer ?'
            )
            .setColor(Colors.Orange)
            .setFooter({ text: 'Hotaru - Confirmation requise' })
            .setTimestamp();

        const firstWarningButtons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cleanup_confirm_first')
                    .setLabel('⚠️ Oui, je veux nettoyer')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cleanup_cancel')
                    .setLabel('❌ Annuler')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [firstWarningEmbed],
            components: [firstWarningButtons],
            flags: [MessageFlags.Ephemeral]
        });
    }
}).toJSON();
