import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Colors, EmbedBuilder, MessageFlags, PermissionFlagsBits, type Snowflake } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';

const DATE_HELP = 'Format recommandé : 2025-10-12 16:30 (heure locale du serveur).';

export default new ApplicationCommand({
    command: {
        name: 'agenda',
        description: 'Gérer l\'agenda collaboratif du serveur.',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'add',
                description: 'Ajouter une tâche à l\'agenda.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'titre',
                        description: 'Titre de la tâche.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        maxLength: 120
                    },
                    {
                        name: 'echeance',
                        description: `Échéance de la tâche. ${DATE_HELP}`,
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        maxLength: 40
                    },
                    {
                        name: 'description',
                        description: 'Détails complémentaires.',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                        maxLength: 512
                    }
                ]
            },
            {
                name: 'remove',
                description: 'Supprimer une tâche de l\'agenda.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'id',
                        description: 'Identifiant de la tâche (voir /agenda list).',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        maxLength: 64
                    }
                ]
            },
            {
                name: 'done',
                description: 'Marquer une tâche comme réalisée.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'id',
                        description: 'Identifiant de la tâche à clôturer.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        maxLength: 64
                    }
                ]
            },
            {
                name: 'list',
                description: 'Afficher les tâches enregistrées.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'etat',
                        description: 'Filtrer par statut.',
                        type: ApplicationCommandOptionType.String,
                        required: false,
                        choices: [
                            { name: 'En attente', value: 'pending' },
                            { name: 'Tout', value: 'all' },
                            { name: 'Terminées', value: 'completed' }
                        ]
                    }
                ]
            },
            {
                name: 'channel',
                description: 'Configurer le salon des rappels quotidiens.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'salon',
                        description: 'Salon où publier le rappel quotidien.',
                        type: ApplicationCommandOptionType.Channel,
                        required: false,
                        channelTypes: [
                            ChannelType.GuildText,
                            ChannelType.GuildAnnouncement,
                            ChannelType.PublicThread,
                            ChannelType.PrivateThread
                        ]
                    },
                    {
                        name: 'effacer',
                        description: 'Désactiver les rappels quotidiens.',
                        type: ApplicationCommandOptionType.Boolean,
                        required: false
                    }
                ]
            }
        ]
    },
    options: {
        cooldown: 4000
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand() || !interaction.guild) {
            return;
        }

        const guildId = interaction.guild.id as Snowflake;
        const agenda = client.agendaManager;

        if (!agenda) {
            await interaction.reply({
                content: 'Le module agenda n\'est pas disponible pour le moment.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const title = interaction.options.getString('titre', true);
            const dueInput = interaction.options.getString('echeance', true);
            const description = interaction.options.getString('description') ?? undefined;
            const dueAt = agenda.parseDueDate(dueInput);

            if (!dueAt) {
                await interaction.reply({
                    content: `❌ Échéance invalide. ${DATE_HELP}`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            if (dueAt <= Date.now()) {
                await interaction.reply({
                    content: '❌ L\'échéance doit être dans le futur.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const task = agenda.addTask({
                guildId,
                title,
                description,
                dueAt,
                createdBy: interaction.user.id as Snowflake
            });

            await interaction.reply({
                content: `✅ Tâche ajoutée. Identifiant : \`${task.id}\``,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (subcommand === 'remove') {
            const id = interaction.options.getString('id', true);
            const removed = agenda.removeTask(guildId, id);

            if (!removed) {
                await interaction.reply({
                    content: '❌ Aucune tâche trouvée avec cet identifiant.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            await interaction.reply({
                content: `🗑️ Tâche **${removed.title}** supprimée.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (subcommand === 'done') {
            const id = interaction.options.getString('id', true);
            const task = agenda.getTask(guildId, id);

            if (!task) {
                await interaction.reply({
                    content: '❌ Impossible de trouver cette tâche.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const canOverride = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
            if (task.createdBy !== interaction.user.id && !canOverride) {
                await interaction.reply({
                    content: '❌ Seul le créateur de la tâche ou un administrateur peut la marquer comme effectuée.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            if (task.completedAt) {
                await interaction.reply({
                    content: 'ℹ️ Cette tâche est déjà marquée comme terminée.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            agenda.markTaskDone(guildId, id, interaction.user.id as Snowflake);

            await interaction.reply({
                content: `✅ Tâche **${task.title}** marquée comme terminée.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (subcommand === 'list') {
            const scope = interaction.options.getString('etat') ?? 'pending';
            const includeCompleted = scope === 'all' || scope === 'completed';
            const tasks = agenda.listTasks(guildId, { includeCompleted });

            let filtered = tasks;
            if (scope === 'pending') {
                filtered = tasks.filter((task) => !task.completedAt);
            }
            if (scope === 'completed') {
                filtered = tasks.filter((task) => task.completedAt);
            }

            if (filtered.length === 0) {
                await interaction.reply({
                    content: scope === 'completed'
                        ? '✅ Aucune tâche terminée pour le moment.'
                        : '🎉 Aucune tâche en attente. Tout est à jour !',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(Colors.Blurple)
                .setTitle('Agenda collaboratif')
                .setDescription('Liste triée par échéance. Utilisez /agenda done pour marquer une tâche comme faite.')
                .setTimestamp(new Date());

            const limited = filtered.slice(0, 25);
            for (const task of limited) {
                embed.addFields(agenda.formatTaskField(task));
            }

            if (filtered.length > limited.length) {
                embed.addFields({
                    name: '... et plus encore',
                    value: `Encore ${filtered.length - limited.length} tâche(s) dans la liste.`
                });
            }

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        if (subcommand === 'channel') {
            const hasPermission = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
            if (!hasPermission) {
                await interaction.reply({
                    content: '❌ Seuls les administrateurs peuvent modifier le salon des rappels.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const targetChannel = interaction.options.getChannel('salon', false, [
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement,
                ChannelType.PublicThread,
                ChannelType.PrivateThread
            ]);
            const shouldClear = interaction.options.getBoolean('effacer') ?? false;

            if (!targetChannel && !shouldClear) {
                const current = agenda.getDigestChannel(guildId);
                await interaction.reply({
                    content: current
                        ? `📌 Les rappels quotidiens sont envoyés dans <#${current}>.`
                        : 'ℹ️ Aucun salon configuré pour le rappel quotidien.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            if (shouldClear) {
                agenda.setDigestChannel(guildId, null);
                await interaction.reply({
                    content: '🧹 Les rappels quotidiens sont désormais désactivés.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            if (!targetChannel) {
                await interaction.reply({
                    content: '❌ Merci de sélectionner un salon valide.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            agenda.setDigestChannel(guildId, targetChannel.id as Snowflake);
            await interaction.reply({
                content: `✅ Les rappels quotidiens seront envoyés dans <#${targetChannel.id}>.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }
    }
}).toJSON();
