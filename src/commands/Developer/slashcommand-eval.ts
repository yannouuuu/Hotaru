import { ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import { inspect } from 'util';

export default new ApplicationCommand({
    command: {
        name: 'eval',
        description: 'Execute a JavaScript code.',
        type: ApplicationCommandType.ChatInput,
        options: [{
            name: 'code',
            description: 'The code to execute.',
            type: ApplicationCommandOptionType.String,
            required: true
        }]
    },
    options: {
        botOwner: true
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        
        await interaction.deferReply();

        const code = interaction.options.getString('code', true);

        try {
            let result = eval(code);

            if (typeof result !== 'string') result = inspect(result);

            result = `${result}`.replace(new RegExp(client.token!, 'gi'), 'CLIENT_TOKEN');

            await interaction.editReply({
                content: 'OK, no errors.',
                files: [
                    new AttachmentBuilder(Buffer.from(`${result}`, 'utf-8'), { name: 'output.txt' })
                ]
            });
        } catch (err) {
            await interaction.editReply({
                content: 'Something went wrong.',
                files: [
                    new AttachmentBuilder(Buffer.from(String(err), 'utf-8'), { name: 'error.txt' })
                ]
            });
        }
    }
}).toJSON();
