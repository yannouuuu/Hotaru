import type { DiscordBot } from '../../client/DiscordBot.js';
import { AutocompleteComponent } from '../../structure/AutocompleteComponent.js';

export default new AutocompleteComponent({
    commandName: 'autocomplete',
    run: async (client: DiscordBot, interaction) => {
        const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew'];

        const currentInput = interaction.options.getFocused();
        const filteredFruits = fruits.filter(fruit => 
            fruit.toLowerCase().startsWith(currentInput.toLowerCase())
        );

        await interaction.respond(
            filteredFruits.slice(0, 25).map(fruit => ({ name: fruit, value: fruit }))
        );
    }
}).toJSON();
