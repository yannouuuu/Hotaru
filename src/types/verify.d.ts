/**
 * Types et interfaces pour le système de vérification par email
 */

/**
 * Code de vérification temporaire
 */
export interface VerificationCode {
    code: string;
    userId: string;
    email: string;
    guildId: string;
    createdAt: number;
    expiresAt: number;
    attempts: number;
}

/**
 * Utilisateur vérifié enregistré en base de données
 */
export interface VerifiedUser {
    userId: string;
    guildId: string;
    email: string;
    verifiedAt: number;
    verifiedBy: 'email' | 'manual';
    verifierUserId?: string; // ID de l'admin qui a vérifié manuellement
}

/**
 * Tentative de vérification (anti-spam)
 */
export interface VerificationAttempt {
    userId: string;
    email: string;
    timestamp: number;
    success: boolean;
    type: 'request' | 'validation';
}

/**
 * Log de vérification pour les admins
 */
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

/**
 * Configuration des domaines d'email autorisés
 */
export interface EmailDomainConfig {
    domain: string;
    description: string;
    enabled: boolean;
}

/**
 * Statistiques de vérification
 */
export interface VerificationStats {
    totalVerified: number;
    verifiedToday: number;
    verifiedThisWeek: number;
    totalAttempts: number;
    successRate: number;
    topDomains: { domain: string; count: number }[];
}

/**
 * Configuration du système de vérification
 */
export interface VerificationConfig {
    enabled: boolean;
    codeLength: number;
    codeExpiration: number; // en millisecondes (15 minutes par défaut)
    maxAttemptsPerDay: number;
    cooldownBetweenAttempts: number; // en millisecondes (5 minutes par défaut)
    maxValidationAttempts: number; // Nombre de tentatives de validation du code
    allowedDomains: EmailDomainConfig[];
    requireUniqueEmail: boolean; // Un email = un compte Discord
    verifiedRoleId?: string; // OPTIONNEL - ID du rôle "✅ Vérifié" (sinon utilisé depuis setup)
    studentRoleId?: string; // OPTIONNEL - ID du rôle "Étudiant" (sinon utilisé depuis setup)
    logChannelId?: string; // Channel pour les logs de vérification
    welcomeChannelId?: string; // Channel pour le message de bienvenue
}

/**
 * Résultat d'une opération de vérification
 */
export interface VerificationResult {
    success: boolean;
    message: string;
    code?: string;
    error?: VerificationError;
    data?: any;
}

/**
 * Types d'erreurs de vérification
 */
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

/**
 * Options pour la commande /manage-verified
 */
export type ManageVerifiedAction = 'list' | 'remove' | 'manual-verify' | 'stats' | 'search';

/**
 * Données stockées en base de données
 */
export interface VerificationDatabase {
    verifiedUsers: Record<string, VerifiedUser>; // userId -> VerifiedUser
    pendingCodes: Record<string, VerificationCode>; // code -> VerificationCode
    attempts: Record<string, VerificationAttempt[]>; // userId -> attempts
    logs: VerificationLog[];
}
