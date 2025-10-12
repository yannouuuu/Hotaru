import { AttachmentBuilder, ApplicationCommandType } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import { config } from '../../config.js';

export default new ApplicationCommand({
    command: {
        name: 'reload',
        description: 'Reload every command.',
        type: ApplicationCommandType.ChatInput,
        options: []
    },
    options: {
        botDevelopers: true
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        
        await interaction.deferReply();

        try {
            await client.commands_handler.reload();
            await client.commands_handler.registerApplicationCommands(config.development);
            client.scheduleManager.reload();

            await interaction.editReply({
                content: 'Successfully reloaded application commands and message commands.'
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
