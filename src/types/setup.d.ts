import type { 
    ColorResolvable, 
    ChannelType, 
    PermissionResolvable,
    OverwriteResolvable
} from 'discord.js';

/**
 * Configuration pour la création d'un rôle
 */
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

/**
 * Configuration pour les permissions d'un salon
 */
export interface ChannelPermissionConfig {
    roleId: string;
    allow?: PermissionResolvable[];
    deny?: PermissionResolvable[];
}

/**
 * Configuration pour la création d'un salon
 */
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

/**
 * Configuration pour la création d'une catégorie avec ses salons
 */
export interface CategoryConfig {
    name: string;
    icon?: string;
    permissions?: ChannelPermissionConfig[];
    channels: ChannelConfig[];
    position?: number;
}

/**
 * Structure des données sauvegardées dans la base de données
 */
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
        // Système
        bienvenue: string;
        verification: string;
        reglement: string;
        annonces: string;
        roles: string;
        informations: string;
        animations: string;
        
        // Discussions
        general: string;
        gossip: string;
        pictures: string;
        citationsProfs: string;
        commandes: string;
        sondages: string;
        memes: string;
        liensUtiles: string;
        jobs: string;
        
        // Vocaux
        vocal1: string;
        vocal2: string;
        vocal3: string;
        amphi: string;
        
        // Cours
        aideDevoirs: string;
        sae: string;
        ressources: string;
        partageCours: string;
        
        // Support
        support: string;
        
        // Modération
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

/**
 * Options pour la progression du setup
 */
export interface SetupProgress {
    currentStep: number;
    totalSteps: number;
    stepName: string;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
}

/**
 * Résultat d'une étape du setup
 */
export interface SetupStepResult {
    success: boolean;
    message: string;
    data?: any;
    error?: Error;
}

/**
 * Configuration des liens utiles pour le menu déroulant
 */
export interface UsefulLink {
    label: string;
    description: string;
    url: string;
    emoji?: string;
}

/**
 * Type pour les clés de rôles
 */
export type RoleKey = keyof SetupData['roles'];

/**
 * Type pour les clés de catégories
 */
export type CategoryKey = keyof SetupData['categories'];

/**
 * Type pour les clés de salons
 */
export type ChannelKey = keyof SetupData['channels'];
