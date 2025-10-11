// Global type definitions for the Discord bot project

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            CLIENT_TOKEN: string;
            OWNER_ID?: string;
            DEVELOPER_IDS?: string;
            BOT_PREFIX?: string;
            DEV_GUILD_ID?: string;
            NODE_ENV?: 'development' | 'production';
            SMTP_HOST?: string;
            SMTP_PORT?: string;
            SMTP_SECURE?: string;
            SMTP_USER?: string;
            SMTP_PASS?: string;
            EMAIL_FROM?: string;
            FRANCE_TRAVAIL_CLIENT_ID?: string;
            FRANCE_TRAVAIL_CLIENT_SECRET?: string;
            FRANCE_TRAVAIL_SCOPE?: string;
            FRANCE_TRAVAIL_KEYWORDS?: string;
            FRANCE_TRAVAIL_DEPARTMENTS?: string;
            FRANCE_TRAVAIL_CONTRACTS?: string;
            FRANCE_TRAVAIL_EXPERIENCE?: string;
            FRANCE_TRAVAIL_LIMIT?: string;
            FRANCE_TRAVAIL_UPDATE_INTERVAL?: string;
            FRANCE_TRAVAIL_MIN_HOURS?: string;
        }
    }
}

export {};
