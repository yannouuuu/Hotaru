import type { Message } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { MessageCommand } from '../../structure/MessageCommand.js';

export default new MessageCommand({
    command: {
        name: 'ping',
        description: 'Replies with Pong!',
        aliases: ['p'],
        permissions: ['SendMessages']
    },
    options: {
        cooldown: 5000
    },
    run: async (client: DiscordBot, message: Message, args: string[]) => {
        void args;
        await message.reply({
            content: `**Pong!** ${client.ws.ping}ms`
        });
    }
}).toJSON();
