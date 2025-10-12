import type {
    ColorResolvable,
    ChannelType,
    PermissionResolvable
} from 'discord.js';
export interface RoleConfig {
    name: string;
    color?: ColorResolvable;
    colors?: ColorResolvable;
    icon?: string;
    permissions?: PermissionResolvable[];
    hoist?: boolean;
    mentionable?: boolean;
    position?: number;
}
export interface ChannelPermissionConfig {
    roleId: string;
    allow?: PermissionResolvable[];
    deny?: PermissionResolvable[];
}
export interface ChannelConfig {
    name: string;
    type: ChannelType;
    topic?: string;
    nsfw?: boolean;
    slowmode?: number;
    userLimit?: number;
    permissions?: ChannelPermissionConfig[];
    position?: number;
    forum?: boolean;
}
export interface CategoryConfig {
    name: string;
    icon?: string;
    permissions?: ChannelPermissionConfig[];
    channels: ChannelConfig[];
    position?: number;
}
export interface SetupData {
    guildId: string;
    setupDate: number;
    roles: {
        hotaru: string;
        admin: string;
        delegue: string;
        support: string;
        animateur: string;
        etudiant: string;
        verifie: string;
        jobs: string;
        animation: string;
    };
    categories: {
        systeme: string;
        discussions: string;
        vocaux: string;
        cours: string;
        support: string;
        moderation: string;
    };
    channels: {
        bienvenue: string;
        verification: string;
        reglement: string;
        annonces: string;
        roles: string;
        informations: string;
        rankingProfs: string;
        animations: string;
        general: string;
        gossip: string;
        pictures: string;
        wordle: string;
        citationsProfs: string;
        commandes: string;
        sondages: string;
        memes: string;
        liensUtiles: string;
        jobs: string;
        vocal1: string;
        vocal2: string;
        vocal3: string;
        amphi: string;
        aideDevoirs: string;
        sae: string;
        ressources: string;
        partageCours: string;
        support: string;
        panelControle: string;
        logsBots: string;
        logsModeration: string;
        logsServeur: string;
    };
    messages: {
        verification: string;
        roles: string;
        liensUtiles: string;
        support: string;
        panelControle: string;
    };
}
export interface SetupProgress {
    currentStep: number;
    totalSteps: number;
    stepName: string;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
}
export interface SetupStepResult {
    success: boolean;
    message: string;
    data?: unknown;
    error?: Error;
}
export interface UsefulLink {
    label: string;
    description: string;
    url: string;
    emoji?: string;
}
export type RoleKey = keyof SetupData['roles'];
export type CategoryKey = keyof SetupData['categories'];
export type ChannelKey = keyof SetupData['channels'];
