import type { Snowflake } from 'discord.js';

export type ReminderStatus = 'active' | 'completed' | 'cancelled';

export type ReminderRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface ReminderRecord {
    id: string;
    guildId: Snowflake | null;
    channelId: Snowflake | null;
    userId: Snowflake;
    message: string;
    remindAt: number;
    isPrivate: boolean;
    recurrence: ReminderRecurrence;
    originalDelayMs: number;
    createdAt: number;
    status: ReminderStatus;
}

export interface ReminderStoreData {
    reminders: Record<string, ReminderRecord>;
    version: number;
}

export interface CreateReminderInput {
    guildId: Snowflake | null;
    channelId: Snowflake | null;
    userId: Snowflake;
    message: string;
    remindAt: number;
    isPrivate: boolean;
    recurrence: ReminderRecurrence;
    originalDelayMs: number;
}

export interface ReminderFilters {
    status?: ReminderStatus;
    guildId?: Snowflake | null;
}
