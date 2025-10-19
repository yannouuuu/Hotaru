// @ts-expect-error quick-yaml.db publishes incomplete type definitions
import type { QuickYAML } from 'quick-yaml.db';
import type { GuildMember } from 'discord.js';
import type {
    VerificationCode,
    VerifiedUser,
    VerificationAttempt,
    VerificationLog,
    VerificationResult,
    VerificationConfig
} from '../types/verify.js';
import { emailService } from './EmailService.js';

/**
 * Gestionnaire du système de vérification par email
 */
export class VerificationManager {
    private database: QuickYAML;
    private config: VerificationConfig;

    constructor(database: QuickYAML, config: VerificationConfig) {
        this.database = database;
        this.config = config;
    }

    /**
     * Récupérer les IDs des rôles depuis le setup du serveur
     */
    private getRoleIds(guildId: string): { verifiedRoleId?: string; studentRoleId?: string } {
        const setupData = this.database.get(`setup_${guildId}`);
        
        if (!setupData || !setupData.roles) {
            return {};
        }

        return {
            verifiedRoleId: setupData.roles.verifie || this.config.verifiedRoleId,
            studentRoleId: setupData.roles.etudiant || this.config.studentRoleId
        };
    }

    /**
     * Générer un code de vérification aléatoire
     */
    private generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans 0, O, 1, I pour éviter confusion
        let code = '';
        for (let i = 0; i < this.config.codeLength; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Valider le format d'un email
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Vérifier si le domaine de l'email est autorisé
     */
    private isDomainAllowed(email: string): boolean {
        const domain = email.split('@')[1]?.toLowerCase();
        return this.config.allowedDomains.some(
            d => d.enabled && d.domain.toLowerCase() === domain
        );
    }

    /**
     * Générer un pseudo à partir d'un email universitaire
     */
    private deriveNicknameFromEmail(email: string): string | null {
        const [localPart] = email.split('@');
        if (!localPart) return null;

        const segments = localPart
            .split(/[._\s]+/)
            .map(segment => segment.toLowerCase())
            .filter(Boolean);

        if (segments.length === 0) return null;

        const sanitize = (value: string): string => {
            const withoutDigits = value.replace(/\d+$/g, '');
            return withoutDigits.replace(/[^a-zA-Z\-']/g, '');
        };

        const formatCompound = (value: string, delimiter: string): string => {
            return value
                .split(delimiter)
                .filter(Boolean)
                .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                .join(delimiter);
        };

        const format = (value: string): string => {
            let formatted = value.toLowerCase();
            formatted = formatCompound(formatted, '-');
            formatted = formatCompound(formatted, "'");
            if (!formatted) return formatted;
            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
        };

        const firstSegment = sanitize(segments[0]);
        if (!firstSegment) return null;

        const ignored = [/^etu\d*$/i, /^etudiant$/i, /^student$/i];
        const lastSegments: string[] = [];

        for (let i = 1; i < segments.length; i++) {
            const raw = segments[i];
            if (ignored.some(pattern => pattern.test(raw))) {
                continue;
            }
            const cleaned = sanitize(raw);
            if (cleaned) {
                lastSegments.push(cleaned);
            }
        }

        if (lastSegments.length === 0 && segments.length > 1) {
            const fallback = sanitize(segments[1]);
            if (fallback) {
                lastSegments.push(fallback);
            }
        }

        const firstName = format(firstSegment);
        const lastName = lastSegments.map(format).join(' ').trim();
        const nickname = lastName ? `${firstName} ${lastName}` : firstName;

        return nickname.trim() || null;
    }

    private async applyVerifiedNickname(member: GuildMember, email: string): Promise<void> {
        if (!member.manageable) return;
        const nickname = this.deriveNicknameFromEmail(email);
        if (!nickname) return;

        const current = member.nickname ?? member.user.username;
        if (current === nickname) return;

        try {
            await member.setNickname(nickname, 'Rename automatique après vérification');
        } catch (error) {
            console.error('Erreur lors de la mise à jour du pseudo vérifié:', error);
        }
    }

    /**
     * Vérifier si l'utilisateur est déjà vérifié
     */
    public isUserVerified(userId: string, guildId: string): boolean {
        return !!this.database.get(`verification_${guildId}.verifiedUsers.${userId}`);
    }

    /**
     * Vérifier si l'email est déjà utilisé
     */
    private isEmailUsed(email: string, guildId: string): boolean {
        if (!this.config.requireUniqueEmail) return false;
        
        // Récupérer la liste des IDs d'utilisateurs vérifiés
        const verifiedUserIds: string[] = this.database.get(`verification_${guildId}.verifiedUserIds`) || [];

        // Vérifier chaque utilisateur
        for (const userId of verifiedUserIds) {
            const user = this.database.get(`verification_${guildId}.verifiedUsers.${userId}`);
            if (user && user.email === email) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Vérifier les tentatives de l'utilisateur (anti-spam)
     */
    private checkUserAttempts(userId: string, guildId: string): VerificationResult {
        const attempts: VerificationAttempt[] = this.database.get(`verification_${guildId}.attempts.${userId}`) || [];
        const now = Date.now();

        // Cooldown entre les tentatives
        const lastAttempt = attempts[attempts.length - 1];
        if (lastAttempt && (now - lastAttempt.timestamp) < this.config.cooldownBetweenAttempts) {
            const remainingTime = Math.ceil((this.config.cooldownBetweenAttempts - (now - lastAttempt.timestamp)) / 1000 / 60);
            return {
                success: false,
                message: `Veuillez attendre ${remainingTime} minute(s) avant de réessayer.`,
                error: 'COOLDOWN_ACTIVE'
            };
        }

        // Maximum de tentatives par jour
        const today = new Date().setHours(0, 0, 0, 0);
        const todayAttempts = attempts.filter(a => a.timestamp >= today);
        if (todayAttempts.length >= this.config.maxAttemptsPerDay) {
            return {
                success: false,
                message: `Vous avez atteint le nombre maximum de tentatives aujourd'hui (${this.config.maxAttemptsPerDay}).`,
                error: 'MAX_ATTEMPTS_REACHED'
            };
        }

        return { success: true, message: 'OK' };
    }

    /**
     * Enregistrer une tentative
     */
    private logAttempt(userId: string, email: string, guildId: string, success: boolean, type: 'request' | 'validation'): void {
        const attempts: VerificationAttempt[] = this.database.get(`verification_${guildId}.attempts.${userId}`) || [];
        attempts.push({
            userId,
            email,
            timestamp: Date.now(),
            success,
            type
        });
        this.database.set(`verification_${guildId}.attempts.${userId}`, attempts);
    }

    /**
     * Ajouter un log d'action
     */
    private addLog(
        guildId: string,
        userId: string,
        username: string,
        email: string,
        action: VerificationLog['action'],
        details?: string,
        adminId?: string
    ): void {
        const logs: VerificationLog[] = this.database.get(`verification_${guildId}.logs`) || [];
        logs.push({
            id: `${Date.now()}_${userId}`,
            userId,
            username,
            email,
            action,
            timestamp: Date.now(),
            details,
            adminId
        });
        this.database.set(`verification_${guildId}.logs`, logs);
    }

    /**
     * Demander un code de vérification
     */
    public async requestVerification(
        member: GuildMember,
        email: string
    ): Promise<VerificationResult> {
        const guildId = member.guild.id;
        const userId = member.user.id;

        // Vérifications préliminaires
        if (!this.config.enabled) {
            return {
                success: false,
                message: 'Le système de vérification est actuellement désactivé.',
                error: 'DATABASE_ERROR'
            };
        }

        if (this.isUserVerified(userId, guildId)) {
            return {
                success: false,
                message: 'Vous êtes déjà vérifié sur ce serveur.',
                error: 'ALREADY_VERIFIED'
            };
        }

        if (!this.isValidEmail(email)) {
            return {
                success: false,
                message: 'Format d\'email invalide. Veuillez vérifier votre adresse.',
                error: 'INVALID_EMAIL_FORMAT'
            };
        }

        if (!this.isDomainAllowed(email)) {
            const allowedDomains = this.config.allowedDomains
                .filter(d => d.enabled)
                .map(d => d.domain)
                .join(', ');
            return {
                success: false,
                message: `Domaine non autorisé. Seuls les emails ${allowedDomains} sont acceptés.`,
                error: 'DOMAIN_NOT_ALLOWED'
            };
        }

        if (this.isEmailUsed(email, guildId)) {
            return {
                success: false,
                message: 'Cet email est déjà associé à un autre compte Discord.',
                error: 'EMAIL_ALREADY_USED'
            };
        }

        // Vérifier les tentatives (anti-spam)
        const attemptsCheck = this.checkUserAttempts(userId, guildId);
        if (!attemptsCheck.success) {
            return attemptsCheck;
        }

        // Générer et stocker le code
        const code = this.generateCode();
        const codeData: VerificationCode = {
            code,
            userId,
            email,
            guildId,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.codeExpiration,
            attempts: 0
        };

        this.database.set(`verification_${guildId}.pendingCodes.${code}`, codeData);

        // Envoyer l'email
        if (!emailService.isAvailable()) {
            return {
                success: false,
                message: 'Le service d\'email n\'est pas disponible. Contactez un administrateur.',
                error: 'EMAIL_SEND_FAILED'
            };
        }

        const emailResult = await emailService.sendVerificationCode(
            email,
            code,
            member.user.username,
            member.guild.name
        );

        if (!emailResult.success) {
            // Supprimer le code si l'email n'a pas pu être envoyé
            this.database.delete(`verification_${guildId}.pendingCodes.${code}`);
            return {
                success: false,
                message: emailResult.error || 'Impossible d\'envoyer l\'email.',
                error: 'EMAIL_SEND_FAILED'
            };
        }

        // Enregistrer la tentative
        this.logAttempt(userId, email, guildId, true, 'request');
        this.addLog(guildId, userId, member.user.username, email, 'request');

        return {
            success: true,
            message: `Code de vérification envoyé à ${email}. Vérifiez votre boîte mail !`,
            code
        };
    }

    /**
     * Valider un code de vérification
     */
    public async validateCode(
        member: GuildMember,
        code: string
    ): Promise<VerificationResult> {
        const guildId = member.guild.id;
        const userId = member.user.id;
        const normalizedCode = code.toUpperCase().trim();

        // Récupérer le code
        const codeData: VerificationCode = this.database.get(`verification_${guildId}.pendingCodes.${normalizedCode}`);

        if (!codeData) {
            this.logAttempt(userId, 'unknown', guildId, false, 'validation');
            return {
                success: false,
                message: 'Code invalide ou inexistant.',
                error: 'CODE_NOT_FOUND'
            };
        }

        // Vérifier que c'est le bon utilisateur
        if (codeData.userId !== userId) {
            return {
                success: false,
                message: 'Ce code ne vous appartient pas.',
                error: 'CODE_INVALID'
            };
        }

        // Vérifier l'expiration
        if (Date.now() > codeData.expiresAt) {
            this.database.delete(`verification_${guildId}.pendingCodes.${normalizedCode}`);
            return {
                success: false,
                message: 'Ce code a expiré. Demandez-en un nouveau avec `/verify`.',
                error: 'CODE_EXPIRED'
            };
        }

        // Vérifier le nombre de tentatives
        codeData.attempts++;
        if (codeData.attempts > this.config.maxValidationAttempts) {
            this.database.delete(`verification_${guildId}.pendingCodes.${normalizedCode}`);
            return {
                success: false,
                message: 'Trop de tentatives de validation. Demandez un nouveau code.',
                error: 'MAX_ATTEMPTS_REACHED'
            };
        }

        this.database.set(`verification_${guildId}.pendingCodes.${normalizedCode}`, codeData);

        // Vérification réussie !
        const verifiedUser: VerifiedUser = {
            userId,
            guildId,
            email: codeData.email,
            verifiedAt: Date.now(),
            verifiedBy: 'email'
        };

        this.database.set(`verification_${guildId}.verifiedUsers.${userId}`, verifiedUser);
        this.database.delete(`verification_${guildId}.pendingCodes.${normalizedCode}`);

        // Ajouter l'ID à la liste des utilisateurs vérifiés
        const verifiedUserIds: string[] = this.database.get(`verification_${guildId}.verifiedUserIds`) || [];
        if (!verifiedUserIds.includes(userId)) {
            verifiedUserIds.push(userId);
            this.database.set(`verification_${guildId}.verifiedUserIds`, verifiedUserIds);
        }

        // Récupérer les IDs des rôles depuis le setup
        const roleIds = this.getRoleIds(guildId);
        
        // Attribuer les rôles (vérifié + étudiant)
        const rolesToAdd: string[] = [];
        if (roleIds.verifiedRoleId) rolesToAdd.push(roleIds.verifiedRoleId);
        if (roleIds.studentRoleId) rolesToAdd.push(roleIds.studentRoleId);

        if (rolesToAdd.length > 0) {
            try {
                await member.roles.add(rolesToAdd);
                console.log(`✅ Rôles attribués à ${member.user.username}: ${rolesToAdd.length} rôle(s)`);
            } catch (error) {
                console.error('Erreur lors de l\'attribution des rôles:', error);
            }
        }

        // Logs
        this.logAttempt(userId, codeData.email, guildId, true, 'validation');
        this.addLog(guildId, userId, member.user.username, codeData.email, 'validated');

        await this.applyVerifiedNickname(member, codeData.email);

        // Email de bienvenue (optionnel)
        await emailService.sendWelcomeEmail(codeData.email, member.user.username, member.guild.name);

        return {
            success: true,
            message: 'Vérification réussie ! Vous avez maintenant accès au serveur.',
            data: verifiedUser
        };
    }

    /**
     * Obtenir les statistiques de vérification
     */
    public getStats(guildId: string) {
        // Récupérer la liste des IDs d'utilisateurs vérifiés
        const verifiedUserIds: string[] = this.database.get(`verification_${guildId}.verifiedUserIds`) || [];
        const verifiedUsers: any[] = [];

        // Récupérer les données de chaque utilisateur vérifié
        for (const userId of verifiedUserIds) {
            const user = this.database.get(`verification_${guildId}.verifiedUsers.${userId}`);
            if (user) {
                verifiedUsers.push(user);
            }
        }

        const logs: VerificationLog[] = this.database.get(`verification_${guildId}.logs`) || [];

        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

        const verifiedToday = verifiedUsers.filter((u: any) => u.verifiedAt >= oneDayAgo).length;
        const verifiedThisWeek = verifiedUsers.filter((u: any) => u.verifiedAt >= oneWeekAgo).length;

        const totalAttempts = logs.filter(l => l.action === 'request').length;
        const successfulValidations = logs.filter(l => l.action === 'validated').length;

        return {
            totalVerified: verifiedUsers.length,
            verifiedToday,
            verifiedThisWeek,
            totalAttempts,
            successRate: totalAttempts > 0 ? Math.round((successfulValidations / totalAttempts) * 100) : 0
        };
    }

    /**
     * Supprimer la vérification d'un utilisateur (admin)
     */
    public removeVerification(userId: string, guildId: string, adminId: string, adminName: string): VerificationResult {
        const verifiedUser: VerifiedUser = this.database.get(`verification_${guildId}.verifiedUsers.${userId}`);
        
        if (!verifiedUser) {
            return {
                success: false,
                message: 'Cet utilisateur n\'est pas vérifié.',
                error: 'CODE_NOT_FOUND'
            };
        }

        this.database.delete(`verification_${guildId}.verifiedUsers.${userId}`);
        
        // Retirer l'ID de la liste des utilisateurs vérifiés
        const verifiedUserIds: string[] = this.database.get(`verification_${guildId}.verifiedUserIds`) || [];
        const index = verifiedUserIds.indexOf(userId);
        if (index > -1) {
            verifiedUserIds.splice(index, 1);
            this.database.set(`verification_${guildId}.verifiedUserIds`, verifiedUserIds);
        }
        
        this.addLog(guildId, userId, 'Unknown', verifiedUser.email, 'removed', `Supprimé par ${adminName}`, adminId);

        return {
            success: true,
            message: 'Vérification supprimée avec succès.',
            data: verifiedUser
        };
    }

    /**
     * Vérifier manuellement un utilisateur (admin)
     */
    public async manualVerify(
        member: GuildMember,
        email: string,
        adminId: string,
        adminName: string
    ): Promise<VerificationResult> {
        const guildId = member.guild.id;
        const userId = member.user.id;

        if (this.isUserVerified(userId, guildId)) {
            return {
                success: false,
                message: 'Cet utilisateur est déjà vérifié.',
                error: 'ALREADY_VERIFIED'
            };
        }

        const verifiedUser: VerifiedUser = {
            userId,
            guildId,
            email,
            verifiedAt: Date.now(),
            verifiedBy: 'manual',
            verifierUserId: adminId
        };

        this.database.set(`verification_${guildId}.verifiedUsers.${userId}`, verifiedUser);

        // Ajouter l'ID à la liste des utilisateurs vérifiés
        const verifiedUserIds: string[] = this.database.get(`verification_${guildId}.verifiedUserIds`) || [];
        if (!verifiedUserIds.includes(userId)) {
            verifiedUserIds.push(userId);
            this.database.set(`verification_${guildId}.verifiedUserIds`, verifiedUserIds);
        }

        // Récupérer les IDs des rôles depuis le setup
        const roleIds = this.getRoleIds(guildId);
        
        // Attribuer les rôles (vérifié + étudiant)
        const rolesToAdd: string[] = [];
        if (roleIds.verifiedRoleId) rolesToAdd.push(roleIds.verifiedRoleId);
        if (roleIds.studentRoleId) rolesToAdd.push(roleIds.studentRoleId);

        if (rolesToAdd.length > 0) {
            try {
                await member.roles.add(rolesToAdd);
                console.log(`✅ Rôles attribués à ${member.user.username}: ${rolesToAdd.length} rôle(s)`);
            } catch (error) {
                console.error('Erreur lors de l\'attribution des rôles:', error);
            }
        }

        this.addLog(guildId, userId, member.user.username, email, 'manual', `Vérifié manuellement par ${adminName}`, adminId);

        await this.applyVerifiedNickname(member, email);

        return {
            success: true,
            message: 'Utilisateur vérifié manuellement avec succès.',
            data: verifiedUser
        };
    }
}
