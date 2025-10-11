import { info, error, success } from '../../utils/Console.js';
import { readdirSync } from 'fs';
import type { DiscordBot } from '../DiscordBot.js';
import type { ComponentData } from '../../structure/Component.js';
import type { AutocompleteComponentData } from '../../structure/AutocompleteComponent.js';

export class ComponentsHandler {
    private client: DiscordBot;

    constructor(client: DiscordBot) {
        this.client = client;
    }

    load = async (): Promise<void> => {
        for (const directory of readdirSync('./src/components/')) {
            const files = readdirSync('./src/components/' + directory).filter((f: string) => f.endsWith('.ts') || f.endsWith('.js'));
            
            for (const file of files) {
                try {
                    const modulePath = `../../components/${directory}/${file}`;
                    const module = await import(modulePath);
                    const componentData: ComponentData | AutocompleteComponentData = module.default || module;

                    if (!componentData) continue;

                    if (componentData.__type__ === 3) {
                        if (!componentData.customId || !componentData.type || !componentData.run) {
                            error('Unable to load the button/select/modal component ' + file);
                            continue;
                        }

                        switch (componentData.type) {
                            case 'modal':
                                this.client.collection.components.modals.set(componentData.customId, componentData);
                                break;
                            case 'select':
                                this.client.collection.components.selects.set(componentData.customId, componentData);
                                break;
                            case 'button':
                                this.client.collection.components.buttons.set(componentData.customId, componentData);
                                break;
                            default:
                                error('Invalid component type (not: button, select, or modal): ' + file);
                                continue;
                        }

                        info(`Loaded new component (type: ${componentData.type}): ` + file);
                    } else if (componentData.__type__ === 4) {
                        if (!componentData.commandName || !componentData.run) {
                            error('Unable to load the autocomplete component ' + file);
                            continue;
                        }

                        this.client.collection.components.autocomplete.set(componentData.commandName, componentData);

                        info(`Loaded new component (type: autocomplete): ` + file);
                    } else {
                        error(`Invalid component type ${(componentData as any).__type__} from component file ${file}`);
                    }
                } catch (err) {
                    error('Unable to load a component from the path: ' + 'src/components/' + directory + '/' + file);
                    console.error(err);
                }
            }
        }

        const componentsCollection = this.client.collection.components;

        success(
            `Successfully loaded ${componentsCollection.autocomplete.size + componentsCollection.buttons.size + componentsCollection.selects.size + componentsCollection.modals.size} components.`
        );
    };

    reload = async (): Promise<void> => {
        this.client.collection.components.autocomplete.clear();
        this.client.collection.components.buttons.clear();
        this.client.collection.components.modals.clear();
        this.client.collection.components.selects.clear();

        await this.load();
    };
}
