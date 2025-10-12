import { PermissionsBitField, ChannelType } from 'discord.js';
import type { DiscordBot } from '../DiscordBot.js';
import { config } from '../../config.js';
import type { MessageCommandData } from '../../structure/MessageCommand.js';
import type { ApplicationCommandData } from '../../structure/ApplicationCommand.js';
import { handleMessageCommandOptions, handleApplicationCommandOptions } from './CommandOptions.js';
import { error } from '../../utils/Console.js';

export class CommandsListener {
    constructor(client: DiscordBot) {
        client.on('messageCreate', async (message) => {
            if (message.author.bot || message.channel.type === ChannelType.DM) return;

            if (!config.commands.message_commands) return;

            let prefix = config.commands.prefix;

            if (message.guild && client.database.has('prefix-' + message.guild.id)) {
                prefix = client.database.get('prefix-' + message.guild.id);
            }

            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/\s+/g);
            const commandInput = args.shift()?.toLowerCase();

            if (!commandInput || !commandInput.length) return;

            const command: MessageCommandData | undefined =
                client.collection.message_commands.get(commandInput) ||
                client.collection.message_commands.get(
                    client.collection.message_commands_aliases.get(commandInput) || ''
                );

            if (!command) return;

            try {
                if (command.options) {
                    const commandContinue = await handleMessageCommandOptions(message, command.options, command.command);

                    if (!commandContinue) return;
                }

                if (command.command?.permissions && message.member && !message.member.permissions.has(PermissionsBitField.resolve(command.command.permissions))) {
                    await message.reply({
                        content: config.messages.MISSING_PERMISSIONS
                    });

                    return;
                }

                await command.run(client, message, args);
            } catch (err) {
                error(String(err));
            }
        });

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return;

            if (!config.commands.application_commands.chat_input && interaction.isChatInputCommand()) return;
            if (!config.commands.application_commands.user_context && interaction.isUserContextMenuCommand()) return;
            if (!config.commands.application_commands.message_context && interaction.isMessageContextMenuCommand()) return;

            const command: ApplicationCommandData | undefined = client.collection.application_commands.get(interaction.commandName);

            if (!command) return;

            try {
                if (command.options) {
                    const commandContinue = await handleApplicationCommandOptions(interaction, command.options);

                    if (!commandContinue) return;
                }

                await command.run(client, interaction);
            } catch (err) {
                error(String(err));
            }
        });
    }
}
