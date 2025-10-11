import type { DiscordBot } from '../../client/DiscordBot.js';
import { MessageFlags } from 'discord.js';
import { Component } from '../../structure/Component.js';

export default new Component({
    customId: 'example-modal-id',
    type: 'modal',
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isModalSubmit()) return;

        const field = interaction.fields.getTextInputValue('example-modal-id-field-1');

        await interaction.reply({
            content: `Hello **${field}**.`,
            flags: [MessageFlags.Ephemeral]
        });
    }
}).toJSON();
