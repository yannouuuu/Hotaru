import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    Colors,
    MessageFlags,
    EmbedBuilder,
    ChannelType,
    TextChannel
} from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { SetupManager } from '../../utils/SetupManager.js';
import { SetupMessages } from '../../utils/SetupMessages.js';

export default new ApplicationCommand({
    command: {
        name: 'group',
        description: 'Gestion des groupes de promotion (admins).',
        type: ApplicationCommandType.ChatInput,
        dmPermission: false,
        defaultMemberPermissions: PermissionFlagsBits.Administrator,
        options: [
            {
                name: 'reveal',
                description: 'Dévoiler un groupe de promo (le rendre sélectionnable par les étudiants).',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'groupe',
                        description: 'Lettre du groupe à dévoiler (ex: A).',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: 'list',
                description: 'Afficher l\'état de tous les groupes de promo.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'invite',
                description: 'Afficher le lien d\'invitation de la promo.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'unlock-channel',
                description: 'Débloquer manuellement le prochain salon d\'un groupe.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'groupe',
                        description: 'Lettre du groupe concerné (ex: A).',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            }
        ]
    },
    options: {
        cooldown: 3000
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;

        if (!interaction.inCachedGuild() || !interaction.guildId) {
            await interaction.reply({
                content: '❌ Commande uniquement disponible sur un serveur.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const promo = SetupManager.getPromoConfig(client, interaction.guildId);
        if (!promo?.mode) {
            await interaction.reply({
                content: '❌ Le mode promotion n\'est pas activé sur ce serveur. Utilisez `/setup mode:promo`.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand(true);

        try {
            switch (subcommand) {
                case 'reveal': {
                    const groupKey = interaction.options.getString('groupe', true).trim().toUpperCase();

                    if (!promo.groupKeys.includes(groupKey)) {
                        await interaction.reply({
                            content: `❌ Groupe inconnu. Groupes disponibles : ${promo.groupKeys.join(', ')}`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    const revealed = await SetupManager.revealGroup(client, interaction.guildId, groupKey);
                    if (!revealed) {
                        await interaction.reply({
                            content: `ℹ️ Le groupe **${groupKey}** est déjà dévoilé.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    // Rafraîchir le panneau de sélection de classe
                    const setupData = SetupManager.getSetupData(client, interaction.guildId);
                    const promoPanelId = setupData?.messages?.promoPanel;
                    const rolesChannelId = setupData?.channels?.roles;

                    if (promoPanelId && rolesChannelId) {
                        const rolesChannel = interaction.guild.channels.cache.get(rolesChannelId);
                        if (rolesChannel?.type === ChannelType.GuildText) {
                            const panelMessage = await (rolesChannel as TextChannel).messages.fetch(promoPanelId).catch(() => null);
                            if (panelMessage) {
                                await panelMessage.edit(SetupMessages.refreshPromoPanel(client, interaction.guildId)).catch(() => undefined);
                            }
                        }
                    }

                    const revealedGroups = SetupManager.getRevealedGroups(client, interaction.guildId);

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('🎓 Groupe dévoilé !')
                                .setDescription(
                                    `Le **groupe ${groupKey}** est maintenant disponible dans la sélection de classe.\n\n` +
                                    `**Groupes dévoilés :** ${revealedGroups.map(g => g.key).join(', ')}\n\n` +
                                    'Les étudiants pourront maintenant le choisir. Les salons suivants du groupe s\'ouvriront progressivement.'
                                )
                                .setColor(Colors.Green)
                                .setTimestamp()
                        ],
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                }

                case 'list': {
                    const lines = promo.groupKeys.map(key => {
                        const group = promo.groups[key];
                        const status = group.revealed
                            ? `✅ Dévoilé (${group.unlockedChannels.length}/${group.channelRevealOrder.length} salons ouverts)`
                            : '🔒 Verrouillé';
                        return `**${key}** — ${status}`;
                    });

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('📚 Groupes de promotion')
                                .setDescription(
                                    `**Révélation progressive :** ${promo.progressiveReveal.enabled ? `activée (1 salon / ${promo.progressiveReveal.intervalDays} jour(s))` : 'désactivée'}\n\n` +
                                    lines.join('\n')
                                )
                                .setColor(Colors.Blue)
                                .setTimestamp()
                        ],
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                }

                case 'invite': {
                    let inviteLink = promo.inviteLink;

                    if (!inviteLink) {
                        const setupManager = new SetupManager(client, interaction.guild);
                        inviteLink = (await setupManager.generateInviteLink()) ?? undefined;
                        if (inviteLink) {
                            promo.inviteLink = inviteLink;
                            SetupManager.savePromoConfig(client, interaction.guildId, promo);
                        }
                    }

                    if (!inviteLink) {
                        await interaction.reply({
                            content: '❌ Impossible de générer un lien d\'invitation. Vérifiez les permissions du bot.',
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    await interaction.reply(SetupMessages.createInviteMessage(inviteLink));
                    break;
                }

                case 'unlock-channel': {
                    const groupKey = interaction.options.getString('groupe', true).trim().toUpperCase();

                    if (!promo.groupKeys.includes(groupKey)) {
                        await interaction.reply({
                            content: `❌ Groupe inconnu. Groupes disponibles : ${promo.groupKeys.join(', ')}`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    const group = promo.groups[groupKey];
                    if (!group.revealed) {
                        await interaction.reply({
                            content: `❌ Le groupe **${groupKey}** n'est pas encore dévoilé. Utilisez d'abord \`/group reveal ${groupKey}\`.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    const result = await SetupManager.unlockNextChannel(client, interaction.guildId, groupKey);
                    if (!result.unlocked || !result.channelKey) {
                        await interaction.reply({
                            content: `ℹ️ Tous les salons du groupe **${groupKey}** sont déjà débloqués.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    const remaining = group.channelRevealOrder.filter(k => !group.unlockedChannels.includes(k)).length;

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('🔓 Salon débloqué !')
                                .setDescription(
                                    `Le salon \`${result.channelKey}\` du **groupe ${groupKey}** est maintenant accessible.\n\n` +
                                    `**Salons restants :** ${remaining}`
                                )
                                .setColor(Colors.Green)
                                .setTimestamp()
                        ],
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                }

                default:
                    await interaction.reply({
                        content: '❌ Sous-commande inconnue.',
                        flags: MessageFlags.Ephemeral
                    });
                    break;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Une erreur est survenue.';
            await interaction.reply({
                content: `❌ ${message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
}).toJSON();
