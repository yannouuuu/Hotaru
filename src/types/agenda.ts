import type { Snowflake } from 'discord.js';

export interface AgendaTask {
    id: string;
    title: string;
    description?: string;
    dueAt: number;
    createdAt: number;
    createdBy: Snowflake;
    completedAt?: number;
    completedBy?: Snowflake;
}

export interface AgendaGuildData {
    channelId?: Snowflake | null;
    tasks: AgendaTask[];
    lastDigestAt?: number | null;
}

export interface AgendaListOptions {
    includeCompleted?: boolean;
}

export interface AgendaTaskInput {
    guildId: Snowflake;
    title: string;
    description?: string;
    dueAt: number;
    createdBy: Snowflake;
}
