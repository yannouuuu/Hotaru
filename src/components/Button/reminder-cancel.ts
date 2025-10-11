import { Colors, EmbedBuilder, TimestampStyles, time } from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

const REMINDER_ID_REGEX = /ID du rappel\s*:\s*(\S+)/i;

export default new Component({
    customId: 'reminder_cancel',
    type: 'button',
    options: {
        public: false
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;

        const embed = interaction.message.embeds[0];
        const footerText = embed?.footer?.text ?? '';
        const match = footerText.match(REMINDER_ID_REGEX);
        const reminderId = match?.[1];

        if (!reminderId) {
            await interaction.reply({
                content: '❌ Impossible de retrouver ce rappel. Réessaie plus tard.',
                flags: 64
            });
            return;
        }

        const service = client.reminderService;
        const reminder = service.cancelReminder(reminderId);

        if (!reminder) {
            await interaction.reply({
                content: '⚠️ Ce rappel est introuvable ou déjà inactif.',
                flags: 64
            });
            return;
        }

        const remindSeconds = Math.floor(reminder.remindAt / 1000);
        const cancelledEmbed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('❌ Rappel annulé')
            .setDescription(reminder.message)
            .addFields(
                {
                    name: 'Programmée pour',
                    value: time(remindSeconds, TimestampStyles.LongDateTime),
                    inline: true
                },
                {
                    name: 'Statut',
                    value: 'Annulé',
                    inline: true
                }
            )
            .setFooter({ text: `ID du rappel : ${reminder.id}` })
            .setTimestamp(new Date());

        await interaction.update({
            embeds: [cancelledEmbed],
            components: []
        });
    }
}).toJSON();
