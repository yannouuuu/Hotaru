import { ApplicationCommandType, MessageFlags } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';

export default new ApplicationCommand({
    command: {
        name: 'help',
        description: 'Replies with a list of available application commands.',
        type: ApplicationCommandType.ChatInput,
        options: []
    },
    options: {
        cooldown: 10000
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        
        const commands = Array.from(client.collection.application_commands.values())
            .map(cmd => `\`/${cmd.command.name}\``)
            .join(', ');
        
        await interaction.reply({
            content: commands || 'No commands available.',
            flags: [MessageFlags.Ephemeral]
        });
    }
}).toJSON();
