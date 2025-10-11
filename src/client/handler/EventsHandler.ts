import { info, error, success } from '../../utils/Console.js';
import { readdirSync } from 'fs';
import type { DiscordBot } from '../DiscordBot.js';
import type { EventData } from '../../structure/Event.js';
import type { ClientEvents } from 'discord.js';

export class EventsHandler {
    private client: DiscordBot;

    constructor(client: DiscordBot) {
        this.client = client;
    }

    load = async (): Promise<void> => {
        let total = 0;

        for (const directory of readdirSync('./src/events/')) {
            const files = readdirSync('./src/events/' + directory).filter((f: string) => f.endsWith('.ts') || f.endsWith('.js'));
            
            for (const file of files) {
                try {
                    const modulePath = `../../events/${directory}/${file}`;
                    const module = await import(modulePath);
                    const eventData: EventData<keyof ClientEvents> = module.default || module;

                    if (!eventData) continue;

                    if (eventData.__type__ === 5) {
                        if (!eventData.event || !eventData.run) {
                            error('Unable to load the event ' + file);
                            continue;
                        }

                        if (eventData.once) {
                            this.client.once(eventData.event, async (...args) => await eventData.run(this.client, ...args));
                        } else {
                            this.client.on(eventData.event, async (...args) => await eventData.run(this.client, ...args));
                        }

                        info(`Loaded new event: ` + file);

                        total++;
                    } else {
                        error(`Invalid event type ${(eventData as any).__type__} from event file ${file}`);
                    }
                } catch (err) {
                    error('Unable to load an event from the path: ' + 'src/events/' + directory + '/' + file);
                    console.error(err);
                }
            }
        }

        success(`Successfully loaded ${total} events.`);
    };
}
