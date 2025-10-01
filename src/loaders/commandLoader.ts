import { Collection } from 'discord.js';
import { Command } from '../types/index.ts';
import { readdirSync } from 'fs';
import { join } from 'path';

export const loadCommands = async (): Promise<Collection<string, Command>> => {
  const commands = new Collection<string, Command>();
  const commandsPath = join(process.cwd(), 'src', 'commands');
  
  try {
    const commandFolders = readdirSync(commandsPath);

    for (const folder of commandFolders) {
      const folderPath = join(commandsPath, folder);
      const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.ts'));

      for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        const command = await import(filePath) as { default: Command };
        
        if ('data' in command.default && 'execute' in command.default) {
          commands.set(command.default.data.name, command.default);
        } else {
          console.warn(`La commande ${file} n'a pas de data ou execute`);
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des commandes:', error);
  }

  return commands;
};

