import { Colors, EmbedBuilder } from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

export default new Component({
    customId: 'reminder_cancel_all',
    type: 'button',
    options: {
        public: false
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;

        const cancelled = client.reminderService.cancelAllForUser(interaction.user.id, interaction.guildId ?? null);

        if (cancelled === 0) {
            await interaction.reply({
                content: '🔔 Aucun rappel actif à annuler.',
                flags: 64
            });
            return;
        }

        const summaryEmbed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('🧹 Rappels annulés')
            .setDescription(`Tu as annulé ${cancelled} rappel${cancelled > 1 ? 's' : ''} actif${cancelled > 1 ? 's' : ''}.`)
            .setTimestamp(new Date());

        await interaction.update({
            embeds: [summaryEmbed],
            components: []
        });
    }
}).toJSON();
