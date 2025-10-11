import type { 
    Message, 
    PermissionResolvable 
} from 'discord.js';
import type { DiscordBot } from '../client/DiscordBot.js';

export interface MessageCommandInfo {
    name: string;
    description?: string;
    aliases?: string[];
    permissions?: PermissionResolvable[];
}

export interface MessageCommandOptions {
    cooldown?: number;
    botOwner?: boolean;
    guildOwner?: boolean;
    botDevelopers?: boolean;
    nsfw?: boolean;
}

export interface MessageCommandStructure {
    command: MessageCommandInfo;
    options?: Partial<MessageCommandOptions>;
    run: (client: DiscordBot, message: Message, args: string[]) => Promise<void> | void;
}

export interface MessageCommandData extends MessageCommandStructure {
    __type__: 2;
}

export class MessageCommand {
    public data: MessageCommandData;

    constructor(structure: MessageCommandStructure) {
        this.data = {
            __type__: 2,
            ...structure
        };
    }

    toJSON() {
        return { ...this.data };
    }
}
