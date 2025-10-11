import { Colors, EmbedBuilder, TimestampStyles, time } from 'discord.js';
import { randomUUID } from 'node:crypto';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ReminderScheduler } from './ReminderScheduler.js';
import { ReminderStore } from './ReminderStore.js';
import type {
    CreateReminderInput,
    ReminderFilters,
    ReminderRecord,
    ReminderRecurrence,
    ReminderStatus
} from '../../types/reminders.js';

const MAX_ACTIVE_PER_USER = Number.isFinite(Number.parseInt(process.env.REMINDERS_MAX_PER_USER || '', 10))
    ? Math.max(1, Number.parseInt(process.env.REMINDERS_MAX_PER_USER || '', 10))
    : 25;

export class ReminderService {
    private readonly store: ReminderStore;
    private readonly scheduler: ReminderScheduler;
    private ready = false;

    constructor(private readonly client: DiscordBot) {
        this.store = new ReminderStore(client);
        this.scheduler = new ReminderScheduler(async (record) => this.executeReminder(record));
    }

    public start(): void {
        if (this.ready) return;
        this.ready = true;

        for (const record of this.store.listAll()) {
            if (record.status === 'active') {
                this.scheduler.schedule(record);
            }
        }
    }

    public stop(): void {
        this.scheduler.cancelAll();
        this.ready = false;
    }

    public reload(): void {
        this.store.reload();
        this.stop();
        this.start();
    }

    public getActiveCountForUser(userId: string, guildId: string | null): number {
        return this.store
            .listByUser(userId)
            .filter((record) => record.status === 'active' && (guildId === null || record.guildId === guildId))
            .length;
    }

    public canCreateReminder(userId: string, guildId: string | null): boolean {
        return this.getActiveCountForUser(userId, guildId) < MAX_ACTIVE_PER_USER;
    }

    public createReminder(input: CreateReminderInput): ReminderRecord {
        const record: ReminderRecord = {
            id: randomUUID(),
            guildId: input.guildId,
            channelId: input.channelId,
            userId: input.userId,
            message: input.message,
            remindAt: input.remindAt,
            isPrivate: input.isPrivate,
            recurrence: input.recurrence,
            originalDelayMs: input.originalDelayMs,
            createdAt: Date.now(),
            status: 'active'
        };

        this.store.upsert(record);
        this.scheduler.schedule(record);
        return record;
    }

    public getReminder(id: string): ReminderRecord | undefined {
        return this.store.get(id);
    }

    public listUserReminders(userId: string, filters: ReminderFilters = {}): ReminderRecord[] {
        return this.store
            .listByUser(userId)
            .filter((record) => {
                if (filters.status && record.status !== filters.status) {
                    return false;
                }
                if (typeof filters.guildId !== 'undefined') {
                    return record.guildId === filters.guildId;
                }
                return true;
            })
            .sort((a, b) => a.remindAt - b.remindAt);
    }

    public cancelReminder(id: string): ReminderRecord | null {
        const record = this.store.get(id);
        if (!record || record.status !== 'active') return null;

        this.scheduler.clear(id);
        this.store.updateStatus(id, 'cancelled');
        return this.store.get(id) ?? null;
    }

    public cancelAllForUser(userId: string, guildId?: string | null): number {
        const reminders = this.store.listByUser(userId);
        let cancelled = 0;
        for (const record of reminders) {
            if (record.status !== 'active') continue;
            if (typeof guildId !== 'undefined' && record.guildId !== guildId) continue;
            this.cancelReminder(record.id);
            cancelled++;
        }
        return cancelled;
    }

    private async executeReminder(record: ReminderRecord): Promise<'completed' | 'reschedule'> {
        const latest = this.store.get(record.id);
        if (!latest || latest.status !== 'active') {
            return 'completed';
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Orange)
            .setTitle('⏰ Rappel')
            .setDescription(latest.message)
            .addFields(
                {
                    name: 'Créé le',
                    value: time(Math.floor(latest.createdAt / 1000), TimestampStyles.LongDateTime),
                    inline: true
                },
                {
                    name: 'Programmé pour',
                    value: time(Math.floor(latest.remindAt / 1000), TimestampStyles.LongDateTime),
                    inline: true
                }
            )
            .setFooter({ text: `ID du rappel : ${latest.id}` })
            .setTimestamp(new Date());

        const sent = await this.deliverReminder(latest, embed);

        if (!sent) {
            return 'reschedule';
        }

        const nextDelay = this.scheduler.getNextDelay(latest.recurrence, latest.remindAt);
        if (nextDelay) {
            const updated: ReminderRecord = {
                ...latest,
                remindAt: latest.remindAt + nextDelay
            };
            this.store.upsert(updated);
            return 'reschedule';
        }

        this.store.updateStatus(latest.id, 'completed');
        return 'completed';
    }

    private async deliverReminder(record: ReminderRecord, embed: EmbedBuilder): Promise<boolean> {
        try {
            if (record.isPrivate || !record.channelId) {
                const user = await this.client.users.fetch(record.userId);
                await user.send({ embeds: [embed] });
                return true;
            }

            const guild = record.guildId ? await this.client.guilds.fetch(record.guildId).catch(() => null) : null;
            const channel = guild ? await guild.channels.fetch(record.channelId).catch(() => null) : null;

            if (!channel || !channel.isTextBased()) {
                const user = await this.client.users.fetch(record.userId);
                await user.send({ content: 'Je n’ai pas pu accéder au salon initial, voici votre rappel :', embeds: [embed] });
                return true;
            }

            await channel.send({ content: `<@${record.userId}>`, embeds: [embed] });
            return true;
        } catch (error) {
            console.error(`❌ Échec de l’envoi du rappel ${record.id}:`, error);
            return false;
        }
    }

    public markCompleted(id: string): ReminderRecord | null {
        const record = this.store.get(id);
        if (!record) return null;
        this.scheduler.clear(id);
        this.store.updateStatus(id, 'completed');
        return this.store.get(id) ?? null;
    }

    public getStatusCounts(userId: string): Record<ReminderStatus, number> {
        const base: Record<ReminderStatus, number> = { active: 0, completed: 0, cancelled: 0 };
        for (const record of this.store.listByUser(userId)) {
            base[record.status] += 1;
        }
        return base;
    }
}
