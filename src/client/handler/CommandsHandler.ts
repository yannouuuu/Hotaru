import { REST, Routes, type RESTOptions } from 'discord.js';
import { info, error, success } from '../../utils/Console.js';
import { readdirSync } from 'fs';
import type { DiscordBot } from '../DiscordBot.js';
import type { ApplicationCommandData } from '../../structure/ApplicationCommand.js';
import type { MessageCommandData } from '../../structure/MessageCommand.js';

export class CommandsHandler {
    private client: DiscordBot;

    constructor(client: DiscordBot) {
        this.client = client;
    }

    load = async (): Promise<void> => {
        for (const directory of readdirSync('./src/commands/')) {
            const files = readdirSync('./src/commands/' + directory).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));
            
            for (const file of files) {
                try {
                    const modulePath = `../../commands/${directory}/${file}`;
                    const module = await import(modulePath);
                    const commandData: ApplicationCommandData | MessageCommandData = module.default || module;

                    if (!commandData) continue;

                    if (commandData.__type__ === 2) {
                        if (!commandData.command || !commandData.run) {
                            error('Unable to load the message command ' + file);
                            continue;
                        }

                        this.client.collection.message_commands.set(commandData.command.name, commandData);

                        if (commandData.command.aliases && Array.isArray(commandData.command.aliases)) {
                            commandData.command.aliases.forEach((alias) => {
                                this.client.collection.message_commands_aliases.set(alias, commandData.command.name);
                            });
                        }

                        info('Loaded new message command: ' + file);
                    } else if (commandData.__type__ === 1) {
                        if (!commandData.command || !commandData.run) {
                            error('Unable to load the application command ' + file);
                            continue;
                        }

                        this.client.collection.application_commands.set(commandData.command.name, commandData);
                        this.client.rest_application_commands_array.push(commandData.command);

                        info('Loaded new application command: ' + file);
                    } else {
                        error(`Invalid command type ${(commandData as any).__type__} from command file ${file}`);
                    }
                } catch (err) {
                    error('Unable to load a command from the path: ' + 'src/commands/' + directory + '/' + file);
                    console.error(err);
                }
            }
        }

        success(
            `Successfully loaded ${this.client.collection.application_commands.size} application commands and ${this.client.collection.message_commands.size} message commands.`
        );
    };

    reload = async (): Promise<void> => {
        this.client.collection.message_commands.clear();
        this.client.collection.message_commands_aliases.clear();
        this.client.collection.application_commands.clear();
        this.client.rest_application_commands_array = [];

        await this.load();
    };

    registerApplicationCommands = async (
        development: { enabled: boolean; guildId: string },
        restOptions: Partial<RESTOptions> | null = null
    ): Promise<void> => {
        const rest = new REST(restOptions || { version: '10' }).setToken(this.client.token!);

        if (development.enabled) {
            await rest.put(
                Routes.applicationGuildCommands(this.client.user!.id, development.guildId),
                { body: this.client.rest_application_commands_array }
            );
        } else {
            await rest.put(
                Routes.applicationCommands(this.client.user!.id),
                { body: this.client.rest_application_commands_array }
            );
        }
    };
}
