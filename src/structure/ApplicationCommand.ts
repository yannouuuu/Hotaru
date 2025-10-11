import type { 
    Interaction,
    ApplicationCommandData as DiscordApplicationCommandData
} from 'discord.js';
import type { DiscordBot } from '../client/DiscordBot.js';

export interface ApplicationCommandOptions {
    cooldown?: number;
    botOwner?: boolean;
    guildOwner?: boolean;
    botDevelopers?: boolean;
}

export interface ApplicationCommandStructure {
    command: DiscordApplicationCommandData;
    options?: Partial<ApplicationCommandOptions>;
    run: (client: DiscordBot, interaction: Interaction) => Promise<void> | void;
}

export interface ApplicationCommandData extends ApplicationCommandStructure {
    __type__: 1;
}

export class ApplicationCommand {
    public data: ApplicationCommandData;

    constructor(structure: ApplicationCommandStructure) {
        this.data = {
            __type__: 1,
            ...structure
        };
    }

    toJSON() {
        return { ...this.data };
    }
}
