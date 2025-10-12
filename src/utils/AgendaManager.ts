import { Colors, EmbedBuilder, PermissionFlagsBits, TimestampStyles, time, type GuildTextBasedChannel, type Snowflake } from 'discord.js';
import { randomUUID } from 'node:crypto';
import type { DiscordBot } from '../client/DiscordBot.js';
import type { AgendaGuildData, AgendaListOptions, AgendaTask, AgendaTaskInput } from '../types/agenda.js';

const DAILY_DIGEST_HOUR = 16;
const DAILY_DIGEST_MINUTE = 30;
const DIGEST_TITLE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
});

export class AgendaManager {
    private readonly client: DiscordBot;
    private readonly cache = new Map<Snowflake, AgendaGuildData>();
    private digestTimer: ReturnType<typeof setTimeout> | null = null;
    private started = false;

    constructor(client: DiscordBot) {
        this.client = client;
    }

    public start(): void {
        if (this.started) return;
        this.started = true;
        this.scheduleNextDigest();
    }

    public stop(): void {
        if (this.digestTimer) {
            clearTimeout(this.digestTimer);
            this.digestTimer = null;
        }
        this.started = false;
    }

    public addTask(input: AgendaTaskInput): AgendaTask {
        const data = this.cloneGuildData(this.getGuildData(input.guildId));
        const task: AgendaTask = {
            id: randomUUID(),
            title: input.title.trim(),
            description: input.description?.trim() || undefined,
            dueAt: input.dueAt,
            createdAt: Date.now(),
            createdBy: input.createdBy
        };

        data.tasks.push(task);
        data.tasks.sort((a, b) => a.dueAt - b.dueAt);
        this.saveGuildData(input.guildId, data);
        return task;
    }

    public removeTask(guildId: Snowflake, taskId: string): AgendaTask | null {
        const data = this.cloneGuildData(this.getGuildData(guildId));
        const index = data.tasks.findIndex((task) => task.id === taskId);
        if (index === -1) {
            return null;
        }

        const [removed] = data.tasks.splice(index, 1);
        this.saveGuildData(guildId, data);
        return removed ?? null;
    }

    public markTaskDone(guildId: Snowflake, taskId: string, userId: Snowflake): AgendaTask | null {
        const data = this.cloneGuildData(this.getGuildData(guildId));
        const entry = data.tasks.find((task) => task.id === taskId);
        if (!entry) {
            return null;
        }

        if (entry.completedAt && entry.completedBy) {
            return entry;
        }

        entry.completedAt = Date.now();
        entry.completedBy = userId;
        this.saveGuildData(guildId, data);
        return entry;
    }

    public listTasks(guildId: Snowflake, options: AgendaListOptions = {}): AgendaTask[] {
        const data = this.getGuildData(guildId);
        const tasks = data.tasks.slice().sort((a, b) => a.dueAt - b.dueAt);
        if (options.includeCompleted) {
            return tasks;
        }
        return tasks.filter((task) => !task.completedAt);
    }

    public setDigestChannel(guildId: Snowflake, channelId: Snowflake | null): void {
        const data = this.cloneGuildData(this.getGuildData(guildId));
        data.channelId = channelId;
        this.saveGuildData(guildId, data);
    }

    public getDigestChannel(guildId: Snowflake): Snowflake | null {
        const data = this.getGuildData(guildId);
        return data.channelId ?? null;
    }

    public parseDueDate(rawValue: string): number | null {
        const trimmed = rawValue.trim();
        if (!trimmed) {
            return null;
        }

        const isoLike = trimmed.replace(' ', 'T');
        const date = new Date(isoLike);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        if (!isoLike.includes('T')) {
            date.setHours(23, 59, 0, 0);
        }

        return date.getTime();
    }

    public getTask(guildId: Snowflake, taskId: string): AgendaTask | null {
        const data = this.getGuildData(guildId);
        return data.tasks.find((task) => task.id === taskId) ?? null;
    }

    private scheduleNextDigest(): void {
        if (this.digestTimer) {
            clearTimeout(this.digestTimer);
        }

        const now = new Date();
        const next = new Date(now);
        next.setHours(DAILY_DIGEST_HOUR, DAILY_DIGEST_MINUTE, 0, 0);

        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }

        const delay = next.getTime() - now.getTime();

        this.digestTimer = setTimeout(() => {
            void this.runDailyDigest().finally(() => this.scheduleNextDigest());
        }, delay);
    }

    private async runDailyDigest(): Promise<void> {
        const now = new Date();
        for (const guild of this.client.guilds.cache.values()) {
            const data = this.getGuildData(guild.id as Snowflake);
            if (!data.channelId) {
                continue;
            }

            const channel = await guild.channels.fetch(data.channelId).catch(() => null);
            if (!channel || !channel.isTextBased()) {
                continue;
            }

            if (!guild.members.me?.permissionsIn(channel).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
                continue;
            }

            const tasks = this.listTasks(guild.id as Snowflake, { includeCompleted: true });
            const pending = tasks.filter((task) => !task.completedAt);
            const embed = this.buildDigestEmbed(pending, tasks.filter((task) => task.completedAt), now);

            await (channel as GuildTextBasedChannel).send({ embeds: [embed] }).catch(() => undefined);

            data.lastDigestAt = Date.now();
            this.saveGuildData(guild.id as Snowflake, data);
        }
    }

    private buildDigestEmbed(pending: AgendaTask[], completed: AgendaTask[], now: Date): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle(`Agenda du ${DIGEST_TITLE_FORMATTER.format(now)}`)
            .setDescription('Tâches triées par échéance. Mettez-les à jour avec /agenda.')
            .setTimestamp(now);

        if (pending.length === 0) {
            embed.addFields({
                name: 'Aucune tâche en attente',
                value: 'Profitez-en pour avancer sur vos projets personnels !'
            });
        } else {
            const limited = pending.slice(0, 25);
            for (const task of limited) {
                embed.addFields(this.formatTaskField(task));
            }

            if (pending.length > limited.length) {
                embed.addFields({
                    name: '... et plus encore',
                    value: `Encore ${pending.length - limited.length} tâche(s) en attente. Consultez /agenda list pour tout voir.`
                });
            }
        }

        if (completed.length) {
            const recent = completed
                .slice()
                .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
                .slice(0, 5);

            const lines = recent.map((task) => {
                const completedAt = task.completedAt ? time(Math.floor(task.completedAt / 1000), TimestampStyles.RelativeTime) : 'récemment';
                return `• **${task.title}** (${completedAt})`;
            });

            embed.addFields({
                name: 'Dernières tâches complétées',
                value: lines.join('\n')
            });
        }

        return embed;
    }

    public formatTaskField(task: AgendaTask): { name: string; value: string; inline?: boolean } {
        const due = time(Math.floor(task.dueAt / 1000), TimestampStyles.ShortDateTime);
        const relative = time(Math.floor(task.dueAt / 1000), TimestampStyles.RelativeTime);
        const lines = [
            `📅 ${due} (${relative})`,
            `👤 <@${task.createdBy}>`,
            `🆔 ${task.id}`
        ];

        if (task.description) {
            lines.splice(1, 0, `📝 ${task.description}`);
        }

        if (task.completedAt && task.completedBy) {
            const completedAt = time(Math.floor(task.completedAt / 1000), TimestampStyles.RelativeTime);
            lines.push(`✅ Terminé par <@${task.completedBy}> (${completedAt})`);
        }

        return {
            name: task.title,
            value: lines.join('\n')
        };
    }

    private getGuildData(guildId: Snowflake): AgendaGuildData {
        const existing = this.cache.get(guildId);
        if (existing) {
            return existing;
        }

        const raw = this.client.database.get(this.getGuildKey(guildId));
        const normalized = this.normalizeGuildData(raw);
        this.cache.set(guildId, normalized);
        return normalized;
    }

    private saveGuildData(guildId: Snowflake, data: AgendaGuildData): void {
        const clone: AgendaGuildData = {
            channelId: data.channelId ?? null,
            tasks: data.tasks.slice().sort((a, b) => a.dueAt - b.dueAt),
            lastDigestAt: data.lastDigestAt ?? null
        };

        this.cache.set(guildId, clone);
        this.client.database.set(this.getGuildKey(guildId), clone);
    }

    private normalizeGuildData(raw: unknown): AgendaGuildData {
        if (!raw || typeof raw !== 'object') {
            return { channelId: null, tasks: [], lastDigestAt: null };
        }

        const data = raw as Partial<AgendaGuildData>;
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];

        const sanitizedTasks = tasks
            .filter((task): task is AgendaTask => typeof task === 'object' && task !== null)
            .map((task) => ({
                id: typeof task.id === 'string' ? task.id : randomUUID(),
                title: typeof task.title === 'string' ? task.title : 'Tâche',
                description: task.description && typeof task.description === 'string' ? task.description : undefined,
                dueAt: typeof task.dueAt === 'number' ? task.dueAt : Date.now(),
                createdAt: typeof task.createdAt === 'number' ? task.createdAt : Date.now(),
                createdBy: typeof task.createdBy === 'string' ? task.createdBy as Snowflake : '0' as Snowflake,
                completedAt: typeof task.completedAt === 'number' ? task.completedAt : undefined,
                completedBy: typeof task.completedBy === 'string' ? task.completedBy as Snowflake : undefined
            }))
            .sort((a, b) => a.dueAt - b.dueAt);

        return {
            channelId: data.channelId ?? null,
            tasks: sanitizedTasks,
            lastDigestAt: typeof data.lastDigestAt === 'number' ? data.lastDigestAt : null
        };
    }

    private cloneGuildData(data: AgendaGuildData): AgendaGuildData {
        return {
            channelId: data.channelId ?? null,
            lastDigestAt: data.lastDigestAt ?? null,
            tasks: data.tasks.map((task) => ({ ...task }))
        };
    }

    private getGuildKey(guildId: Snowflake): string {
        return `agenda_${guildId}`;
    }
}
