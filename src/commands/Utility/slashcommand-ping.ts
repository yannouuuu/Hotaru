import { ChatInputCommandInteraction, ApplicationCommandType } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';

export default new ApplicationCommand({
    command: {
        name: 'ping',
        description: 'Replies with Pong!',
        type: ApplicationCommandType.ChatInput,
        options: []
    },
    options: {
        cooldown: 5000
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        
        await interaction.reply({
            content: `**Pong!** ${client.ws.ping}ms`
        });
    }
}).toJSON();
