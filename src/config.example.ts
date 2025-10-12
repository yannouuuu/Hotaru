export interface DatabaseConfig {
    path: string;
}

export interface DevelopmentConfig {
    enabled: boolean;
    guildId: string;
}

export interface ApplicationCommandsConfig {
    chat_input: boolean;
    user_context: boolean;
    message_context: boolean;
}

export interface CommandsConfig {
    prefix: string;
    message_commands: boolean;
    application_commands: ApplicationCommandsConfig;
}

export interface UsersConfig {
    ownerId: string;
    developers: string[];
}

export interface MessagesConfig {
    NOT_BOT_OWNER: string;
    NOT_BOT_DEVELOPER: string;
    NOT_GUILD_OWNER: string;
    CHANNEL_NOT_NSFW: string;
    MISSING_PERMISSIONS: string;
    COMPONENT_NOT_PUBLIC: string;
    GUILD_COOLDOWN: string;
}

export interface Config {
    database: DatabaseConfig;
    development: DevelopmentConfig;
    commands: CommandsConfig;
    users: UsersConfig;
    messages: MessagesConfig;
}

// This is an example configuration file.
// Copy this to config.ts and customize it for your bot.
export const config: Config = {
    database: {
        path: './database.yml'
    },
    development: {
        enabled: false,
        guildId: 'your_guild_id_here'
    },
    commands: {
        prefix: '!',
        message_commands: true,
        application_commands: {
            chat_input: true,
            user_context: true,
            message_context: true
        }
    },
    users: {
        ownerId: 'your_user_id_here',
        developers: ['your_user_id_here']
    },
    messages: {
        NOT_BOT_OWNER: 'You do not have permission to run this command because you are not the bot owner!',
        NOT_BOT_DEVELOPER: 'You do not have permission to run this command because you are not a bot developer!',
        NOT_GUILD_OWNER: 'You do not have permission to run this command because you are not the guild owner!',
        CHANNEL_NOT_NSFW: 'You cannot run this command in a non-NSFW channel!',
        MISSING_PERMISSIONS: 'You do not have the required permissions to run this command.',
        COMPONENT_NOT_PUBLIC: 'You are not authorized to use this component!',
        GUILD_COOLDOWN: 'You are currently on cooldown. You can use this command again in `%cooldown%s`.'
    }
};
