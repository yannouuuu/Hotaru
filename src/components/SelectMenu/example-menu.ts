import type { DiscordBot } from '../../client/DiscordBot.js';
import { Component } from '../../structure/Component.js';

export default new Component({
    customId: 'example-menu-id',
    type: 'select',
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isAnySelectMenu()) return;

        await interaction.reply({
            content: `Replied from a Select Menu interaction! (You selected **${interaction.values[0]}**).`,
            ephemeral: true
        });
    }
}).toJSON();
