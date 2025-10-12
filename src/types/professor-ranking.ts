import type { Snowflake } from 'discord.js';

export type VoteWeight = 3 | 2 | 1;

export interface ProfessorProfile {
    id: string;
    name: string;
    bio?: string;
    quote?: string;
    emoji?: string;
    addedBy: Snowflake;
    addedAt: number;
    active: boolean;
    stats: {
        totalPoints: number;
        monthly: Record<string, number>;
        annual: Record<string, number>;
        weeklyBest?: string;
    };
}

export interface VoteRecord {
    picks: string[];
    weights: VoteWeight[];
    timestamp: number;
}

export interface WeeklyTotals {
    weekKey: string;
    totals: Record<string, number>;
    votes: Record<Snowflake, VoteRecord>;
    voters: Record<Snowflake, number>;
    lastArchiveAt?: number;
}

export interface WeeklyArchiveEntry {
    weekKey: string;
    totals: Record<string, number>;
    rankings: Array<{ professorId: string; points: number; rank: number }>;
    archivedAt: number;
}

export interface ProfessorRankingData {
    professors: Record<string, ProfessorProfile>;
    archiveChannelId?: Snowflake;
    panel?: {
        channelId: Snowflake;
        messageId: Snowflake;
    };
    weekly: WeeklyTotals;
    history: {
        weekly: Record<string, WeeklyArchiveEntry>;
    };
    voterStats: Record<Snowflake, {
        totalVotes: number;
        lastVoteAt: number;
    }>;
    lastSeenWeek?: string;
    lastSeenMonth?: string;
    lastSeenYear?: string;
}

export interface ArchiveResult {
    weekKey: string;
    leaderboard: WeeklyArchiveEntry['rankings'];
    totals: Record<string, number>;
}
