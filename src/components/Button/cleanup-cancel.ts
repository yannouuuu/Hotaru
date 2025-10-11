import {
    ButtonInteraction,
    EmbedBuilder,
    Colors
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

export default new Component({
    customId: 'cleanup_cancel',
    type: 'button',

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;
        const cancelEmbed = new EmbedBuilder()
            .setTitle('✅ Opération annulée')
            .setDescription(
                'Le nettoyage du serveur a été annulé.\n\n' +
                'Aucune modification n\'a été effectuée.'
            )
            .setColor(Colors.Green)
            .setFooter({ text: 'Hotaru - Cleanup annulé' })
            .setTimestamp();

        await interaction.update({
            embeds: [cancelEmbed],
            components: []
        });
    }
}).toJSON();
