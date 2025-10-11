import type { 
    AutocompleteInteraction 
} from 'discord.js';
import type { DiscordBot } from '../client/DiscordBot.js';

export interface AutocompleteComponentStructure {
    commandName: string;
    run: (client: DiscordBot, interaction: AutocompleteInteraction) => Promise<void> | void;
}

export interface AutocompleteComponentData extends AutocompleteComponentStructure {
    __type__: 4;
}

export class AutocompleteComponent {
    public data: AutocompleteComponentData;

    constructor(structure: AutocompleteComponentStructure) {
        this.data = {
            __type__: 4,
            ...structure
        };
    }

    toJSON() {
        return { ...this.data };
    }
}
