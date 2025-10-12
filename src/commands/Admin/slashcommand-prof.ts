import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    ChannelType,
    Colors,
    MessageFlags,
    EmbedBuilder
} from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import type { Snowflake } from 'discord.js';

export default new ApplicationCommand({
    command: {
        name: 'prof',
        description: 'Gestion du classement des professeurs (admins).',
        type: ApplicationCommandType.ChatInput,
        dmPermission: false,
        defaultMemberPermissions: PermissionFlagsBits.Administrator,
        options: [
            {
                name: 'add',
                description: 'Ajouter un professeur à la liste.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'nom',
                        description: 'Nom complet du professeur.',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'bio',
                        description: 'Courte description ou matière enseignée.',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    },
                    {
                        name: 'citation',
                        description: 'Citation fun à afficher dans les embeds.',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    },
                    {
                        name: 'emoji',
                        description: 'Emoji personnalisé (facultatif).',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    }
                ]
            },
            {
                name: 'remove',
                description: 'Désactiver un professeur (garde les archives).',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'professeur',
                        description: 'Professeur à retirer.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        autocomplete: true
                    }
                ]
            },
            {
                name: 'reset',
                description: 'Réinitialiser les votes.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'cible',
                        description: 'Portée de la réinitialisation.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        choices: [
                            { name: 'Semaine en cours', value: 'week' },
                            { name: 'Mois courant', value: 'month' },
                            { name: 'Année courante', value: 'year' },
                            { name: 'Tout effacer', value: 'all' }
                        ]
                    }
                ]
            },
            {
                name: 'archive-channel',
                description: 'Définir le salon #archives-ranking pour les résultats automatiques.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'salon',
                        description: 'Salon texte où publier les classements.',
                        type: ApplicationCommandOptionType.Channel,
                        required: false,
                        channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
                    }
                ]
            },
            {
                name: 'list',
                description: 'Afficher la liste des professeurs enregistrés.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'panel',
                description: 'Publier ou retirer le panneau interactif de classement.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'salon',
                        description: 'Salon texte où afficher le panneau (laisser vide pour le retirer).',
                        type: ApplicationCommandOptionType.Channel,
                        required: false,
                        channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
                    }
                ]
            }
        ]
    },
    options: {
        cooldown: 3_000
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

        if (!client.professorRankingManager) {
            await interaction.reply({
                content: '❌ Le gestionnaire de classement n\'est pas initialisé.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const manager = client.professorRankingManager;
        const subcommand = interaction.options.getSubcommand(true);

        try {
            switch (subcommand) {
                case 'add': {
                    const name = interaction.options.getString('nom', true);
                    const bio = interaction.options.getString('bio', false) ?? undefined;
                    const quote = interaction.options.getString('citation', false) ?? undefined;
                    const emoji = interaction.options.getString('emoji', false) ?? undefined;

                    const professor = manager.addProfessor(interaction.guildId, name, {
                        bio,
                        quote,
                        emoji,
                        addedBy: interaction.user.id
                    });

                    const embed = new EmbedBuilder()
                        .setTitle('✅ Professeur ajouté')
                        .setColor(Colors.Green)
                        .setDescription(`**${professor.name}** rejoint la compétition !`)
                        .setTimestamp();

                    if (professor.bio) {
                        embed.addFields({ name: 'Bio', value: professor.bio });
                    }

                    if (professor.quote) {
                        embed.addFields({ name: 'Citation', value: professor.quote });
                    }

                    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    break;
                }
                case 'remove': {
                    const professorId = interaction.options.getString('professeur', true);
                    const professor = manager.removeProfessor(interaction.guildId, professorId);

                    await interaction.reply({
                        content: `🗂️ **${professor.name}** est désormais archivé. Les résultats existants sont conservés.`,
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                }
                case 'reset': {
                    const scope = interaction.options.getString('cible', true) as 'week' | 'month' | 'year' | 'all';
                    manager.reset(interaction.guildId, scope);

                    await interaction.reply({
                        content: `♻️ Réinitialisation effectuée (${scope}).`,
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                }
                case 'archive-channel': {
                    const channel = interaction.options.getChannel('salon');

                    if (channel) {
                        if (!(channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)) {
                            await interaction.reply({
                                content: '❌ Merci de sélectionner un salon texte ou annonces.',
                                flags: MessageFlags.Ephemeral
                            });
                            return;
                        }

                        manager.setArchiveChannel(interaction.guildId, channel.id);

                        await interaction.reply({
                            content: `📬 Les résultats hebdo seront publiés dans ${channel}.`,
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        manager.setArchiveChannel(interaction.guildId, null);
                        await interaction.reply({
                            content: '🛑 Publication automatique désactivée.',
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    break;
                }
                case 'list': {
                    const professors = manager.listProfessors(interaction.guildId, true);

                    if (!professors.length) {
                        await interaction.reply({
                            content: 'ℹ️ Aucun professeur enregistré pour le moment.',
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    const lines = professors.map((prof) => `${prof.active ? '✅' : '🗃️'} ${prof.name}`);

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Liste des professeurs')
                                .setColor(Colors.Blue)
                                .setDescription(lines.join('\n'))
                        ],
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                }
                case 'panel': {
                    const channel = interaction.options.getChannel('salon');

                    if (channel) {
                        if (!(channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)) {
                            await interaction.reply({
                                content: '❌ Merci de sélectionner un salon texte ou annonces.',
                                flags: MessageFlags.Ephemeral
                            });
                            return;
                        }

                        const result = await manager.deployPanel(interaction.guild!, channel.id as Snowflake);

                        await interaction.reply({
                            content: `📌 Panneau publié dans ${channel} (message ${result.messageId}).`,
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        await manager.clearPanel(interaction.guild!);
                        await interaction.reply({
                            content: '🧹 Le panneau interactif a été retiré.',
                            flags: MessageFlags.Ephemeral
                        });
                    }
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
