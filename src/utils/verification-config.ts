import type { VerificationConfig, EmailDomainConfig } from '../types/verify.js';

type DatabaseLike = {
    get: (key: string) => unknown;
};

type SetupVerificationData = {
    roles?: {
        verifie?: string;
        etudiant?: string;
    };
    channels?: {
        verification?: string;
    };
    promo?: {
        mode?: boolean;
    };
};

const DEFAULT_ALLOWED_DOMAINS: EmailDomainConfig[] = [
    { domain: 'univ-lille.fr', description: 'Université de Lille', enabled: true },
    { domain: 'etu.univ-lille.fr', description: 'Étudiants Université de Lille', enabled: true }
];

const DEFAULT_VERIFICATION_CONFIG: VerificationConfig = {
    enabled: true,
    codeLength: 8,
    codeExpiration: 900000,
    maxAttemptsPerDay: 3,
    cooldownBetweenAttempts: 300000,
    maxValidationAttempts: 3,
    allowedDomains: DEFAULT_ALLOWED_DOMAINS,
    requireUniqueEmail: true
};

const asStringOrUndefined = (value: unknown): string | undefined => {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const asBoolean = (value: unknown, fallback: boolean): boolean => {
    return typeof value === 'boolean' ? value : fallback;
};

const asPositiveNumber = (value: unknown, fallback: number): number => {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
};

const normalizeAllowedDomains = (value: unknown): EmailDomainConfig[] => {
    if (!Array.isArray(value)) return DEFAULT_ALLOWED_DOMAINS;

    const domains = value
        .filter((item): item is EmailDomainConfig => {
            if (!item || typeof item !== 'object') return false;

            const domain = (item as { domain?: unknown }).domain;
            const description = (item as { description?: unknown }).description;
            const enabled = (item as { enabled?: unknown }).enabled;

            return (
                typeof domain === 'string' &&
                domain.length > 0 &&
                typeof description === 'string' &&
                description.length > 0 &&
                typeof enabled === 'boolean'
            );
        });

    return domains.length > 0 ? domains : DEFAULT_ALLOWED_DOMAINS;
};

export interface VerificationSetupLookup {
    setupKey: string;
    setupData: SetupVerificationData | null;
    exists: boolean;
    hasVerifiedRole: boolean;
    hasVerificationChannel: boolean;
}

export const readVerificationSetup = (database: DatabaseLike, guildId: string): VerificationSetupLookup => {
    const setupKey = `setup_${guildId}`;
    const setupData = database.get(setupKey) as SetupVerificationData | undefined;

    return {
        setupKey,
        setupData: setupData || null,
        exists: !!setupData,
        hasVerifiedRole: !!setupData?.roles?.verifie,
        hasVerificationChannel: !!setupData?.channels?.verification
    };
};

export const buildVerificationConfig = (
    database: DatabaseLike,
    setupData: SetupVerificationData | null
): VerificationConfig => {
    const rawConfig = (database.get('verification_config') || {}) as Partial<VerificationConfig>;

    return {
        enabled: asBoolean(rawConfig.enabled, DEFAULT_VERIFICATION_CONFIG.enabled),
        codeLength: asPositiveNumber(rawConfig.codeLength, DEFAULT_VERIFICATION_CONFIG.codeLength),
        codeExpiration: asPositiveNumber(rawConfig.codeExpiration, DEFAULT_VERIFICATION_CONFIG.codeExpiration),
        maxAttemptsPerDay: asPositiveNumber(rawConfig.maxAttemptsPerDay, DEFAULT_VERIFICATION_CONFIG.maxAttemptsPerDay),
        cooldownBetweenAttempts: asPositiveNumber(
            rawConfig.cooldownBetweenAttempts,
            DEFAULT_VERIFICATION_CONFIG.cooldownBetweenAttempts
        ),
        maxValidationAttempts: asPositiveNumber(
            rawConfig.maxValidationAttempts,
            DEFAULT_VERIFICATION_CONFIG.maxValidationAttempts
        ),
        allowedDomains: normalizeAllowedDomains(rawConfig.allowedDomains),
        requireUniqueEmail: asBoolean(rawConfig.requireUniqueEmail, DEFAULT_VERIFICATION_CONFIG.requireUniqueEmail),
        verifiedRoleId: setupData?.roles?.verifie || asStringOrUndefined(rawConfig.verifiedRoleId),
        studentRoleId: setupData?.roles?.etudiant || asStringOrUndefined(rawConfig.studentRoleId),
        logChannelId: asStringOrUndefined(rawConfig.logChannelId),
        welcomeChannelId: asStringOrUndefined(rawConfig.welcomeChannelId)
    };
};
