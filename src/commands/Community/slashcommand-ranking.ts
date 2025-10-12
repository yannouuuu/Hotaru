import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    EmbedBuilder,
    Colors,
    MessageFlags,
    time,
    TimestampStyles
} from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import type { ProfessorProfile } from '../../types/professor-ranking.js';

const formatMonth = (input?: string): string | null => {
    if (!input) {
        const now = new Date();
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    const match = input.match(/^(\d{4})[-/](\d{1,2})$/);
    if (!match) return null;
    const [, year, month] = match;
    const monthNumber = Number(month);
    if (monthNumber < 1 || monthNumber > 12) return null;

    return `${year}-${monthNumber.toString().padStart(2, '0')}`;
};

const formatYear = (input?: string): string | null => {
    if (!input) {
        return `${new Date().getFullYear()}`;
    }
    return /^\d{4}$/.test(input) ? input : null;
};

const formatLeaderboard = (entries: Array<{ professor: ProfessorProfile; points: number; rank: number }>): string => {
    if (!entries.length) {
        return 'Aucun vote enregistré pour cette période.';
    }

    return entries.slice(0, 10).map((entry) => {
        const badge = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
        return `${badge} **${entry.professor.name}** — ${entry.points} pts`;
    }).join('\n');
};

export default new ApplicationCommand({
    command: {
        name: 'ranking',
        description: 'Afficher les classements des professeurs.',
        type: ApplicationCommandType.ChatInput,
        dmPermission: false,
        options: [
            {
                name: 'weekly',
                description: 'Classement de la semaine en cours.',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'monthly',
                description: 'Classement pour un mois donné (par défaut mois courant).',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'mois',
                        description: 'Format AAAA-MM (ex: 2025-10).',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    }
                ]
            },
            {
                name: 'annual',
                description: 'Classement de l\'année (par défaut année courante).',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'annee',
                        description: 'Format AAAA (ex: 2025).',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    }
                ]
            },
            {
                name: 'history',
                description: 'Historique des positions d\'un prof sur plusieurs semaines.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'professeur',
                        description: 'Nom du professeur.',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                        autocomplete: true
                    },
                    {
                        name: 'semaines',
                        description: 'Nombre de semaines à afficher (1-12).',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        min_value: 1,
                        max_value: 12
                    }
                ]
            },
            {
                name: 'voters',
                description: 'Classement des votants les plus actifs.',
                type: ApplicationCommandOptionType.Subcommand
            }
        ]
    },
    options: {
        cooldown: 3_000
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;

        if (!interaction.inCachedGuild() || !interaction.guildId) {
            await interaction.reply({
                content: '❌ Commande uniquement disponible sur un serveur.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (!client.professorRankingManager) {
            await interaction.reply({
                content: '❌ Le système de classement n\'est pas initialisé.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand(true);
        const manager = client.professorRankingManager;

        switch (subcommand) {
            case 'weekly': {
                const rankings = manager.getCurrentWeekRankings(interaction.guildId);
                const lastArchive = manager.getLatestWeeklyArchive(interaction.guildId);

                const embed = new EmbedBuilder()
                    .setTitle('🏆 Classement hebdomadaire')
                    .setColor(Colors.Gold)
                    .setTimestamp();

                if (!rankings.length) {
                    embed.setDescription('Aucun vote enregistré pour le moment.');
                } else {
                    const previousRanks = new Map<string, number>();
                    if (lastArchive) {
                        for (const entry of lastArchive.rankings) {
                            previousRanks.set(entry.professorId, entry.rank);
                        }
                    }

                    const lines = rankings.slice(0, 10).map((entry) => {
                        const badge = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
                        const hasPrev = previousRanks.has(entry.professor.id);
                        const prev = hasPrev ? previousRanks.get(entry.professor.id)! : null;
                        let delta = '';
                        if (hasPrev && prev !== null) {
                            const diff = prev - entry.rank;
                            if (diff > 0) delta = ` ↑+${diff}`;
                            if (diff < 0) delta = ` ↓${Math.abs(diff)}`;
                            if (diff === 0) delta = ' →';
                        } else if (lastArchive) {
                            delta = ' ✨';
                        }
                        return `${badge} **${entry.professor.name}** — ${entry.points} pts${delta}`;
                    });

                    embed.setDescription(lines.join('\n'));
                }

                if (lastArchive) {
                    embed.addFields({
                        name: 'Derniers résultats',
                        value: `${lastArchive.weekKey} — publié ${time(Math.floor(lastArchive.archivedAt / 1000), TimestampStyles.RelativeTime)}`
                    });
                }

                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'monthly': {
                const monthInput = interaction.options.getString('mois', false) ?? undefined;
                const monthKey = formatMonth(monthInput);

                if (!monthKey) {
                    await interaction.reply({
                        content: '❌ Format de mois invalide. Utilise AAAA-MM (ex: 2025-10).',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const leaderboard = manager.getMonthlyLeaderboard(interaction.guildId, monthKey)
                    .map((entry, index) => ({ ...entry, rank: index + 1 }));

                const embed = new EmbedBuilder()
                    .setTitle(`📅 Classement mensuel — ${monthKey}`)
                    .setColor(Colors.Blue)
                    .setDescription(formatLeaderboard(leaderboard));

                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'annual': {
                const yearInput = interaction.options.getString('annee', false) ?? undefined;
                const yearKey = formatYear(yearInput);

                if (!yearKey) {
                    await interaction.reply({
                        content: '❌ Format d\'année invalide. Utilise AAAA (ex: 2025).',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const leaderboard = manager.getAnnualLeaderboard(interaction.guildId, yearKey)
                    .map((entry, index) => ({ ...entry, rank: index + 1 }));

                const embed = new EmbedBuilder()
                    .setTitle(`📊 Classement annuel — ${yearKey}`)
                    .setColor(Colors.Purple)
                    .setDescription(formatLeaderboard(leaderboard));

                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'history': {
                const professorId = interaction.options.getString('professeur', true);
                const weeks = interaction.options.getInteger('semaines', false) ?? 4;

                const professor = manager.listProfessors(interaction.guildId, true)
                    .find((prof) => prof.id === professorId);

                if (!professor) {
                    await interaction.reply({
                        content: '❌ Professeur introuvable.',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const history = manager.getProfessorHistory(interaction.guildId, professorId, weeks);

                const embed = new EmbedBuilder()
                    .setTitle(`📈 Historique de ${professor.name}`)
                    .setColor(Colors.Gold)
                    .setDescription(history.length ? history.map((entry) => {
                        const rank = entry.rankings.find((rank) => rank.professorId === professorId);
                        if (!rank) return `${entry.weekKey} — 0 pt`;
                        return `${entry.weekKey} — ${rank.points} pts (rang ${rank.rank})`;
                    }).join('\n') : 'Aucun vote enregistré dans la période demandée.')
                    .setFooter({ text: `Derniers ${history.length} résultats disponibles` });

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'voters': {
                const voters = manager.getTopVoters(interaction.guildId, 10);

                const embed = new EmbedBuilder()
                    .setTitle('👑 Votants les plus actifs')
                    .setColor(Colors.Fuchsia);

                if (!voters.length) {
                    embed.setDescription('Aucun vote enregistré pour le moment.');
                } else {
                    const description = await Promise.all(voters.map(async (entry, index) => {
                        const member = await interaction.guild?.members.fetch(entry.userId).catch(() => null);
                        const display = member?.displayName ?? `<@${entry.userId}>`;
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                        const lastVote = time(Math.floor((entry.lastVoteAt ?? Date.now()) / 1000), TimestampStyles.RelativeTime);
                        return `${medal} **${display}** — ${entry.totalVotes} vote(s) • dernier vote ${lastVote}`;
                    }));
                    embed.setDescription(description.join('\n'));
                }

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            default:
                await interaction.reply({
                    content: '❌ Sous-commande inconnue.',
                    flags: MessageFlags.Ephemeral
                });
                break;
        }
    }
}).toJSON();
