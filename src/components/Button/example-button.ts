import type { DiscordBot } from '../../client/DiscordBot.js';
import { MessageFlags } from 'discord.js';
import { Component } from '../../structure/Component.js';

export default new Component({
    customId: 'example-button-id',
    type: 'button',
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;

        await interaction.reply({
            content: 'Replied from a Button interaction!',
            flags: [MessageFlags.Ephemeral]
        });
    }
}).toJSON();
