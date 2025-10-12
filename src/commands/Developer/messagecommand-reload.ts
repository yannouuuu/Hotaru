import { AttachmentBuilder, type Message } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { MessageCommand } from '../../structure/MessageCommand.js';
import { config } from '../../config.js';

export default new MessageCommand({
    command: {
        name: 'reload',
        description: 'Reload every command.',
        aliases: []
    },
    options: {
        botDevelopers: true
    },
    run: async (client: DiscordBot, message: Message, args: string[]) => {
        void args;
        let replyMessage = await message.reply({
            content: 'Please wait...'
        });

        try {
            await client.commands_handler.reload();
            await client.commands_handler.registerApplicationCommands(config.development);
            client.scheduleManager.reload();

            await replyMessage.edit({
                content: 'Successfully reloaded application commands and message commands.'
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
