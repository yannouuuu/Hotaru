import type { Snowflake } from 'discord.js';

export interface JobsSearchOptions {
    keywords?: string[];
    departments?: string[];
    contractTypes?: string[];
    experienceLevels?: string[];
    communes?: string[];
    radiusKm?: number;
    includeAlternance?: boolean;
    limit?: number;
    minPublishedHours?: number;
}

export type FranceTravailSearchOptions = Omit<JobsSearchOptions, 'communes'> & {
    commune?: string;
};

export interface JobsRefreshResult {
    guildId: Snowflake;
    fetched: number;
    published: number;
    skipped: number;
    channelId?: Snowflake;
    error?: string;
    notice?: string;
}

export interface JobsManagerStatus {
    guildId: Snowflake;
    isConfigured: boolean;
    hasCredentials: boolean;
    channelId?: Snowflake;
    lastFetchAt: number | null;
    lastPublishAt: number | null;
    knownOffers: number;
    lastError?: string;
    updateIntervalMs: number;
    searchOptions: JobsSearchOptions;
}
