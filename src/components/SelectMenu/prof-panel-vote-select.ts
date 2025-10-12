import { ActionRowBuilder, Colors, EmbedBuilder, StringSelectMenuBuilder, type Snowflake } from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

const buildSummary = (client: DiscordBot, guildId: Snowflake): EmbedBuilder => {
    const manager = client.professorRankingManager!;
    const rankings = manager.getCurrentWeekRankings(guildId).slice(0, 5);

    const lines = rankings.length
        ? rankings.map((entry) => {
            const badge = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
            return `${badge} **${entry.professor.name}** — ${entry.points} pts`;
        })
        : ['Aucun vote enregistré pour le moment.'];

    return new EmbedBuilder()
        .setTitle('✅ Vote enregistré !')
        .setDescription(lines.join('\n'))
        .setColor(Colors.Gold)
        .setFooter({ text: 'Classement mis à jour en direct' });
};

export default new Component({
    customId: 'prof-panel_vote-select',
    type: 'select',
    options: {
        public: false
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isStringSelectMenu()) return;

        if (!interaction.inCachedGuild() || !interaction.guildId) {
            await interaction.reply({
                content: '❌ Cette action n\'est disponible que sur un serveur.',
                ephemeral: true
            });
            return;
        }

        if (!client.professorRankingManager) {
            await interaction.reply({
                content: '❌ Le système de classement est indisponible pour le moment.',
                ephemeral: true
            });
            return;
        }

        const guildId = interaction.guildId as Snowflake;
        const picks = interaction.values;

        try {
            client.professorRankingManager.submitVote(guildId, interaction.user.id as Snowflake, picks);

            const disabledSelect = StringSelectMenuBuilder.from(interaction.component).setDisabled(true);
            const summary = buildSummary(client, guildId);

            await interaction.update({
                embeds: [summary],
                components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(disabledSelect)]
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement du vote.';

            const disabledSelect = StringSelectMenuBuilder.from(interaction.component).setDisabled(true);

            await interaction.update({
                content: `❌ ${message}`,
                components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(disabledSelect)],
                embeds: []
            });
        }
    }
}).toJSON();
