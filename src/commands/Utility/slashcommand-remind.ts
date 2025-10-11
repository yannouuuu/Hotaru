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
import type { ReminderRecurrence } from '../../types/reminders.js';

const UNIT_MULTIPLIERS = {
    minutes: 60_000,
    heures: 3_600_000,
    jours: 86_400_000,
    semaines: 7 * 86_400_000
} as const;

const RECURRENCE_MAP: Record<string, ReminderRecurrence> = {
    non: 'none',
    quotidien: 'daily',
    hebdomadaire: 'weekly',
    mensuel: 'monthly'
};

const MIN_DELAY_MS = 60_000;
const MAX_DELAY_MS = 365 * 24 * 60 * 60 * 1000;

export default new ApplicationCommand({
    command: {
        name: 'remind',
        description: '📝 Créer un rappel personnel',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'message',
                description: 'Le message de rappel',
                type: ApplicationCommandOptionType.String,
                required: true,
                maxLength: 500
            },
            {
                name: 'temps',
                description: 'Le délai avant le rappel',
                type: ApplicationCommandOptionType.Integer,
                required: true,
                minValue: 1,
                maxValue: 10_000
            },
            {
                name: 'unite',
                description: "L'unité de temps",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: '⏱️ Minutes', value: 'minutes' },
                    { name: '🕐 Heures', value: 'heures' },
                    { name: '📅 Jours', value: 'jours' },
                    { name: '📆 Semaines', value: 'semaines' }
                ]
            },
            {
                name: 'prive',
                description: 'Recevoir le rappel en message privé',
                type: ApplicationCommandOptionType.Boolean,
                required: false
            },
            {
                name: 'repeter',
                description: 'Répéter automatiquement le rappel',
                type: ApplicationCommandOptionType.String,
                required: false,
                choices: [
                    { name: '🔄 Non (une seule fois)', value: 'non' },
                    { name: '🔁 Quotidien', value: 'quotidien' },
                    { name: '📅 Hebdomadaire', value: 'hebdomadaire' },
                    { name: '📆 Mensuel', value: 'mensuel' }
                ]
            }
        ]
    },
    options: {
        cooldown: 5_000
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) {
            await interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', flags: 64 });
            return;
        }

        const message = interaction.options.getString('message', true);
        const amount = interaction.options.getInteger('temps', true);
        const unit = interaction.options.getString('unite', true) as keyof typeof UNIT_MULTIPLIERS;
        const isPrivate = interaction.options.getBoolean('prive') ?? false;
        const recurrenceKey = interaction.options.getString('repeter') ?? 'non';
        const recurrence = RECURRENCE_MAP[recurrenceKey] ?? 'none';

        const multiplier = UNIT_MULTIPLIERS[unit];
        const delayMs = multiplier ? amount * multiplier : Number.NaN;

        if (!Number.isFinite(delayMs) || delayMs < MIN_DELAY_MS) {
            await interaction.reply({ content: '⚠️ Le délai minimum pour un rappel est de 1 minute.', flags: 64 });
            return;
        }

        if (delayMs > MAX_DELAY_MS) {
            await interaction.reply({ content: '⚠️ Le délai maximum pour un rappel est de 1 an.', flags: 64 });
            return;
        }

        const remindAt = Date.now() + delayMs;
        const service = client.reminderService;

        if (!service.canCreateReminder(interaction.user.id, interaction.guildId)) {
            await interaction.reply({ content: '❌ Tu as atteint la limite de rappels actifs. Supprime-en un avant de continuer.', flags: 64 });
            return;
        }

        const reminder = service.createReminder({
            guildId: interaction.guildId,
            channelId: isPrivate ? null : interaction.channelId,
            userId: interaction.user.id,
            message,
            remindAt,
            isPrivate,
            recurrence,
            originalDelayMs: delayMs
        });

        const remindAtSeconds = Math.floor(reminder.remindAt / 1000);
        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('⏰ Rappel programmé')
            .setDescription(`Je te rappellerai ${time(remindAtSeconds, TimestampStyles.RelativeTime)} !`)
            .addFields(
                { name: '📝 Message', value: message, inline: false },
                { name: '📅 Date et heure', value: time(remindAtSeconds, TimestampStyles.LongDateTime), inline: false },
                { name: '📍 Livraison', value: isPrivate ? '📨 Message privé' : '💬 Dans ce salon', inline: true }
            )
            .setFooter({ text: `ID du rappel : ${reminder.id}` })
            .setTimestamp(new Date());

        if (recurrence !== 'none') {
            const label = {
                daily: 'Quotidien',
                weekly: 'Hebdomadaire',
                monthly: 'Mensuel'
            }[recurrence] ?? 'Récurrent';
            embed.addFields({ name: '🔁 Répétition', value: label, inline: true });
        }

        const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('reminder_cancel')
                .setLabel('❌ Annuler ce rappel')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
            embeds: [embed],
            components: [cancelRow],
            flags: 64
        });
    }
}).toJSON();
