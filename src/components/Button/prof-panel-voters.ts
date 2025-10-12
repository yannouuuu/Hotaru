import { Colors, EmbedBuilder, TimestampStyles, time } from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

export default new Component({
    customId: 'prof-panel_voters',
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

        const voters = manager.getTopVoters(interaction.guildId, 10);

        const lines = await Promise.all(voters.map(async (entry, index) => {
            const member = await interaction.guild?.members.fetch(entry.userId).catch(() => null);
            const display = member?.displayName ?? `<@${entry.userId}>`;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const lastVote = entry.lastVoteAt
                ? time(Math.floor(entry.lastVoteAt / 1000), TimestampStyles.RelativeTime)
                : 'jamais';
            return `${medal} **${display}** — ${entry.totalVotes} vote(s) • ${lastVote}`;
        }));

        const embed = new EmbedBuilder()
            .setTitle('👑 Votants les plus actifs')
            .setColor(Colors.Fuchsia)
            .setDescription(lines.length ? lines.join('\n') : 'Aucun vote enregistré pour le moment.');

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
}).toJSON();
