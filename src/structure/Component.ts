import type { 
    Interaction 
} from 'discord.js';
import type { DiscordBot } from '../client/DiscordBot.js';

export type ComponentType = 'modal' | 'select' | 'button';

export interface ComponentOptions {
    public?: boolean;
}

export interface ComponentStructure {
    customId: string;
    type: ComponentType;
    options?: Partial<ComponentOptions>;
    run: (client: DiscordBot, interaction: Interaction) => Promise<void> | void;
}

export interface ComponentData extends ComponentStructure {
    __type__: 3;
}

export class Component {
    public data: ComponentData;

    constructor(structure: ComponentStructure) {
        this.data = {
            __type__: 3,
            ...structure
        };
    }

    toJSON() {
        return { ...this.data };
    }
}
