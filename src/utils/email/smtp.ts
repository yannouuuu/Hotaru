import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
type EnvLike = Record<string, string | undefined>;
export interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user?: string;
        pass?: string;
    };
}
const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'oui', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'non', 'off'].includes(normalized)) return false;
    return fallback;
};
export const buildSmtpConfig = (env: EnvLike = process.env): SmtpConfig => ({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: Number.parseInt(env.SMTP_PORT || '587', 10),
    secure: parseBoolean(env.SMTP_SECURE, false),
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
    }
});
export const createSmtpTransporter = (config: SmtpConfig): Transporter => nodemailer.createTransport(config);
export const ensureTransporter = async (transporter: Transporter | null): Promise<boolean> => {
    if (!transporter) return false;
    try {
        await transporter.verify();
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion SMTP:', error);
        return false;
    }
};
