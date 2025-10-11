import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    TimestampStyles,
    time
} from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import type { ReminderStatus } from '../../types/reminders.js';

const MAX_FIELDS_PER_EMBED = 10;
const STATUS_LABEL: Record<ReminderStatus, { emoji: string; label: string }> = {
    active: { emoji: '⏳', label: 'Actif' },
    completed: { emoji: '✅', label: 'Complété' },
    cancelled: { emoji: '❌', label: 'Annulé' }
};

export default new ApplicationCommand({
    command: {
        name: 'reminders',
        description: '📋 Voir et gérer tes rappels',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'filtre',
                description: 'Filtrer les rappels par statut',
                type: ApplicationCommandOptionType.String,
                required: false,
                choices: [
                    { name: '🔔 Tous', value: 'tous' },
                    { name: '⏳ Actifs', value: 'active' },
                    { name: '✅ Complétés', value: 'completed' },
                    { name: '❌ Annulés', value: 'cancelled' }
                ]
            }
        ]
    },
    options: {
        cooldown: 3_000
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) {
            await interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', flags: 64 });
            return;
        }

        const filter = interaction.options.getString('filtre') ?? 'active';
        const statusFilter = filter === 'tous' ? undefined : filter as ReminderStatus;

        const reminders = client.reminderService.listUserReminders(interaction.user.id, {
            status: statusFilter,
            guildId: interaction.guildId
        });

        if (reminders.length === 0) {
            const empty = new EmbedBuilder()
                .setColor(Colors.Grey)
                .setTitle('🔕 Aucun rappel')
                .setDescription(
                    filter === 'tous'
                        ? "Tu n'as encore aucun rappel. Utilise `/remind` pour en créer un !"
                        : `Aucun rappel ${filter === 'active' ? 'actif' : filter === 'completed' ? 'complété' : 'annulé'}.`
                )
                .setTimestamp(new Date());

            await interaction.reply({ embeds: [empty], flags: 64 });
            return;
        }

        const embeds: EmbedBuilder[] = [];
        for (let index = 0; index < reminders.length; index += MAX_FIELDS_PER_EMBED) {
            const slice = reminders.slice(index, index + MAX_FIELDS_PER_EMBED);
            const embed = new EmbedBuilder()
                .setColor(Colors.Blurple)
                .setTitle('🗓️ Tes rappels')
                .setDescription(`Total : **${reminders.length}** rappel(s)${filter !== 'tous' ? ` • Filtre : ${filter}` : ''}`)
                .setFooter({ text: 'Utilise les boutons pour gérer rapidement tes rappels.' })
                .setTimestamp(new Date());

            slice.forEach((reminder, innerIndex) => {
                const status = STATUS_LABEL[reminder.status];
                const remindSeconds = Math.floor(reminder.remindAt / 1000);
                const repeatLabel = reminder.recurrence === 'none'
                    ? 'Aucune'
                    : reminder.recurrence === 'daily'
                        ? 'Quotidien'
                        : reminder.recurrence === 'weekly'
                            ? 'Hebdomadaire'
                            : 'Mensuel';
                const deliveryTarget = reminder.isPrivate
                    ? 'Message privé'
                    : reminder.channelId
                        ? `<#${reminder.channelId}>`
                        : 'Salon indisponible';

                embed.addFields({
                    name: `${status.emoji} ${index + innerIndex + 1}. ${reminder.message.slice(0, 80)}`,
                    value: [
                        `• Échéance : ${time(remindSeconds, TimestampStyles.LongDateTime)} (${time(remindSeconds, TimestampStyles.RelativeTime)})`,
                        `• Répétition : ${repeatLabel}`,
                        `• Livraison : ${deliveryTarget}`,
                        `• Statut : ${status.label}`,
                        `• ID : \`${reminder.id}\``
                    ].join('\n')
                });
            });

            embeds.push(embed);
        }

        const components: ActionRowBuilder<ButtonBuilder>[] = [];
        if (!statusFilter || statusFilter === 'active') {
            components.push(
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('reminder_cancel_all')
                        .setLabel('❌ Annuler tous les rappels actifs')
                        .setStyle(ButtonStyle.Danger)
                )
            );
        }

        await interaction.reply({
            embeds,
            components,
            flags: 64
        });
    }
}).toJSON();
