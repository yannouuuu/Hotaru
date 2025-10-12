import { AutocompleteComponent } from '../../structure/AutocompleteComponent.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import type { AutocompleteInteraction, Snowflake } from 'discord.js';

const respond = async (client: DiscordBot, interaction: AutocompleteInteraction) => {
    if (!interaction.guildId || !client.professorRankingManager) {
        await interaction.respond([]);
        return;
    }

    const focused = interaction.options.getFocused(true);
    const query = focused.value.toLowerCase();

    const professors = client.professorRankingManager
        .listProfessors(interaction.guildId as Snowflake)
        .filter((prof) => prof.active)
        .filter((prof) => !query || prof.name.toLowerCase().includes(query) || prof.id.includes(query))
        .slice(0, 25)
        .map((prof) => ({
            name: prof.emoji ? `${prof.emoji} ${prof.name}` : prof.name,
            value: prof.id
        }));

    await interaction.respond(professors);
};

export default new AutocompleteComponent({
    commandName: 'prof-vote',
    run: respond
}).toJSON();
