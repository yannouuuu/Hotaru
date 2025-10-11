import type { DiscordBot } from '../DiscordBot.js';
import { MessageFlags } from 'discord.js';
import { config } from '../../config.js';
import { error } from '../../utils/Console.js';

export class ComponentsListener {
    constructor(client: DiscordBot) {
        client.on('interactionCreate', async (interaction) => {
            const checkUserPermissions = async (component: any): Promise<boolean> => {
                if (component.options?.public === false && 
                    interaction.isMessageComponent() && 
                    interaction.message.interaction &&
                    interaction.user.id !== interaction.message.interaction.user.id) {
                    await interaction.reply({
                        content: config.messages.COMPONENT_NOT_PUBLIC,
                        flags: [MessageFlags.Ephemeral]
                    });
                    return false;
                }
                return true;
            };

            try {
                if (interaction.isButton()) {
                    const component = client.collection.components.buttons.get(interaction.customId);

                    if (!component) return;

                    if (!(await checkUserPermissions(component))) return;

                    try {
                        await component.run(client, interaction);
                    } catch (err) {
                        error(String(err));
                        // Répondre à l'interaction si elle n'a pas été répondue
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: '❌ Une erreur est survenue lors de l\'exécution de cette action.',
                                flags: [MessageFlags.Ephemeral]
                            }).catch(() => {});
                        }
                    }

                    return;
                }

                if (interaction.isAnySelectMenu()) {
                    const component = client.collection.components.selects.get(interaction.customId);

                    if (!component) return;

                    if (!(await checkUserPermissions(component))) return;

                    try {
                        await component.run(client, interaction);
                    } catch (err) {
                        error(String(err));
                    }

                    return;
                }

                if (interaction.isModalSubmit()) {
                    const component = client.collection.components.modals.get(interaction.customId);

                    if (!component) return;

                    try {
                        await component.run(client, interaction);
                    } catch (err) {
                        error(String(err));
                    }

                    return;
                }

                if (interaction.isAutocomplete()) {
                    const component = client.collection.components.autocomplete.get(interaction.commandName);

                    if (!component) return;

                    try {
                        await component.run(client, interaction);
                    } catch (err) {
                        error(String(err));
                    }

                    return;
                }
            } catch (err) {
                error(String(err));
            }
        });
    }
}
