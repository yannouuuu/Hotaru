import ical, { type VEvent } from 'node-ical';
import { Collection, ChannelType, Guild, type Snowflake, type TextBasedChannel } from 'discord.js';
import type { DiscordBot } from '../client/DiscordBot.js';

export type TimetableMode = 'presence' | 'channel_name' | 'message' | 'event';

export interface TimetableConfig {
    url: string;
    mode: TimetableMode;
    channelId?: Snowflake;
    messageId?: Snowflake;
    eventId?: Snowflake;
    updateIntervalMinutes?: number;
    timezone?: string;
    lookaheadHours?: number;
}

export interface TimetableStatus {
    guildId: Snowflake;
    enabled: boolean;
    mode: TimetableMode | null;
    url?: string;
    lastSyncAt?: number | null;
    lastError?: string;
    currentLabel?: string;
}

type IntervalHandle = ReturnType<typeof setInterval>;

interface CachedEvent {
    start: Date;
    end: Date;
    summary: string;
    location?: string;
    description?: string;
}

interface GuildState {
    timer: IntervalHandle | null;
    lastLabel: string | null;
    lastSyncAt: number | null;
    lastError: string | null;
    lastCurrentKey: string | null;
    mode: TimetableMode;
}

const DEFAULT_INTERVAL_MINUTES = 5;
const MIN_INTERVAL_MINUTES = 1;
const MAX_INTERVAL_MINUTES = 60;
const DEFAULT_LOOKAHEAD_HOURS = 12;

const formatTime = (date: Date, locale = 'fr-FR'): string =>
    new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);

const clampInterval = (minutes?: number): number => {
    if (!minutes || !Number.isFinite(minutes)) {
        return DEFAULT_INTERVAL_MINUTES;
    }
    return Math.min(Math.max(minutes, MIN_INTERVAL_MINUTES), MAX_INTERVAL_MINUTES);
};

const clampLookaheadHours = (hours?: number): number => {
    if (!hours || !Number.isFinite(hours)) {
        return DEFAULT_LOOKAHEAD_HOURS;
    }
    return Math.min(Math.max(hours, 1), 168);
};

export class ScheduleManager {
    private readonly states = new Collection<Snowflake, GuildState>();

    constructor(private readonly client: DiscordBot) {}

    public start(): void {
        for (const guild of this.client.guilds.cache.values()) {
            void this.startForGuild(guild.id as Snowflake);
        }
    }

    public stop(): void {
        for (const [guildId] of this.states) {
            this.stopForGuild(guildId);
        }
    }

    public reload(guildId?: Snowflake): void {
        if (guildId) {
            this.stopForGuild(guildId);
            void this.startForGuild(guildId);
            return;
        }

        this.stop();
        this.start();
    }

    public getConfig(guildId: Snowflake): TimetableConfig | null {
        const raw = this.client.database.get(`schedule_${guildId}`);
        if (!raw || typeof raw !== 'object') {
            return null;
        }

        const config = raw as TimetableConfig;
        if (!config.url || !config.mode) {
            return null;
        }

        return config;
    }

    public setConfig(guildId: Snowflake, config: TimetableConfig): void {
        this.client.database.set(`schedule_${guildId}`, config);
        this.reload(guildId);
    }

    public deleteConfig(guildId: Snowflake): void {
        this.client.database.delete(`schedule_${guildId}`);
        this.stopForGuild(guildId);
    }

    public getStatus(guildId: Snowflake): TimetableStatus {
        const config = this.getConfig(guildId);
        const state = this.states.get(guildId);

        return {
            guildId,
            enabled: Boolean(config),
            mode: config?.mode ?? null,
            url: config?.url,
            lastSyncAt: state?.lastSyncAt ?? null,
            lastError: state?.lastError ?? undefined,
            currentLabel: state?.lastLabel ?? undefined
        };
    }

    private stopForGuild(guildId: Snowflake): void {
        const state = this.states.get(guildId);
        if (state?.timer) {
            clearInterval(state.timer);
        }
        this.states.delete(guildId);
    }

    public async startForGuild(guildId: Snowflake): Promise<void> {
        const config = this.getConfig(guildId);
        if (!config) {
            this.stopForGuild(guildId);
            return;
        }

        const intervalMinutes = clampInterval(config.updateIntervalMinutes);
        const intervalMs = intervalMinutes * 60_000;

        const state: GuildState = {
            timer: null,
            lastLabel: null,
            lastSyncAt: null,
            lastError: null,
            lastCurrentKey: null,
            mode: config.mode
        };

        const runSync = async () => {
            try {
                const events = await this.fetchEvents(config);
                const label = this.computeLabel(events);
                const currentKey = events.current
                    ? `${events.current.start.toISOString()}_${events.current.end.toISOString()}_${events.current.summary}`
                    : null;

                if (state.lastLabel === label && state.lastCurrentKey === currentKey) {
                    state.lastSyncAt = Date.now();
                    state.lastError = null;
                    return;
                }

                await this.applyLabel(guildId, config, label, events.current ?? null);

                state.lastLabel = label;
                state.lastCurrentKey = currentKey;
                state.lastSyncAt = Date.now();
                state.lastError = null;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                state.lastError = message;
                console.error(`❌ [ScheduleManager] Failed to sync guild ${guildId}:`, error);
            }
        };

        await runSync();

        state.timer = setInterval(() => {
            void runSync();
        }, intervalMs);

        this.states.set(guildId, state);
    }

    private async fetchEvents(config: TimetableConfig): Promise<{ events: CachedEvent[]; current: CachedEvent | null; next: CachedEvent | null; }> {
        const rawResult = await ical.async.fromURL(config.url, {
            headers: {
                'User-Agent': 'HotaruBot/1.0 (+https://github.com)'
            }
        }) as unknown;

        const result = rawResult && typeof rawResult === 'object'
            ? rawResult as Record<string, unknown>
            : {};

        const events: CachedEvent[] = [];

        for (const item of Object.values(result)) {
            if (!this.isVEvent(item)) continue;
            const event = item;
            const start = event.start instanceof Date ? event.start : new Date(event.start as string);
            const end = event.end instanceof Date ? event.end : new Date(event.end as string);
            if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

            events.push({
                start,
                end,
                summary: event.summary ?? 'Cours',
                location: event.location ?? undefined,
                description: event.description ?? undefined
            });
        }

        events.sort((a, b) => a.start.getTime() - b.start.getTime());

        const now = new Date();
        const current = events.find((event) => event.start <= now && event.end > now) ?? null;

        const lookaheadHours = clampLookaheadHours(config.lookaheadHours);
        const horizon = now.getTime() + lookaheadHours * 3_600_000;
        const next = events.find((event) => event.start > now && event.start.getTime() <= horizon) ?? null;

        return { events, current, next };
    }

    public hasPresenceMode(): boolean {
        for (const state of this.states.values()) {
            if (state.mode === 'presence') {
                return true;
            }
        }
        return false;
    }

    private computeLabel(data: { events: CachedEvent[]; current: CachedEvent | null; next: CachedEvent | null; }): string {
        const { current, next } = data;
        if (current) {
            const endTime = formatTime(current.end);
            return `En cours: ${current.summary} (fin ${endTime})`;
        }

        if (next) {
            const startTime = formatTime(next.start);
            return `Prochain cours: ${next.summary} (${startTime})`;
        }

        return 'Aucun cours prévu';
    }

    private async applyLabel(guildId: Snowflake, config: TimetableConfig, label: string, currentEvent: CachedEvent | null): Promise<void> {
        const guild = await this.client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            throw new Error('Impossible de récupérer la guilde');
        }

        switch (config.mode) {
            case 'presence':
                await this.updatePresence(label, currentEvent);
                break;
            case 'channel_name':
                if (!config.channelId) throw new Error('Aucun salon défini pour la mise à jour du nom');
                await this.updateChannelName(guild, config.channelId, label);
                break;
            case 'message':
                if (!config.channelId || !config.messageId) throw new Error('Le salon et le message doivent être configurés');
                await this.updateMessage(guild, config.channelId, config.messageId, label, currentEvent);
                break;
            case 'event':
                if (!config.eventId) throw new Error('Aucun événement Discord configuré');
                await this.updateScheduledEvent(guild, config.eventId, label, currentEvent);
                break;
            default:
                break;
        }
    }

    private async updatePresence(label: string, currentEvent: CachedEvent | null): Promise<void> {
        if (!this.client.user) return;

        const status = currentEvent ? `fin ${formatTime(currentEvent.end)}` : 'Aucun cours';
        await this.client.user.setPresence({
            activities: [
                {
                    name: label,
                    type: 4,
                    state: status
                }
            ]
        });
    }

    private async updateChannelName(guild: Guild, channelId: Snowflake, label: string): Promise<void> {
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildVoice)) {
            throw new Error('Le salon cible est introuvable ou de type incompatible');
        }

        const trimmed = label.slice(0, 90);
        await channel.setName(trimmed);
    }

    private async updateMessage(guild: Guild, channelId: Snowflake, messageId: Snowflake, label: string, currentEvent: CachedEvent | null): Promise<void> {
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
            throw new Error('Le salon cible est introuvable ou non textuel');
        }

        const content = currentEvent
            ? `📚 **${currentEvent.summary}**
🕒 Jusqu’à ${formatTime(currentEvent.end)}
📍 ${currentEvent.location ?? 'Lieu non renseigné'}`
            : label;

        const message = await (channel as TextBasedChannel).messages.fetch(messageId).catch(() => null);
        if (!message) {
            throw new Error('Message introuvable pour la mise à jour');
        }

        await message.edit({ content });
    }

    private async updateScheduledEvent(guild: Guild, eventId: Snowflake, label: string, currentEvent: CachedEvent | null): Promise<void> {
        const event = await guild.scheduledEvents.fetch(eventId).catch(() => null);
        if (!event) {
            throw new Error('Événement Discord introuvable');
        }

        if (!currentEvent) {
            await event.edit({
                name: 'Aucun cours',
                description: 'Aucun événement n’est planifié actuellement.'
            });
            return;
        }

        await event.edit({
            name: currentEvent.summary.slice(0, 100),
            scheduledStartTime: currentEvent.start,
            scheduledEndTime: currentEvent.end,
            description: `${label}\n\n${currentEvent.location ? `📍 ${currentEvent.location}` : ''}`.trim()
        });
    }

    private isVEvent(entry: unknown): entry is VEvent {
        if (!entry || typeof entry !== 'object') {
            return false;
        }

        return (entry as { type?: string }).type === 'VEVENT';
    }
}
