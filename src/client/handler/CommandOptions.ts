import type { Message, Interaction } from 'discord.js';
import { MessageFlags } from 'discord.js';
import type { MessageCommandData, MessageCommandOptions } from '../../structure/MessageCommand.js';
import type { ApplicationCommandOptions } from '../../structure/ApplicationCommand.js';
import { config } from '../../config.js';

const application_commands_cooldown = new Map<string, string[]>();
const message_commands_cooldown = new Map<string, string[]>();

export const handleApplicationCommandOptions = async (
    interaction: Interaction,
    options: Partial<ApplicationCommandOptions>
): Promise<boolean> => {
    if (!interaction.isCommand()) return false;

    if (options.botOwner) {
        if (interaction.user.id !== config.users.ownerId) {
            await interaction.reply({
                content: config.messages.NOT_BOT_OWNER,
                flags: [MessageFlags.Ephemeral]
            });
            return false;
        }
    }

    if (options.botDevelopers) {
        if (config.users?.developers?.length > 0 && !config.users?.developers?.includes(interaction.user.id)) {
            await interaction.reply({
                content: config.messages.NOT_BOT_DEVELOPER,
                flags: [MessageFlags.Ephemeral]
            });
            return false;
        }
    }

    if (options.guildOwner) {
        if (!interaction.guild || interaction.user.id !== interaction.guild.ownerId) {
            await interaction.reply({
                content: config.messages.NOT_GUILD_OWNER,
                flags: [MessageFlags.Ephemeral]
            });
            return false;
        }
    }

    if (options.cooldown) {
        const cooldownFunction = () => {
            let data = application_commands_cooldown.get(interaction.user.id) || [];
            data.push(interaction.commandName);
            application_commands_cooldown.set(interaction.user.id, data);

            setTimeout(() => {
                let data = application_commands_cooldown.get(interaction.user.id) || [];
                data = data.filter((v) => v !== interaction.commandName);

                if (data.length <= 0) {
                    application_commands_cooldown.delete(interaction.user.id);
                } else {
                    application_commands_cooldown.set(interaction.user.id, data);
                }
            }, options.cooldown);
        };

        if (application_commands_cooldown.has(interaction.user.id)) {
            const data = application_commands_cooldown.get(interaction.user.id) || [];

            if (data.some((cmd) => cmd === interaction.commandName)) {
                await interaction.reply({
                    content: config.messages.GUILD_COOLDOWN.replace(/%cooldown%/g, String(options.cooldown / 1000)),
                    flags: [MessageFlags.Ephemeral]
                });
                return false;
            } else {
                cooldownFunction();
            }
        } else {
            application_commands_cooldown.set(interaction.user.id, [interaction.commandName]);
            cooldownFunction();
        }
    }

    return true;
};

export const handleMessageCommandOptions = async (
    message: Message,
    options: Partial<MessageCommandOptions>,
    command: MessageCommandData['command']
): Promise<boolean> => {
    if (options.botOwner) {
        if (message.author.id !== config.users.ownerId) {
            await message.reply({
                content: config.messages.NOT_BOT_OWNER
            });
            return false;
        }
    }

    if (options.botDevelopers) {
        if (config.users?.developers?.length > 0 && !config.users?.developers?.includes(message.author.id)) {
            await message.reply({
                content: config.messages.NOT_BOT_DEVELOPER
            });
            return false;
        }
    }

    if (options.guildOwner) {
        if (!message.guild || message.author.id !== message.guild.ownerId) {
            await message.reply({
                content: config.messages.NOT_GUILD_OWNER
            });
            return false;
        }
    }

    if (options.nsfw) {
        if (!message.channel.isDMBased() && 'nsfw' in message.channel && !message.channel.nsfw) {
            await message.reply({
                content: config.messages.CHANNEL_NOT_NSFW
            });
            return false;
        }
    }

    if (options.cooldown) {
        const cooldownFunction = () => {
            let data = message_commands_cooldown.get(message.author.id) || [];
            data.push(command.name);
            message_commands_cooldown.set(message.author.id, data);

            setTimeout(() => {
                let data = message_commands_cooldown.get(message.author.id) || [];
                data = data.filter((v) => v !== command.name);

                if (data.length <= 0) {
                    message_commands_cooldown.delete(message.author.id);
                } else {
                    message_commands_cooldown.set(message.author.id, data);
                }
            }, options.cooldown);
        };

        if (message_commands_cooldown.has(message.author.id)) {
            const data = message_commands_cooldown.get(message.author.id) || [];

            if (data.some((cmd) => cmd === command.name)) {
                await message.reply({
                    content: config.messages.GUILD_COOLDOWN.replace(/%cooldown%/g, String(options.cooldown / 1000))
                });
                return false;
            } else {
                cooldownFunction();
            }
        } else {
            message_commands_cooldown.set(message.author.id, [command.name]);
            cooldownFunction();
        }
    }

    return true;
};
