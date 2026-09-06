import {
    Guild,
    GuildMember,
    TextChannel,
    VoiceChannel,
    PermissionFlagsBits,
    ChannelType,
    Colors,
    GuildChannel
} from 'discord.js';
import type { DiscordBot } from '../client/DiscordBot.js';
import type {
    RoleConfig,
    CategoryConfig,
    ChannelConfig,
    SetupData,
    SetupStepResult,
    ChannelPermissionConfig,
    PromoConfig,
    PromoGroup
} from '../types/setup.js';

/**
 * Résultat de l'analyse d'un channel
 */
interface ChannelAnalysisResult {
    channelKey: string;
    channelConfig: ChannelConfig;
    existingChannel: GuildChannel | null;
    action: 'reuse' | 'create';
}

/**
 * Gestionnaire pour la configuration complète du serveur Discord
 */
export class SetupManager {
    private client: DiscordBot;
    private guild: Guild;
    private setupData: Partial<SetupData>;
    private reusedChannels: number = 0;
    private createdChannels: number = 0;
    private setupLogs: string[] = [];

    constructor(client: DiscordBot, guild: Guild) {
        this.client = client;
        this.guild = guild;
        this.setupData = {
            guildId: guild.id,
            setupDate: Date.now(),
            roles: {} as any,
            categories: {} as any,
            channels: {} as any,
            messages: {} as any
        };
    }

    /**
     * Configuration des rôles à créer
     */
    private getRolesConfig(): Record<string, RoleConfig> {
        return {
            hotaru: {
                name: '🤖 Hotaru',
                color: 0x7289da,
                hoist: true,
                mentionable: false,
                permissions: [
                    PermissionFlagsBits.ManageRoles,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.ManageGuild,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.AddReactions,
                    PermissionFlagsBits.UseExternalEmojis
                ]
            },
            admin: {
                name: '👑 Admin',
                color: 0xe74c3c,    
                hoist: true,
                mentionable: true,
                permissions: [PermissionFlagsBits.Administrator]
            },
            delegue: {
                name: '📋 Délégué',
                color: 0xf39c12,
                hoist: true,
                mentionable: true,
                permissions: [
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.ManageThreads,
                    PermissionFlagsBits.KickMembers,
                    PermissionFlagsBits.ModerateMembers
                ]
            },
            support: {
                name: '🎯 Support',
                color: 0x3498db,
                hoist: true,
                mentionable: true,
                permissions: [
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.ManageThreads
                ]
            },
            animateur: {
                name: '🎉 Animateur',
                color: Colors.Gold,
                hoist: true,
                mentionable: true,
                permissions: [
                    PermissionFlagsBits.ManageEvents,
                    PermissionFlagsBits.CreateEvents
                ]
            },
            etudiant: {
                name: '🎓 Étudiant',
                color: 0x9b59b6, 
                hoist: false,
                mentionable: true
            },
            verifie: {
                name: '✅ Vérifié',
                color: 0x00b894, 
                hoist: false,
                mentionable: false
            },
            jobs: {
                name: '💼 Jobs',
                color: 0x2ecc71,
                hoist: false,
                mentionable: true
            }
        };
    }

    /**
     * Configuration des catégories et salons à créer
     */
    private getCategoriesConfig(roles: Record<string, string>): Record<string, CategoryConfig> {
        const everyoneId = this.guild.roles.everyone.id;

        return {
            systeme: {
                name: '🛠️ SYSTÈME',
                permissions: [
                    {
                        roleId: everyoneId,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    },
                    {
                        roleId: roles.verifie,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    }
                ],
                channels: [
                    {
                        name: '👋・bienvenue',
                        type: ChannelType.GuildText,
                        topic: 'Bienvenue sur le serveur du BUT Informatique de l\'Université de Lille !'
                    },
                    {
                        name: '✅・vérification',
                        type: ChannelType.GuildText,
                        topic: 'Vérifiez-vous ici pour accéder au reste du serveur'
                    },
                    {
                        name: '📜・règlement',
                        type: ChannelType.GuildText,
                        topic: 'Règlement du serveur - À lire obligatoirement'
                    },
                    {
                        name: '📢・annonces',
                        type: ChannelType.GuildText,
                        topic: 'Annonces importantes du serveur',
                        permissions: [
                            {
                                roleId: everyoneId,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                roleId: roles.verifie,
                                allow: [PermissionFlagsBits.ViewChannel],
                                deny: [PermissionFlagsBits.SendMessages]
                            },
                            {
                                roleId: roles.etudiant,
                                allow: [PermissionFlagsBits.ViewChannel],
                                deny: [PermissionFlagsBits.SendMessages]
                            }
                        ]
                    },
                    {
                        name: '🎭・rôles',
                        type: ChannelType.GuildText,
                        topic: 'Récupérez vos rôles ici',
                        permissions: [
                            {
                                roleId: everyoneId,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                roleId: roles.verifie,
                                allow: [PermissionFlagsBits.ViewChannel],
                                deny: [PermissionFlagsBits.SendMessages]
                            },
                            {
                                roleId: roles.hotaru,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.EmbedLinks,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            }
                        ]
                    },
                    {
                        name: 'ℹ️・informations',
                        type: ChannelType.GuildText,
                        topic: 'Informations importantes sur l\'IUT et les cours',
                        permissions: [
                            {
                                roleId: everyoneId,
                                deny: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages
                                ]
                            },
                            {
                                roleId: roles.verifie,
                                allow: [PermissionFlagsBits.ViewChannel],
                                deny: [PermissionFlagsBits.SendMessages]
                            }
                        ]
                    },
                    {
                        name: '📊・ranking-profs',
                        type: ChannelType.GuildText,
                        topic: 'Classement et évaluations des professeurs',
                        permissions: [
                            {
                                roleId: everyoneId,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                roleId: roles.verifie,
                                allow: [PermissionFlagsBits.ViewChannel],
                                deny: [PermissionFlagsBits.SendMessages]
                            },
                            {
                                roleId: roles.hotaru,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.EmbedLinks,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            }
                        ]
                    }
                ]
            },
            discussions: {
                name: '💬 DISCUSSIONS',
                permissions: [
                    {
                        roleId: everyoneId,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        roleId: roles.verifie,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AddReactions,
                            PermissionFlagsBits.UseExternalEmojis,
                            PermissionFlagsBits.EmbedLinks,
                            PermissionFlagsBits.AttachFiles
                        ]
                    }
                ],
                channels: [
                    {
                        name: '💬・général',
                        type: ChannelType.GuildText,
                        topic: 'Discussions générales'
                    },
                    {
                        name: '🗣️・gossip',
                        type: ChannelType.GuildText,
                        topic: 'Les potins du BUT Info'
                    },
                    {
                        name: '📸・photos',
                        type: ChannelType.GuildText,
                        topic: 'Partagez vos photos ici'
                    },
                    {
                        name: '🟩・wordle',
                        type: ChannelType.GuildText,
                        topic: 'Jouez au Wordle du jour'
                    },
                    {
                        name: '💭・citations-profs',
                        type: ChannelType.GuildText,
                        topic: 'Les meilleures citations de vos profs'
                    },
                    {
                        name: '🤖・commandes',
                        type: ChannelType.GuildText,
                        topic: 'Testez les commandes du bot ici'
                    },
                    {
                        name: '📊・sondages',
                        type: ChannelType.GuildText,
                        topic: 'Sondages et votes',
                        permissions: [
                            {
                                roleId: everyoneId,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                roleId: roles.verifie,
                                allow: [PermissionFlagsBits.ViewChannel],
                                deny: [PermissionFlagsBits.SendMessages]
                            },
                            {
                                roleId: roles.hotaru,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.EmbedLinks,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            }
                        ]
                    },
                    {
                        name: '😂・memes',
                        type: ChannelType.GuildText,
                        topic: 'Memes et contenu drôle'
                    },
                    {
                        name: '🔗・liens-utiles',
                        type: ChannelType.GuildText,
                        topic: 'Tous les liens importants'
                    },
                    {
                        name: '💼・jobs',
                        type: ChannelType.GuildText,
                        topic: 'Offres de stage, alternance et emploi',
                        permissions: [
                            {
                                roleId: everyoneId,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                roleId: roles.jobs,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                            },
                            {
                                roleId: roles.hotaru,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.EmbedLinks,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            }
                        ]
                    }
                ]
            },
            vocaux: {
                name: '🔊 SALONS VOCAUX',
                permissions: [
                    {
                        roleId: everyoneId,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        roleId: roles.verifie,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.Speak,
                            PermissionFlagsBits.Stream
                        ]
                    }
                ],
                channels: [
                    {
                        name: '🔊・Vocal 1',
                        type: ChannelType.GuildVoice
                    },
                    {
                        name: '🔊・Vocal 2',
                        type: ChannelType.GuildVoice
                    },
                    {
                        name: '🔊・Vocal 3',
                        type: ChannelType.GuildVoice
                    },
                    {
                        name: '🎓・Amphi',
                        type: ChannelType.GuildVoice,
                        userLimit: 50
                    }
                ]
            },
            cours: {
                name: '📚 COURS & ENTRAIDE',
                permissions: [
                    {
                        roleId: everyoneId,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        roleId: roles.verifie,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.CreatePublicThreads,
                            PermissionFlagsBits.SendMessagesInThreads
                        ]
                    }
                ],
                channels: [
                    {
                        name: '📝・aide-devoirs',
                        type: ChannelType.GuildForum,
                        topic: 'Posez vos questions sur les devoirs et exercices'
                    },
                    {
                        name: '🎯・sae',
                        type: ChannelType.GuildText,
                        topic: 'Discussion sur les SAÉ (Situations d\'Apprentissage et d\'Évaluation)'
                    },
                    {
                        name: '📖・ressources',
                        type: ChannelType.GuildText,
                        topic: 'Ressources pédagogiques et liens utiles pour les cours'
                    },
                    {
                        name: '📚・partage-cours',
                        type: ChannelType.GuildText,
                        topic: 'Partagez vos cours et notes de cours'
                    }
                ]
            },
            support: {
                name: '🎟️ SUPPORT',
                permissions: [
                    {
                        roleId: everyoneId,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    },
                    {
                        roleId: roles.support,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageMessages,
                            PermissionFlagsBits.ManageThreads
                        ]
                    },
                    {
                        roleId: roles.delegue,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageMessages,
                            PermissionFlagsBits.ManageThreads
                        ]
                    }
                ],
                channels: [
                    {
                        name: '🎫・support',
                        type: ChannelType.GuildText,
                        topic: 'Créez un ticket pour obtenir de l\'aide'
                    }
                ]
            },
            moderation: {
                name: '🛡️ MODÉRATION',
                permissions: [
                    {
                        roleId: everyoneId,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        roleId: roles.admin,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageMessages
                        ]
                    },
                    {
                        roleId: roles.delegue,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages
                        ]
                    }
                ],
                channels: [
                    {
                        name: '🎛️・panel-contrôle',
                        type: ChannelType.GuildText,
                        topic: 'Panel de contrôle pour les administrateurs'
                    },
                    {
                        name: '🤖・logs-bots',
                        type: ChannelType.GuildText,
                        topic: 'Logs des actions du bot'
                    },
                    {
                        name: '⚖️・logs-modération',
                        type: ChannelType.GuildText,
                        topic: 'Logs des actions de modération'
                    },
                    {
                        name: '📋・logs-serveur',
                        type: ChannelType.GuildText,
                        topic: 'Logs des événements du serveur'
                    }
                ]
            }
        };
    }

    /**
     * Étape 1 : Créer tous les rôles
     */
    async createRoles(): Promise<SetupStepResult> {
        try {
            const rolesConfig = this.getRolesConfig();
            const createdRoles: Record<string, string> = {};

            for (const [key, config] of Object.entries(rolesConfig)) {
                const role = await this.guild.roles.create({
                    name: config.name,
                    color: config.color,
                    hoist: config.hoist ?? false,
                    mentionable: config.mentionable ?? false,
                    permissions: config.permissions ?? []
                });

                createdRoles[key] = role.id;
                await this.delay(500); // Éviter le rate limit
            }

            this.setupData.roles = createdRoles as any;

            // Auto-assigner le rôle Hotaru au bot
            if (createdRoles.hotaru) {
                try {
                    const botMember = this.guild.members.cache.get(this.client.user!.id);
                    if (botMember) {
                        await botMember.roles.add(createdRoles.hotaru);
                        console.log(`✅ Rôle Hotaru auto-assigné au bot`);
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'auto-assignation du rôle Hotaru:', error);
                }
            }

            return {
                success: true,
                message: `✅ ${Object.keys(createdRoles).length} rôles créés avec succès`,
                data: createdRoles
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Erreur lors de la création des rôles',
                error: error as Error
            };
        }
    }

    /**
     * Analyser un nom de channel pour trouver une correspondance
     */
    private normalizeChannelName(name: string): string {
        // Supprimer les emojis, espaces, caractères spéciaux et convertir en minuscules
        return name
            .replace(/[^\w\s-]/g, '') // Supprimer les emojis et caractères spéciaux
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-') // Remplacer espaces par tirets
            .replace(/-+/g, '-'); // Supprimer tirets multiples
    }

    /**
     * Trouver un channel existant qui correspond au nom recherché
     */
    private findExistingChannel(channelName: string): GuildChannel | null {
        const normalizedSearchName = this.normalizeChannelName(channelName);
        
        // Chercher dans tous les channels du serveur
        const existingChannel = this.guild.channels.cache.find(channel => {
            // Ignorer les catégories et threads
            if (channel.type === ChannelType.GuildCategory || 
                channel.isThread()) {
                return false;
            }
            
            const normalizedExistingName = this.normalizeChannelName(channel.name);
            return normalizedExistingName === normalizedSearchName;
        });

        return (existingChannel as GuildChannel) || null;
    }

    /**
     * Analyser tous les channels à créer et déterminer lesquels réutiliser
     */
    private analyzeChannels(categoriesConfig: Record<string, CategoryConfig>): Map<string, ChannelAnalysisResult[]> {
        const analysisMap = new Map<string, ChannelAnalysisResult[]>();

        for (const [catKey, catConfig] of Object.entries(categoriesConfig)) {
            const channelAnalyses: ChannelAnalysisResult[] = [];

            for (const channelConfig of catConfig.channels) {
                const channelKey = this.getChannelKey(channelConfig.name);
                const existingChannel = this.findExistingChannel(channelConfig.name);

                channelAnalyses.push({
                    channelKey,
                    channelConfig,
                    existingChannel,
                    action: existingChannel ? 'reuse' : 'create'
                });
            }

            analysisMap.set(catKey, channelAnalyses);
        }

        return analysisMap;
    }

    /**
     * Réutiliser et reconfigurer un channel existant
     */
    private async reuseChannel(
        channel: GuildChannel,
        categoryId: string,
        config: ChannelConfig
    ): Promise<{ success: boolean; channel?: GuildChannel; error?: string }> {
        try {
            // 1. Déplacer dans la bonne catégorie
            if (channel.parentId !== categoryId) {
                await channel.setParent(categoryId, {
                    reason: 'Setup automatique - Déplacement dans la catégorie appropriée'
                });
                this.setupLogs.push(`📦 Déplacé "${channel.name}" vers la nouvelle catégorie`);
            }

            // 2. Reconfigurer les permissions si spécifiées
            if (config.permissions) {
                await channel.permissionOverwrites.set(
                    this.buildPermissionOverwrites(config.permissions),
                    'Setup automatique - Application des permissions'
                );
                this.setupLogs.push(`🔐 Permissions mises à jour pour "${channel.name}"`);
            }

            // 3. Mettre à jour le topic si c'est un TextChannel et qu'un topic est spécifié
            if (config.topic && (channel.type === ChannelType.GuildText || 
                                  channel.type === ChannelType.GuildForum ||
                                  channel.type === ChannelType.GuildAnnouncement)) {
                const textChannel = channel as TextChannel;
                if (textChannel.topic !== config.topic) {
                    await textChannel.setTopic(config.topic, 'Setup automatique - Mise à jour du topic');
                    this.setupLogs.push(`📝 Topic mis à jour pour "${channel.name}"`);
                }
            }

            // 4. Mettre à jour la limite d'utilisateurs si c'est un VoiceChannel
            if (config.userLimit && channel.type === ChannelType.GuildVoice) {
                const voiceChannel = channel as VoiceChannel;
                if (voiceChannel.userLimit !== config.userLimit) {
                    await voiceChannel.setUserLimit(config.userLimit, 'Setup automatique - Limite utilisateurs');
                    this.setupLogs.push(`👥 Limite d'utilisateurs mise à jour pour "${channel.name}"`);
                }
            }

            // 5. Mettre à jour le slowmode si spécifié
            if (config.slowmode !== undefined && (channel.type === ChannelType.GuildText || 
                                                    channel.type === ChannelType.GuildForum)) {
                const textChannel = channel as TextChannel;
                if (textChannel.rateLimitPerUser !== config.slowmode) {
                    await textChannel.setRateLimitPerUser(config.slowmode, 'Setup automatique - Slowmode');
                    this.setupLogs.push(`⏱️ Slowmode mis à jour pour "${channel.name}"`);
                }
            }

            this.reusedChannels++;
            return { success: true, channel };

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
            this.setupLogs.push(`❌ Erreur lors de la reconfiguration de "${channel.name}": ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }

    /**
     * Étape 2 : Créer toutes les catégories et salons (avec réutilisation intelligente)
     */
    async createCategoriesAndChannels(): Promise<SetupStepResult> {
        try {
            if (!this.setupData.roles) {
                throw new Error('Les rôles doivent être créés avant les catégories');
            }

            // Réinitialiser les compteurs et logs
            this.reusedChannels = 0;
            this.createdChannels = 0;
            this.setupLogs = [];

            const categoriesConfig = this.getCategoriesConfig(this.setupData.roles);
            const createdCategories: Record<string, string> = {};
            const createdChannels: Record<string, string> = {};

            // Analyser tous les channels avant de commencer
            const channelAnalyses = this.analyzeChannels(categoriesConfig);

            this.setupLogs.push(`🔍 Analyse terminée: ${this.guild.channels.cache.size} channels existants détectés`);

            for (const [catKey, catConfig] of Object.entries(categoriesConfig)) {
                // Créer la catégorie
                const category = await this.guild.channels.create({
                    name: catConfig.name,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: this.buildPermissionOverwrites(catConfig.permissions || [])
                });

                createdCategories[catKey] = category.id;
                this.setupLogs.push(`📁 Catégorie créée: ${catConfig.name}`);
                await this.delay(500);

                // Récupérer l'analyse pour cette catégorie
                const analyses = channelAnalyses.get(catKey) || [];

                for (const analysis of analyses) {
                    try {
                        let channelId: string;

                        if (analysis.action === 'reuse' && analysis.existingChannel) {
                            // Réutiliser le channel existant
                            this.setupLogs.push(`✅ Réutilisation: ${analysis.existingChannel.name}`);
                            
                            const reuseResult = await this.reuseChannel(
                                analysis.existingChannel,
                                category.id,
                                analysis.channelConfig
                            );

                            if (reuseResult.success && reuseResult.channel) {
                                channelId = reuseResult.channel.id;
                            } else {
                                // Si la réutilisation échoue, créer un nouveau channel
                                this.setupLogs.push(`⚠️ Échec réutilisation, création d'un nouveau channel`);
                                const newChannel = await this.createNewChannel(category.id, analysis.channelConfig);
                                channelId = newChannel.id;
                                this.createdChannels++;
                                this.setupLogs.push(`➕ Créé: ${newChannel.name}`);
                            }

                        } else {
                            // Créer un nouveau channel
                            const newChannel = await this.createNewChannel(category.id, analysis.channelConfig);
                            channelId = newChannel.id;
                            this.createdChannels++;
                            this.setupLogs.push(`➕ Créé: ${newChannel.name}`);
                        }

                        createdChannels[analysis.channelKey] = channelId;
                        await this.delay(500);

                    } catch (error) {
                        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
                        this.setupLogs.push(`❌ Erreur avec "${analysis.channelConfig.name}": ${errorMsg}`);
                        // Continuer avec les autres channels même en cas d'erreur
                        continue;
                    }
                }
            }

            this.setupData.categories = createdCategories as any;
            this.setupData.channels = createdChannels as any;

            // Message de résumé
            const summaryMessage = [
                `✅ Configuration terminée !`,
                `📁 ${Object.keys(createdCategories).length} catégories créées`,
                `➕ ${this.createdChannels} channels créés`,
                `✅ ${this.reusedChannels} channels réutilisés`,
                `📊 Total: ${Object.keys(createdChannels).length} channels configurés`
            ].join('\n');

            return {
                success: true,
                message: summaryMessage,
                data: { 
                    categories: createdCategories, 
                    channels: createdChannels,
                    stats: {
                        created: this.createdChannels,
                        reused: this.reusedChannels,
                        logs: this.setupLogs
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Erreur lors de la création des catégories/salons',
                error: error as Error
            };
        }
    }

    /**
     * Créer un nouveau channel
     */
    private async createNewChannel(categoryId: string, config: ChannelConfig): Promise<GuildChannel> {
        return await this.guild.channels.create({
            name: config.name,
            type: config.type as any,
            parent: categoryId,
            topic: config.topic,
            nsfw: config.nsfw ?? false,
            rateLimitPerUser: config.slowmode,
            userLimit: config.userLimit,
            permissionOverwrites: config.permissions 
                ? this.buildPermissionOverwrites(config.permissions)
                : undefined
        });
    }

    /**
     * Obtenir les logs du setup
     */
    getSetupLogs(): string[] {
        return this.setupLogs;
    }

    /**
     * Obtenir les statistiques du setup
     */
    getSetupStats(): { created: number; reused: number; total: number } {
        return {
            created: this.createdChannels,
            reused: this.reusedChannels,
            total: this.createdChannels + this.reusedChannels
        };
    }

    /**
     * Sauvegarder la configuration dans la base de données
     */
    async saveToDatabase(): Promise<SetupStepResult> {
        try {
            this.client.database.set(`setup_${this.guild.id}`, this.setupData);

            return {
                success: true,
                message: '✅ Configuration sauvegardée dans la base de données',
                data: this.setupData
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Erreur lors de la sauvegarde',
                error: error as Error
            };
        }
    }

    /**
     * Récupérer les données de setup depuis la base de données
     */
    static getSetupData(client: DiscordBot, guildId: string): SetupData | null {
        return client.database.get(`setup_${guildId}`) || null;
    }

    /**
     * Supprimer les données de setup de la base de données
     */
    static deleteSetupData(client: DiscordBot, guildId: string): boolean {
        try {
            client.database.delete(`setup_${guildId}`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Obtenir les données actuelles du setup
     */
    getSetupData(): Partial<SetupData> {
        return this.setupData;
    }

    /**
     * Clés de groupes de promo par défaut (A à N, l'alphabet)
     */
    private static readonly DEFAULT_GROUP_KEYS: string[] =
        Array.from({ length: 14 }, (_, i) => String.fromCharCode(65 + i));

    /**
     * Créer tous les groupes de promo (rôles, catégories, salons privés)
     * Les salons sont créés verrouillés : seul le premier (général) est débloqué,
     * le reste s'ouvre progressivement selon progressiveReveal.
     */
    async createPromoGroups(): Promise<SetupStepResult> {
        try {
            const roles = this.setupData.roles as Record<string, string> | undefined;
            if (!roles) {
                throw new Error('Les rôles doivent être créées avant les groupes de promo');
            }

            const everyoneId = this.guild.roles.everyone.id;
            const groupKeys = SetupManager.DEFAULT_GROUP_KEYS;
            const progressiveEnabled = true;

            const groups: Record<string, PromoGroup> = {};

            for (const key of groupKeys) {
                const groupRoleName = `🎓 Groupe ${key}`;

                const role = await this.guild.roles.create({
                    name: groupRoleName,
                    color: 0x3498db,
                    hoist: true,
                    mentionable: true
                });

                const category = await this.guild.channels.create({
                    name: `📚 Groupe ${key}`,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: this.buildPermissionOverwrites([
                        { roleId: everyoneId, deny: [PermissionFlagsBits.ViewChannel] },
                        { roleId: role.id, allow: [PermissionFlagsBits.ViewChannel] }
                    ])
                });

                const channelDefs: Array<{ key: string; name: string; type: ChannelType; topic?: string }> = [
                    { key: 'general', name: `💬・general-${key.toLowerCase()}`, type: ChannelType.GuildText, topic: `Discussion du groupe ${key}` },
                    { key: 'devoirs', name: `📝・devoirs-${key.toLowerCase()}`, type: ChannelType.GuildText, topic: `Devoirs du groupe ${key}` },
                    { key: 'cours', name: `📚・cours-${key.toLowerCase()}`, type: ChannelType.GuildText, topic: `Partage de cours du groupe ${key}` },
                    { key: 'vocal', name: `🔊・vocal-${key.toLowerCase()}`, type: ChannelType.GuildVoice }
                ];

                const channels: Record<string, string> = {};
                const channelRevealOrder = channelDefs.map(d => d.key);
                const unlockedChannels: string[] = progressiveEnabled ? ['general'] : channelRevealOrder;

                for (const def of channelDefs) {
                    const isUnlocked = unlockedChannels.includes(def.key);
                    const perms: ChannelPermissionConfig[] = [
                        { roleId: everyoneId, deny: [PermissionFlagsBits.ViewChannel] }
                    ];

                    if (def.type === ChannelType.GuildVoice) {
                        if (isUnlocked) {
                            perms.push({ roleId: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
                        } else {
                            perms.push({ roleId: role.id, deny: [PermissionFlagsBits.ViewChannel] });
                        }
                    } else {
                        if (isUnlocked) {
                            perms.push({ roleId: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
                        } else {
                            perms.push({ roleId: role.id, deny: [PermissionFlagsBits.ViewChannel] });
                        }
                    }

                    const channel = await this.guild.channels.create({
                        name: def.name,
                        type: def.type as any,
                        parent: category.id,
                        topic: def.topic,
                        permissionOverwrites: this.buildPermissionOverwrites(perms)
                    });

                    channels[def.key] = channel.id;
                    this.setupLogs.push(`📦 Salon groupe ${key}: ${channel.name}`);
                    await this.delay(500);
                }

                groups[key] = {
                    key,
                    name: groupRoleName,
                    roleId: role.id,
                    categoryId: category.id,
                    channels,
                    revealed: false,
                    revealedAt: 0,
                    channelRevealOrder,
                    unlockedChannels
                };

                await this.delay(500);
            }

            const promo: PromoConfig = {
                mode: true,
                groups,
                groupKeys,
                progressiveReveal: { enabled: progressiveEnabled, intervalDays: 7 }
            };

            this.setupData.promo = promo as any;

            return {
                success: true,
                message: `✅ ${groupKeys.length} groupes de promo créés (rôles, catégories, salons privés)`,
                data: { groupCount: groupKeys.length }
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ Erreur lors de la création des groupes de promo',
                error: error as Error
            };
        }
    }

    /**
     * Générer un lien d'invitation permanent du serveur
     */
    async generateInviteLink(): Promise<string | null> {
        try {
            let targetChannelId = (this.setupData.channels as Record<string, string> | undefined)?.general;

            if (!targetChannelId) {
                targetChannelId = this.guild.channels.cache
                    .filter(c => c.type === ChannelType.GuildText && c.viewable)
                    .first()?.id;
            }

            if (!targetChannelId) return null;

            const invite = await this.guild.invites.create(targetChannelId, {
                maxAge: 0,
                maxUses: 0,
                unique: true
            });

            return invite.url;
        } catch (error) {
            console.error('Erreur lors de la génération du lien d\'invitation:', error);
            return null;
        }
    }

    /**
     * Obtenir la configuration promo depuis la base de données
     */
    static getPromoConfig(client: DiscordBot, guildId: string): PromoConfig | null {
        const setupData: any = client.database.get(`setup_${guildId}`);
        return setupData?.promo || null;
    }

    /**
     * Sauvegarder la configuration promo
     */
    static savePromoConfig(client: DiscordBot, guildId: string, promo: PromoConfig): void {
        const setupData: any = client.database.get(`setup_${guildId}`) || {};
        setupData.promo = promo;
        client.database.set(`setup_${guildId}`, setupData);
    }

    /**
     * Obtenir la liste des groupes révélés (disponibles à la sélection)
     */
    static getRevealedGroups(client: DiscordBot, guildId: string): PromoGroup[] {
        const promo = SetupManager.getPromoConfig(client, guildId);
        if (!promo) return [];
        return promo.groupKeys
            .map(k => promo.groups[k])
            .filter(g => g && g.revealed) as PromoGroup[];
    }

    /**
     * Révéler un groupe (le rendre sélectionnable + débloquer le premier salon)
     */
    static async revealGroup(client: DiscordBot, guildId: string, groupKey: string): Promise<boolean> {
        const promo = SetupManager.getPromoConfig(client, guildId);
        if (!promo) return false;

        const group = promo.groups[groupKey];
        if (!group || group.revealed) return false;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return false;

        group.revealed = true;
        group.revealedAt = Date.now();

        const firstKey = group.channelRevealOrder[0];
        if (firstKey && !group.unlockedChannels.includes(firstKey)) {
            await SetupManager.unlockChannelInGuild(guild, group, firstKey);
            group.unlockedChannels.push(firstKey);
        }

        SetupManager.savePromoConfig(client, guildId, promo);
        return true;
    }

    /**
     * Débloquer tous les salons d'un groupe dont l'activation est due
     */
    static async unlockDueChannels(client: DiscordBot, guildId: string, groupKey: string): Promise<number> {
        const promo = SetupManager.getPromoConfig(client, guildId);
        if (!promo?.groups[groupKey]) return 0;

        const group = promo.groups[groupKey];
        if (!group.revealed || group.revealedAt === 0) return 0;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return 0;

        let unlocked = 0;
        const now = Date.now();

        if (!promo.progressiveReveal.enabled) {
            const toUnlock = group.channelRevealOrder.filter(k => !group.unlockedChannels.includes(k));
            for (const key of toUnlock) {
                await SetupManager.unlockChannelInGuild(guild, group, key);
                group.unlockedChannels.push(key);
                unlocked++;
            }
        } else {
            const interval = promo.progressiveReveal.intervalDays * 24 * 60 * 60 * 1000;
            for (let i = 0; i < group.channelRevealOrder.length; i++) {
                const key = group.channelRevealOrder[i];
                if (group.unlockedChannels.includes(key)) continue;
                const dueAt = group.revealedAt + (i * interval);
                if (now >= dueAt) {
                    await SetupManager.unlockChannelInGuild(guild, group, key);
                    group.unlockedChannels.push(key);
                    unlocked++;
                }
            }
        }

        if (unlocked > 0) SetupManager.savePromoConfig(client, guildId, promo);
        return unlocked;
    }

    /**
     * Forcer le déblocage du prochain salon d'un groupe (usage admin)
     */
    static async unlockNextChannel(client: DiscordBot, guildId: string, groupKey: string): Promise<{ unlocked: boolean; channelKey?: string }> {
        const promo = SetupManager.getPromoConfig(client, guildId);
        if (!promo?.groups[groupKey]) return { unlocked: false };

        const group = promo.groups[groupKey];
        const nextKey = group.channelRevealOrder.find(k => !group.unlockedChannels.includes(k));
        if (!nextKey) return { unlocked: false };

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return { unlocked: false };

        await SetupManager.unlockChannelInGuild(guild, group, nextKey);
        group.unlockedChannels.push(nextKey);
        SetupManager.savePromoConfig(client, guildId, promo);

        return { unlocked: true, channelKey: nextKey };
    }

    /**
     * Mettre à jour les permissions pour débloquer un salon de groupe
     */
    private static async unlockChannelInGuild(guild: Guild, group: PromoGroup, channelKey: string): Promise<void> {
        const channelId = group.channels[channelKey];
        if (!channelId) return;

        const channel = guild.channels.cache.get(channelId);
        if (!channel || channel.isThread()) return;

        const isVoice = channel.type === ChannelType.GuildVoice;

        if (isVoice) {
            await channel.permissionOverwrites.edit(group.roleId, {
                ViewChannel: true,
                Connect: true,
                Speak: true
            });
        } else {
            await channel.permissionOverwrites.edit(group.roleId, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
        }
    }

    /**
     * Assigner un groupe à un utilisateur (rôle + enregistrement + déblocage des salons dus)
     */
    static async assignGroupToUser(client: DiscordBot, member: GuildMember, groupKey: string): Promise<{ success: boolean; message: string; unlockedChannels?: string[] }> {
        const guildId = member.guild.id;
        const promo = SetupManager.getPromoConfig(client, guildId);
        if (!promo?.groups[groupKey]) {
            return { success: false, message: '❌ Ce groupe n\'existe pas ou n\'est pas disponible.' };
        }

        const group = promo.groups[groupKey];
        if (!group.revealed) {
            return { success: false, message: '❌ Ce groupe n\'est pas encore disponible. Revenez plus tard !' };
        }

        try {
            await member.roles.add(group.roleId);
        } catch {
            return { success: false, message: '❌ Impossible d\'attribuer le rôle du groupe.' };
        }

        const verified: any = client.database.get(`verification_${guildId}.verifiedUsers.${member.user.id}`);
        if (verified) {
            verified.groupId = groupKey;
            client.database.set(`verification_${guildId}.verifiedUsers.${member.user.id}`, verified);
        }

        await SetupManager.unlockDueChannels(client, guildId, groupKey);

        const visibleChannels = group.unlockedChannels
            .map(k => group.channels[k])
            .map(id => member.guild.channels.cache.get(id)?.name)
            .filter(Boolean) as string[];

        return {
            success: true,
            message: `✅ Vous avez rejoint le **${group.name}** !`,
            unlockedChannels: visibleChannels
        };
    }

    /**
     * Vérifier périodiquement tous les serveurs pour débloquer les salons dus
     */
    static async checkProgress(client: DiscordBot): Promise<void> {
        for (const [guildId] of client.guilds.cache) {
            const promo = SetupManager.getPromoConfig(client, guildId);
            if (!promo?.mode) continue;

            for (const key of promo.groupKeys) {
                try {
                    await SetupManager.unlockDueChannels(client, guildId, key);
                } catch (err) {
                    console.error(`Erreur unlock groupe ${key} (${guildId}):`, err);
                }
            }
        }
    }

    /**
     * Construire les permissions pour un salon
     */
    private buildPermissionOverwrites(permissions: ChannelPermissionConfig[]) {
        return permissions.map(perm => ({
            id: perm.roleId,
            allow: perm.allow || [],
            deny: perm.deny || []
        }));
    }

    /**
     * Convertir un nom de salon en clé pour la base de données
     */
    private getChannelKey(channelName: string): string {
        // Supprimer les emojis, normaliser les accents, convertir en camelCase
        return channelName
            .normalize("NFD") // Décomposer les caractères accentués
            .replace(/[\u0300-\u036f]/g, "") // Supprimer les marques diacritiques
            .replace(/[^\w\s-]/g, '') // Supprimer emojis et caractères spéciaux
            .trim()
            .split(/[\s-]+/)
            .map((word, index) => 
                index === 0 
                    ? word.toLowerCase() 
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');
    }

    /**
     * Délai pour éviter le rate limit
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
