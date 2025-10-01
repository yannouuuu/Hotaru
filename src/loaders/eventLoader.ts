import type { BotClient } from '../types/index.ts';
import { readdirSync } from 'fs';
import { join } from 'path';

export const loadEvents = async (client: BotClient): Promise<void> => {
  const eventsPath = join(process.cwd(), 'src', 'events');
  
  try {
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts'));

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      const event = await import(filePath);
      
      if (event.default?.name) {
        if (event.default.once) {
          client.once(event.default.name, (...args) => event.default.execute(...args, client));
        } else {
          client.on(event.default.name, (...args) => event.default.execute(...args, client));
        }
      } else {
        console.warn(`L'événement ${file} n'a pas de nom`);
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error);
  }
};

