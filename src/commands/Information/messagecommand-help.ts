import type { Message } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { MessageCommand } from '../../structure/MessageCommand.js';
import { config } from '../../config.js';

export default new MessageCommand({
    command: {
        name: 'help',
        description: 'Replies with a list of available message commands.',
        aliases: ['h']
    },
    options: {
        cooldown: 10000
    },
    run: async (client: DiscordBot, message: Message, args: string[]) => {
        if (!message.guild) return;

        const prefix = client.database.ensure('prefix-' + message.guild.id, config.commands.prefix);
        const commands = Array.from(client.collection.message_commands.values())
            .map(cmd => `\`${prefix}${cmd.command.name}\``)
            .join(', ');

        await message.reply({
            content: commands || 'No commands available.'
        });
    }
}).toJSON();
