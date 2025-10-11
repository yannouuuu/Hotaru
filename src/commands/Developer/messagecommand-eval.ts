import { AttachmentBuilder, type Message } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { MessageCommand } from '../../structure/MessageCommand.js';
import { inspect } from 'util';

export default new MessageCommand({
    command: {
        name: 'eval',
        description: 'Execute a JavaScript code.',
        aliases: ['ev']
    },
    options: {
        botOwner: true
    },
    run: async (client: DiscordBot, message: Message, args: string[]) => {
        if (!args[0]) {
            await message.reply({
                content: 'You must provide the code in order to execute it!'
            });
            return;
        }

        let replyMessage = await message.reply({
            content: 'Please wait...'
        });

        const code = args.join(' ');

        try {
            let result = eval(code);

            if (typeof result !== 'string') result = inspect(result);

            result = `${result}`.replace(new RegExp(client.token!, 'gi'), 'CLIENT_TOKEN');

            await replyMessage.edit({
                content: 'OK, no errors.',
                files: [
                    new AttachmentBuilder(Buffer.from(`${result}`, 'utf-8'), { name: 'output.txt' })
                ]
            });
        } catch (err) {
            await replyMessage.edit({
                content: 'Something went wrong.',
                files: [
                    new AttachmentBuilder(Buffer.from(String(err), 'utf-8'), { name: 'error.txt' })
                ]
            });
        }
    }
}).toJSON();
