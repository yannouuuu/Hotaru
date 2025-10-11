import type { 
    ClientEvents 
} from 'discord.js';
import type { DiscordBot } from '../client/DiscordBot.js';

export interface EventStructure<K extends keyof ClientEvents> {
    event: K;
    once?: boolean;
    run: (client: DiscordBot, ...args: ClientEvents[K]) => Promise<void> | void;
}

export interface EventData<K extends keyof ClientEvents> extends EventStructure<K> {
    __type__: 5;
}

export class Event<K extends keyof ClientEvents> {
    public data: EventData<K>;

    constructor(structure: EventStructure<K>) {
        this.data = {
            __type__: 5,
            ...structure
        };
    }

    toJSON() {
        return { ...this.data };
    }
}
