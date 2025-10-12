import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    Collection,
    Colors,
    EmbedBuilder,
    PermissionFlagsBits,
    type Guild,
    type Message,
    type Snowflake,
    type TextChannel,
    type NewsChannel
} from 'discord.js';
import type { DiscordBot } from '../client/DiscordBot.js';
import type {
    VoteWeight,
    ProfessorProfile,
    WeeklyTotals,
    WeeklyArchiveEntry,
    ProfessorRankingData,
    ArchiveResult
} from '../types/professor-ranking.js';

type ResetScope = 'week' | 'month' | 'year' | 'all';

const WEIGHT_MAP: VoteWeight[] = [3, 2, 1];
const BADGE_EMOJIS = ['🥇', '🥈', '🥉'];
const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const PANEL_BUTTON_IDS = {
    vote: 'prof-panel_vote',
    monthly: 'prof-panel_monthly',
    annual: 'prof-panel_annual',
    history: 'prof-panel_history',
    voters: 'prof-panel_voters'
} as const;

function slugify(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

function getIsoWeek(date: Date): { year: number; week: number } {
    const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: tempDate.getUTCFullYear(), week };
}

function getWeekKey(date = new Date()): string {
    const { year, week } = getIsoWeek(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getNextWeekKey(date = new Date()): string {
    const next = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    return getWeekKey(next);
}

function parseWeekKey(key: string): { year: number; week: number } | null {
    const match = key.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return null;
    return { year: Number(match[1]), week: Number(match[2]) };
}

function compareWeekKeys(a: string, b: string): number {
    const parsedA = parseWeekKey(a);
    const parsedB = parseWeekKey(b);
    if (!parsedA || !parsedB) return 0;
    if (parsedA.year !== parsedB.year) {
        return parsedA.year - parsedB.year;
    }
    return parsedA.week - parsedB.week;
}

function getMonthKey(date = new Date()): string {
    return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`;
}

function getYearKey(date = new Date()): string {
    return `${date.getUTCFullYear()}`;
}

function sortLeaderboard(totals: Record<string, number>): Array<{ professorId: string; points: number; rank: number }> {
    const entries = Object.entries(totals)
        .filter(([, points]) => points > 0)
        .sort((a, b) => b[1] - a[1]);

    let currentRank = 0;
    let lastPoints: number | null = null;

    return entries.map(([professorId, points], index) => {
        if (lastPoints === null || points < lastPoints) {
            currentRank = index + 1;
        }
        lastPoints = points;

        return { professorId, points, rank: currentRank };
    });
}

export class ProfessorRankingManager {
    private readonly cache = new Collection<Snowflake, ProfessorRankingData>();
    private timer: ReturnType<typeof setInterval> | null = null;

    constructor(private readonly client: DiscordBot) {}

    public start(): void {
        if (this.timer) return;
        this.timer = setInterval(() => {
            void this.runMaintenance();
        }, CHECK_INTERVAL_MS);
        void this.runMaintenance();
    }

    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    public getGuildData(guildId: Snowflake): ProfessorRankingData {
        const cached = this.cache.get(guildId);
        if (cached) {
            return cached;
        }

        const stored = this.client.database.get(`prof_ranking_${guildId}`) as ProfessorRankingData | undefined;
        const weekKey = getWeekKey();
        const monthKey = getMonthKey();
        const yearKey = getYearKey();

        const data: ProfessorRankingData = stored ? {
            ...stored,
            weekly: stored.weekly?.weekKey === weekKey ? {
                ...stored.weekly,
                voters: stored.weekly.voters ?? {}
            } : {
                weekKey,
                totals: {},
                votes: {},
                voters: {}
            }
        } : {
            professors: {},
            weekly: {
                weekKey,
                totals: {},
                votes: {},
                voters: {}
            },
            history: {
                weekly: {}
            },
            voterStats: {},
            lastSeenWeek: weekKey,
            lastSeenMonth: monthKey,
            lastSeenYear: yearKey
        };

        if (!data.history) {
            data.history = { weekly: {} };
        }

        if (!data.voterStats) {
            data.voterStats = {};
        }

        if (!data.weekly.voters) {
            data.weekly.voters = {};
        }

        if (!data.lastSeenWeek) data.lastSeenWeek = weekKey;
        if (!data.lastSeenMonth) data.lastSeenMonth = monthKey;
        if (!data.lastSeenYear) data.lastSeenYear = yearKey;

        this.cache.set(guildId, data);
        return data;
    }

    private saveGuildData(guildId: Snowflake, data: ProfessorRankingData): void {
        this.cache.set(guildId, data);
        this.client.database.set(`prof_ranking_${guildId}`, data);
    }

    public listProfessors(guildId: Snowflake, includeInactive = false): ProfessorProfile[] {
        const data = this.getGuildData(guildId);
        return Object.values(data.professors).filter((prof) => includeInactive || prof.active);
    }

    public findProfessorByName(guildId: Snowflake, name: string): ProfessorProfile | null {
        const data = this.getGuildData(guildId);
        const normalized = name.trim().toLowerCase();
        return Object.values(data.professors).find((prof) => prof.name.toLowerCase() === normalized) ?? null;
    }

    public addProfessor(guildId: Snowflake, name: string, options: { bio?: string; quote?: string; emoji?: string; addedBy: Snowflake }): ProfessorProfile {
        const data = this.getGuildData(guildId);
        const id = slugify(name);

        if (!id || id.length < 2) {
            throw new Error('Nom de professeur invalide.');
        }

        if (data.professors[id]?.active) {
            throw new Error('Ce professeur est déjà enregistré.');
        }

        const profile: ProfessorProfile = {
            id,
            name: name.trim(),
            bio: options.bio?.trim() || undefined,
            quote: options.quote?.trim() || undefined,
            emoji: options.emoji?.trim() || undefined,
            addedBy: options.addedBy,
            addedAt: Date.now(),
            active: true,
            stats: {
                totalPoints: data.professors[id]?.stats.totalPoints ?? 0,
                monthly: data.professors[id]?.stats.monthly ?? {},
                annual: data.professors[id]?.stats.annual ?? {},
                weeklyBest: data.professors[id]?.stats.weeklyBest
            }
        };

        data.professors[id] = profile;
        this.saveGuildData(guildId, data);
        return profile;
    }

    public removeProfessor(guildId: Snowflake, id: string): ProfessorProfile {
        const data = this.getGuildData(guildId);
        const professor = data.professors[id];
        if (!professor || !professor.active) {
            throw new Error('Ce professeur n\'existe pas ou est déjà désactivé.');
        }

        professor.active = false;
        this.saveGuildData(guildId, data);
        return professor;
    }

    public setArchiveChannel(guildId: Snowflake, channelId: Snowflake | null): void {
        const data = this.getGuildData(guildId);
        data.archiveChannelId = channelId ?? undefined;
        this.saveGuildData(guildId, data);
    }

    public async deployPanel(guild: Guild, channelId: Snowflake): Promise<{ messageId: Snowflake }> {
        const guildId = guild.id as Snowflake;
        const data = this.getGuildData(guildId);
        const channel = await guild.channels.fetch(channelId).catch(() => null);

        if (!channel || !channel.isTextBased()) {
            throw new Error('Impossible de publier le panel : salon texte introuvable.');
        }

        if (data.panel && (data.panel.channelId !== channelId)) {
            await this.removePanelMessage(guild, data.panel).catch(() => undefined);
        }

        const embed = this.buildPanelEmbed(guildId);
        const components = this.buildPanelComponents();

        let message: Message | null = null;

        if (data.panel && data.panel.channelId === channelId) {
            message = await (channel as TextChannel | NewsChannel).messages.fetch(data.panel.messageId).catch(() => null);
            if (message) {
                await message.edit({ embeds: [embed], components });
            }
        }

        if (!message) {
            message = await (channel as TextChannel | NewsChannel).send({ embeds: [embed], components });
        }

        data.panel = {
            channelId,
            messageId: message.id as Snowflake
        };

        this.saveGuildData(guildId, data);
        return { messageId: message.id as Snowflake };
    }

    public async clearPanel(guild: Guild): Promise<void> {
        const guildId = guild.id as Snowflake;
        const data = this.getGuildData(guildId);

        if (data.panel) {
            await this.removePanelMessage(guild, data.panel).catch(() => undefined);
            data.panel = undefined;
            this.saveGuildData(guildId, data);
        }
    }

    private async removePanelMessage(guild: Guild, panel: { channelId: Snowflake; messageId: Snowflake }): Promise<void> {
        const channel = await guild.channels.fetch(panel.channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) return;

        await (channel as TextChannel | NewsChannel).messages.delete(panel.messageId).catch(() => null);
    }

    private buildPanelEmbed(guildId: Snowflake): EmbedBuilder {
        const weeklyRankings = this.getCurrentWeekRankings(guildId);
        const monthKey = getMonthKey();
        const yearKey = getYearKey();
        const monthlyTop = this.getMonthlyLeaderboard(guildId, monthKey).slice(0, 3);
        const annualTop = this.getAnnualLeaderboard(guildId, yearKey).slice(0, 3);

        const weeklyLines = weeklyRankings.length
            ? weeklyRankings.slice(0, 10).map((entry) => {
                const badge = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
                return `${badge} **${entry.professor.name}** — ${entry.points} pts`;
            })
            : ['Aucun vote enregistré pour le moment.'];

        const monthlyLines = monthlyTop.length
            ? monthlyTop.map((entry, index) => `${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} ${entry.professor.name} (${entry.points} pts)`)
            : ['Aucun point ce mois-ci.'];

        const annualLines = annualTop.length
            ? annualTop.map((entry, index) => `${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} ${entry.professor.name} (${entry.points} pts)`)
            : ['Aucun point cette année.'];

        return new EmbedBuilder()
            .setTitle('🏆 Classement des professeurs')
            .setDescription(weeklyLines.join('\n'))
            .addFields(
                {
                    name: `📅 Top ${monthKey}`,
                    value: monthlyLines.join('\n'),
                    inline: true
                },
                {
                    name: `📊 Top ${yearKey}`,
                    value: annualLines.join('\n'),
                    inline: true
                }
            )
            .addFields({
                name: 'Comment voter ?',
                value: 'Clique sur **Voter** pour sélectionner jusqu\'à trois professeurs (3/2/1 points). Résultats mis à jour en direct.'
            })
            .setColor(Colors.Gold)
            .setTimestamp();
    }

    private buildPanelComponents(): ActionRowBuilder<ButtonBuilder>[] {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(PANEL_BUTTON_IDS.vote)
                .setLabel('Voter')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(PANEL_BUTTON_IDS.monthly)
                .setLabel('Classement mensuel')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(PANEL_BUTTON_IDS.annual)
                .setLabel('Classement annuel')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(PANEL_BUTTON_IDS.history)
                .setLabel('Historique prof')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(PANEL_BUTTON_IDS.voters)
                .setLabel('Top votants')
                .setStyle(ButtonStyle.Secondary)
        );

        return [row];
    }

    private async getPanelContext(guildId: Snowflake): Promise<{ guild: Guild; channel: TextChannel | NewsChannel; message: Message; data: ProfessorRankingData } | null> {
        const data = this.getGuildData(guildId);
        if (!data.panel) {
            return null;
        }

        const guild = this.client.guilds.cache.get(guildId) ?? await this.client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            data.panel = undefined;
            this.saveGuildData(guildId, data);
            return null;
        }

        const channel = await guild.channels.fetch(data.panel.channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
            data.panel = undefined;
            this.saveGuildData(guildId, data);
            return null;
        }

        const target = channel as TextChannel | NewsChannel;
        const message = await target.messages.fetch(data.panel.messageId).catch(() => null);
        if (!message) {
            data.panel = undefined;
            this.saveGuildData(guildId, data);
            return null;
        }

        return { guild, channel: target, message, data };
    }

    public async refreshPanel(guildId: Snowflake): Promise<void> {
        const context = await this.getPanelContext(guildId);
        if (!context) {
            return;
        }

        const embed = this.buildPanelEmbed(guildId);
        const components = this.buildPanelComponents();

        await context.message.edit({ embeds: [embed], components }).catch((error) => {
            console.error('❌ [ProfessorRankingManager] Impossible de mettre à jour le panel :', error);
        });
    }

    public refreshPanelSafe(guildId: Snowflake): void {
        void this.refreshPanel(guildId);
    }

    public submitVote(guildId: Snowflake, userId: Snowflake, picks: string[]): { weekKey: string; totals: Record<string, number>; } {
        const data = this.getGuildData(guildId);
        const weekKey = getWeekKey();
        const storedWeekKey = data.weekly.weekKey;

        if (storedWeekKey !== weekKey) {
            const comparison = compareWeekKeys(storedWeekKey, weekKey);
            if (comparison > 0) {
                // Stored week is already the next period (e.g., après archivage)
                // keep stored week key and avoid reopening the previous week
            } else {
                this.rotateWeek(data, weekKey);
            }
        }

        if (data.weekly.votes[userId]) {
            throw new Error('Tu as déjà voté cette semaine. Repasse dimanche prochain !');
        }

        const uniquePicks = [...new Set(picks.filter(Boolean))];
        if (uniquePicks.length === 0) {
            throw new Error('Merci de sélectionner au moins un professeur.');
        }

        uniquePicks.forEach((id) => {
            const professor = data.professors[id];
            if (!professor || !professor.active) {
                throw new Error(`Le professeur sélectionné (${id}) n'existe pas ou n'est plus actif.`);
            }
        });

        const weights = WEIGHT_MAP.slice(0, uniquePicks.length);
        uniquePicks.forEach((id, index) => {
            data.weekly.totals[id] = (data.weekly.totals[id] ?? 0) + weights[index];
        });

        data.weekly.votes[userId] = {
            picks: uniquePicks,
            weights,
            timestamp: Date.now()
        };

        data.weekly.voters[userId] = (data.weekly.voters[userId] ?? 0) + 1;

        const voterStats = data.voterStats[userId] ?? { totalVotes: 0, lastVoteAt: 0 };
        voterStats.totalVotes += 1;
        voterStats.lastVoteAt = Date.now();
        data.voterStats[userId] = voterStats;

        this.saveGuildData(guildId, data);
        this.refreshPanelSafe(guildId);
        return { weekKey: data.weekly.weekKey, totals: data.weekly.totals };
    }

    public getCurrentWeekLeaderboard(guildId: Snowflake): WeeklyTotals {
        const data = this.getGuildData(guildId);
        const weekKey = getWeekKey();
        if (data.weekly.weekKey !== weekKey) {
            this.rotateWeek(data, weekKey);
            this.saveGuildData(guildId, data);
        }
        return data.weekly;
    }

    public getCurrentWeekRankings(guildId: Snowflake): Array<{ professor: ProfessorProfile; points: number; rank: number }> {
        const data = this.getGuildData(guildId);
        const weekly = this.getCurrentWeekLeaderboard(guildId);
        const leaderboard = sortLeaderboard(weekly.totals);

        return leaderboard.map((entry) => {
            const professor = data.professors[entry.professorId];
            return {
                professor: professor ?? {
                    id: entry.professorId,
                    name: entry.professorId,
                    bio: undefined,
                    quote: undefined,
                    emoji: undefined,
                    addedBy: '0' as Snowflake,
                    addedAt: 0,
                    active: false,
                    stats: {
                        totalPoints: 0,
                        monthly: {},
                        annual: {}
                    }
                },
                points: entry.points,
                rank: entry.rank
            };
        });
    }

    public getMonthlyLeaderboard(guildId: Snowflake, monthKey = getMonthKey()): Array<{ professor: ProfessorProfile; points: number }> {
        const data = this.getGuildData(guildId);
        return Object.values(data.professors)
            .filter((prof) => prof.active || (prof.stats.monthly[monthKey] ?? 0) > 0)
            .map((prof) => ({
                professor: prof,
                points: prof.stats.monthly[monthKey] ?? 0
            }))
            .filter((entry) => entry.points > 0)
            .sort((a, b) => b.points - a.points);
    }

    public getAnnualLeaderboard(guildId: Snowflake, yearKey = getYearKey()): Array<{ professor: ProfessorProfile; points: number }> {
        const data = this.getGuildData(guildId);
        return Object.values(data.professors)
            .filter((prof) => prof.active || (prof.stats.annual[yearKey] ?? 0) > 0)
            .map((prof) => ({
                professor: prof,
                points: prof.stats.annual[yearKey] ?? 0
            }))
            .filter((entry) => entry.points > 0)
            .sort((a, b) => b.points - a.points);
    }

    public getWeeklyHistory(guildId: Snowflake, weekCount = 4): WeeklyArchiveEntry[] {
        const data = this.getGuildData(guildId);
        return Object
            .values(data.history.weekly)
            .sort((a, b) => b.archivedAt - a.archivedAt)
            .slice(0, weekCount);
    }

    public getLatestWeeklyArchive(guildId: Snowflake): WeeklyArchiveEntry | null {
        const history = this.getWeeklyHistory(guildId, 1);
        return history[0] ?? null;
    }

    public getProfessorHistory(guildId: Snowflake, professorId: string, weekCount = 4): WeeklyArchiveEntry[] {
        const history = this.getWeeklyHistory(guildId, 30);
        return history
            .filter((entry) => entry.rankings.some((rank) => rank.professorId === professorId))
            .slice(0, weekCount);
    }

    public getTopVoters(guildId: Snowflake, limit = 10): Array<{ userId: Snowflake; totalVotes: number; lastVoteAt: number; weeklyCount: number; }> {
        const data = this.getGuildData(guildId);
        const weeklyVotes = data.weekly.votes;

        return Object.entries(data.voterStats)
            .map(([userId, stats]) => ({
                userId: userId as Snowflake,
                totalVotes: stats.totalVotes,
                lastVoteAt: stats.lastVoteAt,
                weeklyCount: weeklyVotes[userId as Snowflake]?.picks.length ?? 0
            }))
            .sort((a, b) => b.totalVotes - a.totalVotes)
            .slice(0, limit);
    }

    public reset(guildId: Snowflake, scope: ResetScope): void {
        const data = this.getGuildData(guildId);
        const weekKey = getWeekKey();
        const monthKey = getMonthKey();
        const yearKey = getYearKey();

        if (scope === 'week' || scope === 'all') {
            data.weekly = {
                weekKey,
                totals: {},
                votes: {},
                voters: {}
            };
        }

        if (scope === 'month' || scope === 'all') {
            for (const prof of Object.values(data.professors)) {
                prof.stats.monthly = scope === 'all' ? {} : { [monthKey]: 0 };
            }
        }

        if (scope === 'year' || scope === 'all') {
            for (const prof of Object.values(data.professors)) {
                prof.stats.annual = scope === 'all' ? {} : { [yearKey]: 0 };
                if (scope === 'all') {
                    prof.stats.totalPoints = 0;
                }
            }
        }

        if (scope === 'all') {
            data.history.weekly = {};
            data.voterStats = {};
        }

        this.saveGuildData(guildId, data);
    }

    public async archiveCurrentWeek(guildId: Snowflake, guild?: Guild | null): Promise<ArchiveResult | null> {
        const data = this.getGuildData(guildId);
        const currentWeekKey = getWeekKey();

        if (data.weekly.weekKey !== currentWeekKey) {
            // If week already rolled over automatically, nothing to archive here
            return null;
        }

        if (Object.keys(data.weekly.totals).length === 0) {
            // Nothing to archive but still rotate to avoid stale votes
            this.rotateWeek(data, currentWeekKey, true);
            this.saveGuildData(guildId, data);
            return null;
        }

        const archiveEntry = this.buildArchiveEntry(data.weekly);
        data.history.weekly[archiveEntry.weekKey] = archiveEntry;

        const monthKey = getMonthKey();
        const yearKey = getYearKey();

        for (const { professorId, points } of archiveEntry.rankings) {
            const prof = data.professors[professorId];
            if (!prof) continue;

            prof.stats.totalPoints += points;
            prof.stats.monthly[monthKey] = (prof.stats.monthly[monthKey] ?? 0) + points;
            prof.stats.annual[yearKey] = (prof.stats.annual[yearKey] ?? 0) + points;

            const best = prof.stats.weeklyBest ?? `${archiveEntry.weekKey}:${points}`;
            const [, bestPointsRaw] = best.split(':');
            const bestPoints = Number(bestPointsRaw) || 0;
            if (points > bestPoints) {
                prof.stats.weeklyBest = `${archiveEntry.weekKey}:${points}`;
            }
        }

        data.weekly = {
            weekKey: getNextWeekKey(new Date(archiveEntry.archivedAt)),
            totals: {},
            votes: {},
            voters: {}
        };

        this.saveGuildData(guildId, data);
        this.refreshPanelSafe(guildId);

        if (data.archiveChannelId && guild) {
            await this.publishArchive(guild, data.archiveChannelId, archiveEntry);
        }

        return {
            weekKey: archiveEntry.weekKey,
            leaderboard: archiveEntry.rankings,
            totals: archiveEntry.totals
        };
    }

    private buildArchiveEntry(weekly: WeeklyTotals): WeeklyArchiveEntry {
        const leaderboard = sortLeaderboard(weekly.totals);
        return {
            weekKey: weekly.weekKey,
            totals: { ...weekly.totals },
            rankings: leaderboard,
            archivedAt: Date.now()
        };
    }

    private rotateWeek(data: ProfessorRankingData, newWeekKey: string, force = false): void {
        if (!force && data.weekly.weekKey === newWeekKey) {
            return;
        }

        data.weekly = {
            weekKey: newWeekKey,
            totals: {},
            votes: {},
            voters: {}
        };
        data.lastSeenWeek = newWeekKey;
    }

    private async runMaintenance(): Promise<void> {
        const now = new Date();
        const weekKey = getWeekKey(now);
        const monthKey = getMonthKey(now);
        const yearKey = getYearKey(now);

        for (const guild of this.client.guilds.cache.values()) {
            const guildId = guild.id as Snowflake;
            const data = this.getGuildData(guildId);

            let updated = false;

            if (data.lastSeenMonth !== monthKey) {
                data.lastSeenMonth = monthKey;
                // No direct action, monthly counters roll automatically during archive
                updated = true;
            }

            if (data.lastSeenYear !== yearKey) {
                data.lastSeenYear = yearKey;
                updated = true;
            }

            if (data.weekly.weekKey !== weekKey) {
                const comparison = compareWeekKeys(data.weekly.weekKey, weekKey);
                if (comparison < 0) {
                    this.rotateWeek(data, weekKey);
                    updated = true;
                }
            }

            if (this.shouldArchive(now) && data.weekly.weekKey === weekKey) {
                const result = await this.archiveCurrentWeek(guildId, guild).catch((error) => {
                    console.error('❌ [ProfessorRankingManager] Failed to archive week:', error);
                    return null;
                });
                if (result) {
                    updated = true;
                }
            }

            if (updated) {
                this.saveGuildData(guildId, data);
                this.refreshPanelSafe(guildId);
            }
        }
    }

    private shouldArchive(date: Date): boolean {
        const day = date.getUTCDay();
        const hour = date.getUTCHours();
        // Sunday evening 20:00 local Paris ~ 18:00 UTC (depending on DST)
        // We'll trigger when it's Sunday and >= 18:00 UTC to approximate
        return day === 0 && hour >= 18;
    }

    private async publishArchive(guild: Guild, channelId: Snowflake, archive: WeeklyArchiveEntry): Promise<void> {
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`Classement hebdo – ${archive.weekKey}`)
            .setColor(Colors.Gold)
            .setTimestamp(new Date(archive.archivedAt));

        const lines = archive.rankings.slice(0, 10).map((entry, index) => {
            const professor = this.getGuildData(guild.id as Snowflake).professors[entry.professorId];
            const badge = BADGE_EMOJIS[index] ?? '•';
            const name = professor ? professor.name : entry.professorId;
            return `${badge} **${name}** — ${entry.points} pts`;
        });

        embed.setDescription(lines.join('\n'));

        if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
            if ('permissionsFor' in channel && guild.members.me) {
                const permissions = channel.permissionsFor(guild.members.me);
                if (!permissions?.has(PermissionFlagsBits.SendMessages)) {
                    return;
                }
            }

            const target = channel as TextChannel | NewsChannel;
            await target.send({ embeds: [embed] });
        }
    }
}
