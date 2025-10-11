import {
    EmbedBuilder,
    Colors,
    MessageFlags
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

export default new Component({
    customId: 'useful_links_menu',
    type: 'select',

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isStringSelectMenu()) return;

        const selectedUrl = interaction.values[0];

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('🔗 Lien sélectionné')
                    .setDescription(`Voici le lien que vous avez sélectionné :\n\n[Cliquez ici pour y accéder](${selectedUrl})`)
                    .setColor(Colors.Blue)
            ],
            flags: [MessageFlags.Ephemeral]
        });
    }
}).toJSON();
