export interface VerificationCode {
    code: string;
    userId: string;
    email: string;
    guildId: string;
    createdAt: number;
    expiresAt: number;
    attempts: number;
}
export interface VerifiedUser {
    userId: string;
    guildId: string;
    email: string;
    verifiedAt: number;
    verifiedBy: 'email' | 'manual';
    verifierUserId?: string;
}
export interface VerificationAttempt {
    userId: string;
    email: string;
    timestamp: number;
    success: boolean;
    type: 'request' | 'validation';
}
export interface VerificationLog {
    id: string;
    userId: string;
    username: string;
    email: string;
    action: 'request' | 'validated' | 'failed' | 'manual' | 'removed';
    timestamp: number;
    details?: string;
    adminId?: string;
}
export interface EmailDomainConfig {
    domain: string;
    description: string;
    enabled: boolean;
}
export interface VerificationStats {
    totalVerified: number;
    verifiedToday: number;
    verifiedThisWeek: number;
    totalAttempts: number;
    successRate: number;
    topDomains: { domain: string; count: number }[];
}
export interface VerificationConfig {
    enabled: boolean;
    codeLength: number;
    codeExpiration: number;
    maxAttemptsPerDay: number;
    cooldownBetweenAttempts: number;
    maxValidationAttempts: number;
    allowedDomains: EmailDomainConfig[];
    requireUniqueEmail: boolean;
    verifiedRoleId?: string;
    studentRoleId?: string;
    logChannelId?: string;
    welcomeChannelId?: string;
}
export interface VerificationResult {
    success: boolean;
    message: string;
    code?: string;
    error?: VerificationError;
    data?: unknown;
}
export type VerificationError =
    | 'ALREADY_VERIFIED'
    | 'INVALID_EMAIL_FORMAT'
    | 'DOMAIN_NOT_ALLOWED'
    | 'CODE_EXPIRED'
    | 'CODE_NOT_FOUND'
    | 'CODE_INVALID'
    | 'MAX_ATTEMPTS_REACHED'
    | 'COOLDOWN_ACTIVE'
    | 'EMAIL_ALREADY_USED'
    | 'EMAIL_SEND_FAILED'
    | 'DATABASE_ERROR'
    | 'RATE_LIMITED';
export type ManageVerifiedAction = 'list' | 'remove' | 'manual-verify' | 'stats' | 'search';
export interface VerificationDatabase {
    verifiedUsers: Record<string, VerifiedUser>;
    pendingCodes: Record<string, VerificationCode>;
    attempts: Record<string, VerificationAttempt[]>;
    logs: VerificationLog[];
}
