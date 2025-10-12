import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    EmbedBuilder,
    Colors,
    MessageFlags
} from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

const OPTION_ORDER: Array<{ name: string; weight: number; option: string; }> = [
    { name: '1er', weight: 3, option: 'premier' },
    { name: '2e', weight: 2, option: 'second' },
    { name: '3e', weight: 1, option: 'troisieme' }
];

export default new ApplicationCommand({
    command: {
        name: 'prof-vote',
        description: 'Vote pour tes professeurs préférés (une fois par semaine).',
        type: ApplicationCommandType.ChatInput,
        dmPermission: false,
        options: OPTION_ORDER.map((entry, index) => ({
            name: entry.option,
            description: `${entry.name} choix (${entry.weight} points)`,
            type: ApplicationCommandOptionType.String,
            required: index === 0,
            autocomplete: true
        }))
    },
    options: {
        cooldown: 5_000
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;

        if (!interaction.inCachedGuild() || !interaction.guildId) {
            await interaction.reply({
                content: '❌ Cette commande ne peut être utilisée que dans un serveur.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (!client.professorRankingManager) {
            await interaction.reply({
                content: '❌ Le classement des professeurs n\'est pas disponible pour le moment.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const picks: string[] = [];
        for (const entry of OPTION_ORDER) {
            const value = interaction.options.getString(entry.option, entry.option === 'premier');
            if (value) {
                picks.push(value);
            }
        }

        try {
            const { totals, weekKey } = client.professorRankingManager.submitVote(
                interaction.guildId,
                interaction.user.id,
                picks
            );

            const rankings = client.professorRankingManager.getCurrentWeekRankings(interaction.guildId);
            const lastArchive = client.professorRankingManager.getLatestWeeklyArchive(interaction.guildId);

            const embed = new EmbedBuilder()
                .setTitle('✅ Vote enregistré !')
                .setDescription('Merci pour ta participation. Rendez-vous dimanche pour les résultats !')
                .setColor(Colors.Green)
                .setFooter({ text: `Semaine ${weekKey}` })
                .setTimestamp();

            const lines = rankings.slice(0, 10).map((entry) => {
                const professor = entry.professor;
                const emoji = professor.emoji ?? (entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '•');

                let deltaText = '';
                if (lastArchive) {
                    const previous = lastArchive.rankings.find((rank) => rank.professorId === professor.id);
                    if (previous) {
                        const diff = previous.rank - entry.rank;
                        if (diff > 0) deltaText = ` (+${diff})`;
                        if (diff < 0) deltaText = ` (${diff})`;
                        if (diff === 0) deltaText = ' (=)';
                    } else {
                        deltaText = ' (nouveau)';
                    }
                }

                return `${emoji} **${professor.name}** — ${entry.points} pts${deltaText}`;
            });

            if (lines.length > 0) {
                embed.addFields({
                    name: 'Classement provisoire',
                    value: lines.join('\n')
                });
            }

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement du vote.';
            await interaction.reply({
                content: `❌ ${message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
}).toJSON();
