import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    ChannelType,
    PermissionFlagsBits,
    MessageFlags,
    type ChatInputCommandInteraction,
    type Snowflake
} from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import type { TimetableMode, TimetableConfig } from '../../utils/ScheduleManager.js';

const MODE_CHOICES: Array<{ name: string; value: TimetableMode; }> = [
    { name: 'Statut du bot', value: 'presence' },
    { name: 'Nom de salon', value: 'channel_name' },
    { name: 'Message', value: 'message' },
    { name: 'Événement planifié', value: 'event' }
];

const validateUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
};

const ensureAdministrator = (interaction: ChatInputCommandInteraction): boolean => {
    if (!interaction.inCachedGuild()) {
        return false;
    }

    return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;
};

export default new ApplicationCommand({
    command: {
        name: 'edt',
        description: 'Configurer la synchronisation Hyperplanning (ICS).',
        type: ApplicationCommandType.ChatInput,
    dmPermission: false,
        options: [
            {
                name: 'configurer',
                description: 'Définir l\'URL ICS et la cible à mettre à jour.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'url',
                        description: 'Lien ICS Hyperplanning ou iCalendar.',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'mode',
                        description: 'Choisir la cible mise à jour en temps réel.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: MODE_CHOICES.map((choice) => ({
                            name: choice.name,
                            value: choice.value
                        }))
                    },
                    {
                        name: 'salon',
                        description: 'Salon texte ou vocal à mettre à jour (pour mode salon ou message).',
                        type: ApplicationCommandOptionType.Channel,
                        required: false,
                        channel_types: [ChannelType.GuildText, ChannelType.GuildVoice]
                    },
                    {
                        name: 'message_id',
                        description: 'Identifiant du message à éditer (mode message).',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    },
                    {
                        name: 'event_id',
                        description: 'Identifiant d\'événement Discord à mettre à jour (mode événement).',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    },
                    {
                        name: 'intervalle',
                        description: 'Fréquence de synchronisation en minutes (1-60).',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        min_value: 1,
                        max_value: 60
                    },
                    {
                        name: 'anticipation',
                        description: 'Nombre d\'heures pour anticiper le prochain cours (1-168).',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        min_value: 1,
                        max_value: 168
                    }
                ]
            },
            {
                name: 'statut',
                description: 'Afficher la configuration actuelle et le cours détecté.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'desactiver',
                description: 'Arrêter la synchronisation de l\'emploi du temps.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'forcer',
                description: 'Déclencher une synchronisation immédiate.',
                type: ApplicationCommandOptionType.Subcommand
            }
        ]
    },
    options: {
        cooldown: 5_000
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!ensureAdministrator(interaction)) {
            await interaction.reply({
                content: '❌ Cette commande est réservée aux administrateurs du serveur.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand(true);

        if (!client.scheduleManager) {
            await interaction.reply({
                content: '❌ Le gestionnaire d\'emploi du temps n\'est pas initialisé.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (!interaction.guildId) {
            await interaction.reply({
                content: '❌ Cette commande ne peut être utilisée que sur un serveur.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const guildId = interaction.guildId;

        switch (subcommand) {
            case 'configurer': {
                const url = interaction.options.getString('url', true).trim();
                const mode = interaction.options.getString('mode', true) as TimetableMode;
                const channel = interaction.options.getChannel('salon', false);
                const messageIdRaw = interaction.options.getString('message_id', false)?.trim() ?? null;
                const eventIdRaw = interaction.options.getString('event_id', false)?.trim() ?? null;
                const interval = interaction.options.getInteger('intervalle', false) ?? undefined;
                const lookahead = interaction.options.getInteger('anticipation', false) ?? undefined;

                if (!validateUrl(url)) {
                    await interaction.reply({
                        content: '❌ URL invalide. Merci de fournir un lien HTTP(S) vers un flux ICS.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                if (mode === 'channel_name' || mode === 'message') {
                    if (!channel) {
                        await interaction.reply({
                            content: '❌ Veuillez préciser le salon à mettre à jour.',
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                }

                if (mode === 'message' && !messageIdRaw) {
                    await interaction.reply({
                        content: '❌ L\'identifiant du message est requis pour ce mode.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                if (mode === 'event' && !eventIdRaw) {
                    await interaction.reply({
                        content: '❌ Merci de fournir l\'identifiant de l\'événement Discord.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                if (messageIdRaw && !/^\d{5,20}$/.test(messageIdRaw)) {
                    await interaction.reply({
                        content: '❌ L\'identifiant du message doit être une suite de chiffres.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                if (eventIdRaw && !/^\d{5,20}$/.test(eventIdRaw)) {
                    await interaction.reply({
                        content: '❌ L\'identifiant de l\'événement doit être une suite de chiffres.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const config: TimetableConfig = {
                    url,
                    mode,
                    channelId: channel ? channel.id as Snowflake : undefined,
                    messageId: messageIdRaw ? messageIdRaw as Snowflake : undefined,
                    eventId: eventIdRaw ? eventIdRaw as Snowflake : undefined,
                    updateIntervalMinutes: interval,
                    lookaheadHours: lookahead
                };

                client.scheduleManager.setConfig(guildId, config);

                await interaction.reply({
                    content: '✅ Synchronisation Hyperplanning configurée avec succès !',
                    flags: MessageFlags.Ephemeral
                });
                break;
            }
            case 'statut': {
                const status = client.scheduleManager.getStatus(guildId);
                if (!status.enabled) {
                    await interaction.reply({
                        content: 'ℹ️ Aucun calendrier n\'est configuré pour ce serveur.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const lines = [
                    `• Mode : **${status.mode}**`,
                    `• Source : ${status.url}`,
                    status.currentLabel ? `• État : ${status.currentLabel}` : null,
                    status.lastSyncAt ? `• Dernière synchro : <t:${Math.floor((status.lastSyncAt) / 1000)}:R>` : null,
                    status.lastError ? `• Dernière erreur : ${status.lastError}` : null
                ].filter(Boolean);

                await interaction.reply({
                    content: `📅 Configuration actuelle :\n${lines.join('\n')}`,
                    flags: MessageFlags.Ephemeral
                });
                break;
            }
            case 'desactiver': {
                client.scheduleManager.deleteConfig(guildId);
                await interaction.reply({
                    content: '✅ La synchronisation de l\'emploi du temps a été désactivée.',
                    flags: MessageFlags.Ephemeral
                });
                break;
            }
            case 'forcer': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                await client.scheduleManager.reload(guildId);
                await interaction.editReply('✅ Synchronisation relancée.');
                break;
            }
            default:
                await interaction.reply({
                    content: '❌ Sous-commande inconnue.',
                    flags: MessageFlags.Ephemeral
                });
                break;
        }
    }
}).toJSON();
