import { Colors, EmbedBuilder } from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

const getMonthKey = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

export default new Component({
    customId: 'prof-panel_monthly',
    type: 'button',
    options: {
        public: false
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;

        if (!interaction.inCachedGuild() || !interaction.guildId) {
            await interaction.reply({
                content: '❌ Cette action n\'est disponible que sur un serveur.',
                ephemeral: true
            });
            return;
        }

        const manager = client.professorRankingManager;
        if (!manager) {
            await interaction.reply({
                content: '❌ Le système de classement est indisponible pour le moment.',
                ephemeral: true
            });
            return;
        }

        const guildId = interaction.guildId;
        const monthKey = getMonthKey();
        const leaderboard = manager.getMonthlyLeaderboard(guildId, monthKey).map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        const description = leaderboard.length
            ? leaderboard
                .slice(0, 10)
                .map((entry) => {
                    const badge = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
                    return `${badge} **${entry.professor.name}** — ${entry.points} pts`;
                })
                .join('\n')
            : 'Aucun point enregistré ce mois-ci.';

        const embed = new EmbedBuilder()
            .setTitle(`📅 Classement mensuel — ${monthKey}`)
            .setDescription(description)
            .setColor(Colors.Blue);

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
}).toJSON();
