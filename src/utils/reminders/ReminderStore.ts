import type { DiscordBot } from '../../client/DiscordBot.js';
import type { ReminderRecord, ReminderStoreData, ReminderStatus } from '../../types/reminders.js';

const DATABASE_KEY = 'reminders';
const STORE_VERSION = 1;

export class ReminderStore {
    private cache: Map<string, ReminderRecord> = new Map();

    constructor(private readonly client: DiscordBot) {
        this.load();
    }

    private load(): void {
        const raw = this.client.database.get(DATABASE_KEY) as ReminderStoreData | undefined;
        if (!raw?.reminders) {
            this.persist();
            return;
        }

        this.cache = new Map(Object.entries(raw.reminders));
    }

    public reload(): void {
        this.load();
    }

    private persist(): void {
        const data: ReminderStoreData = {
            version: STORE_VERSION,
            reminders: Object.fromEntries(this.cache)
        };
        this.client.database.set(DATABASE_KEY, data);
    }

    public listAll(): ReminderRecord[] {
        return Array.from(this.cache.values());
    }

    public listByUser(userId: string): ReminderRecord[] {
        return this.listAll().filter((record) => record.userId === userId);
    }

    public get(id: string): ReminderRecord | undefined {
        return this.cache.get(id);
    }

    public upsert(record: ReminderRecord): ReminderRecord {
        this.cache.set(record.id, record);
        this.persist();
        return record;
    }

    public updateStatus(id: string, status: ReminderStatus): ReminderRecord | undefined {
        const existing = this.cache.get(id);
        if (!existing) return undefined;
        existing.status = status;
        this.persist();
        return existing;
    }

    public delete(id: string): void {
        if (this.cache.delete(id)) {
            this.persist();
        }
    }
}
