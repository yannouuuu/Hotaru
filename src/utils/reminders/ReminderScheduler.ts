import type { ReminderRecord, ReminderRecurrence } from '../../types/reminders.js';

const MAX_TIMEOUT = 2_147_483_647; // ~24.8 days
const ONE_DAY_MS = 86_400_000;
const RECURRENCE_OFFSETS: Record<ReminderRecurrence, number | ((from: number) => number)> = {
    none: 0,
    daily: ONE_DAY_MS,
    weekly: 7 * ONE_DAY_MS,
    monthly: (from: number) => {
        const now = new Date(from);
        const next = new Date(from);
        next.setMonth(now.getMonth() + 1);
        return next.getTime() - now.getTime();
    }
};

export type ReminderExecutor = (record: ReminderRecord) => Promise<'completed' | 'reschedule'>;

export class ReminderScheduler {
    private timeouts = new Map<string, NodeJS.Timeout>();

    constructor(private readonly executor: ReminderExecutor) {}

    public schedule(record: ReminderRecord): void {
        this.clear(record.id);

        const now = Date.now();
        const delay = Math.max(0, record.remindAt - now);

        if (delay > MAX_TIMEOUT) {
            const timeout = setTimeout(() => this.schedule(record), ONE_DAY_MS);
            this.timeouts.set(record.id, timeout);
            return;
        }

        const timeout = setTimeout(async () => {
            const result = await this.executor(record).catch(() => 'completed');
            if (result === 'reschedule') {
                this.schedule(record);
            } else {
                this.clear(record.id);
            }
        }, delay);

        this.timeouts.set(record.id, timeout);
    }

    public clear(id: string): void {
        const timeout = this.timeouts.get(id);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(id);
        }
    }

    public cancelAll(): void {
        for (const timeout of this.timeouts.values()) {
            clearTimeout(timeout);
        }
        this.timeouts.clear();
    }

    public getNextDelay(recurrence: ReminderRecurrence, from: number): number | null {
        if (recurrence === 'none') return null;
        const offset = RECURRENCE_OFFSETS[recurrence];
        return typeof offset === 'function' ? offset(from) : offset;
    }
}
