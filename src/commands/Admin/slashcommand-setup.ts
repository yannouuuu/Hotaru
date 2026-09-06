import {
    PermissionFlagsBits,
    ApplicationCommandType,
    ApplicationCommandOptionType,
    TextChannel,
    Colors,
    EmbedBuilder,
    MessageFlags
} from 'discord.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { SetupManager } from '../../utils/SetupManager.js';
import { SetupMessages } from '../../utils/SetupMessages.js';

/**
 * Générer la configuration pour le fichier .env
 */
function generateEnvConfig(setupData: any): string {
    const lines: string[] = [
        '# Configuration du serveur - Généré automatiquement',
        '',
        '# Rôles',
        `ROLE_HOTARU=${setupData.roles?.hotaru || 'N/A'}`,
        `ROLE_ADMIN=${setupData.roles?.admin || 'N/A'}`,
        `ROLE_DELEGUE=${setupData.roles?.delegue || 'N/A'}`,
        `ROLE_SUPPORT=${setupData.roles?.support || 'N/A'}`,
        `ROLE_ANIMATEUR=${setupData.roles?.animateur || 'N/A'}`,
        `ROLE_ETUDIANT=${setupData.roles?.etudiant || 'N/A'}`,
        `ROLE_VERIFIE=${setupData.roles?.verifie || 'N/A'}`,
        `ROLE_JOBS=${setupData.roles?.jobs || 'N/A'}`,
        '',
        '# Catégories',
        `CATEGORY_SYSTEME=${setupData.categories?.systeme || 'N/A'}`,
        `CATEGORY_DISCUSSIONS=${setupData.categories?.discussions || 'N/A'}`,
        `CATEGORY_VOCAUX=${setupData.categories?.vocaux || 'N/A'}`,
        `CATEGORY_COURS=${setupData.categories?.cours || 'N/A'}`,
        `CATEGORY_SUPPORT=${setupData.categories?.support || 'N/A'}`,
        `CATEGORY_MODERATION=${setupData.categories?.moderation || 'N/A'}`,
        '',
        '# Salons principaux',
        `CHANNEL_VERIFICATION=${setupData.channels?.verification || 'N/A'}`,
        `CHANNEL_ROLES=${setupData.channels?.roles || 'N/A'}`,
        `CHANNEL_SUPPORT=${setupData.channels?.support || 'N/A'}`,
        `CHANNEL_PANEL=${setupData.channels?.panelControle || 'N/A'}`
    ];

    return lines.join('\n');
}

export default new ApplicationCommand({
    command: {
        name: 'setup',
        description: 'Configure automatiquement le serveur pour le BUT Informatique',
        type: ApplicationCommandType.ChatInput,
        defaultMemberPermissions: PermissionFlagsBits.Administrator,
        dmPermission: false,
        options: [
            {
                name: 'mode',
                description: 'Mode de configuration : standard (un groupe) ou promo (toute la promotion, groupes A–N)',
                type: ApplicationCommandOptionType.String,
                required: false,
                choices: [
                    { name: 'Standard (un groupe)', value: 'standard' },
                    { name: 'Promotion (groupes A–N)', value: 'promo' }
                ]
            }
        ]
    },

    options: {
        cooldown: 60000 // 1 minute de cooldown
    },

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) {
            await interaction.reply({
                content: '❌ Cette commande ne peut être utilisée que dans un serveur.',
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // Vérifier si un setup existe déjà
        const existingSetup = SetupManager.getSetupData(client, interaction.guildId);
        if (existingSetup) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('⚠️ Setup déjà effectué')
                        .setDescription(
                            'Ce serveur a déjà été configuré.\n\n' +
                            'Si vous souhaitez recommencer, utilisez d\'abord `/cleanup` pour supprimer la configuration actuelle.'
                        )
                        .setColor(Colors.Orange)
                        .setFooter({ text: 'Hotaru - Setup' })
                        .setTimestamp()
                ],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // Répondre immédiatement pour éviter le timeout
        await interaction.deferReply();

        const guild = interaction.guild;
        const setupManager = new SetupManager(client, guild);

        const mode = interaction.options.getString('mode') ?? 'standard';
        const isPromo = mode === 'promo';
        const totalSteps = isPromo ? 8 : 7;
        const saveStep = isPromo ? 5 : 4;
        const envStep = isPromo ? 6 : 5;
        const permStep = isPromo ? 7 : 6;
        const finalStep = isPromo ? 8 : 7;

        try {
            // Étape 1 : Créer les rôles (7 rôles)
            await interaction.editReply(
                SetupMessages.createProgressMessage(1, totalSteps, 'Création des rôles...', 'in-progress')
            );

            const rolesResult = await setupManager.createRoles();
            if (!rolesResult.success) {
                throw new Error(rolesResult.message);
            }

            await interaction.editReply(
                SetupMessages.createProgressMessage(1, totalSteps, 'Rôles créés avec succès', 'completed')
            );

            // Attendre un peu pour éviter le rate limit
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Étape 2 : Créer les catégories et salons (avec réutilisation intelligente)
            await interaction.editReply(
                SetupMessages.createProgressMessage(2, totalSteps, 'Analyse et configuration des catégories et salons...', 'in-progress')
            );

            const channelsResult = await setupManager.createCategoriesAndChannels();
            if (!channelsResult.success) {
                throw new Error(channelsResult.message);
            }

            // Récupérer les stats et logs
            const setupStats = setupManager.getSetupStats();
            const setupLogs = setupManager.getSetupLogs();

            // Afficher le rapport détaillé
            await interaction.editReply(
                SetupMessages.createProgressMessageWithStats(
                    2, 
                    7, 
                    'Catégories et salons configurés', 
                    'completed',
                    { created: setupStats.created, reused: setupStats.reused }
                )
            );

            // Si des channels ont été réutilisés ou créés, afficher les logs
            if (setupLogs.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                await interaction.followUp(
                    SetupMessages.createChannelSetupLogsMessage(setupStats, setupLogs)
                );
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Étape 3 : Envoyer les messages interactifs
            await interaction.editReply(
                SetupMessages.createProgressMessage(3, totalSteps, 'Envoi des messages interactifs...', 'in-progress')
            );

            const setupData = setupManager.getSetupData();
            if (!setupData.channels) {
                throw new Error('Les données des salons sont manquantes');
            }

            // Debug : afficher toutes les clés de channels créés
            console.log('🔍 Channels créés:', Object.keys(setupData.channels));
            console.log('🔍 Channels:', setupData.channels);

            // Récupérer les salons pour envoyer les messages
            const verificationChannel = guild.channels.cache.get(setupData.channels.verification) as TextChannel;
            const rolesChannel = guild.channels.cache.get(setupData.channels.roles) as TextChannel;
            const informationsChannel = guild.channels.cache.get(setupData.channels.informations) as TextChannel;
            const supportChannel = guild.channels.cache.get(setupData.channels.support) as TextChannel;
            const panelControleChannel = guild.channels.cache.get(setupData.channels.panelControle) as TextChannel;

            if (!verificationChannel || !rolesChannel || !informationsChannel || !supportChannel || !panelControleChannel) {
                console.log('❌ Channels manquants:');
                console.log('  verification:', !!verificationChannel);
                console.log('  roles:', !!rolesChannel);
                console.log('  informations:', !!informationsChannel);
                console.log('  support:', !!supportChannel);
                console.log('  panelControle:', !!panelControleChannel);
                throw new Error('Impossible de trouver tous les salons nécessaires');
            }

            const messages = await SetupMessages.sendAllMessages(
                setupData as any,
                {
                    verification: verificationChannel,
                    roles: rolesChannel,
                    informations: informationsChannel,
                    support: supportChannel,
                    panelControle: panelControleChannel
                }
            );

            // Ajouter les IDs des messages aux données du setup
            setupData.messages = messages as any;

            await interaction.editReply(
                SetupMessages.createProgressMessage(3, totalSteps, 'Messages envoyés avec succès', 'completed')
            );

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Étape 4 (mode promo) : Créer les groupes de promotion
            if (isPromo) {
                await interaction.editReply(
                    SetupMessages.createProgressMessage(4, totalSteps, 'Création des groupes de promo (A–N)...', 'in-progress')
                );

                const promoResult = await setupManager.createPromoGroups();
                if (!promoResult.success) {
                    throw new Error(promoResult.message);
                }

                const promoData = setupManager.getSetupData().promo;
                if (!promoData) {
                    throw new Error('Les données des groupes de promo sont manquantes');
                }

                // Générer le lien d'invitation permanent
                const inviteLink = await setupManager.generateInviteLink();
                if (inviteLink) {
                    promoData.inviteLink = inviteLink;
                }

                // Envoyer le panneau de sélection de classe dans le salon des rôles
                const rolesChannelId = setupManager.getSetupData().channels?.roles;
                const promoRolesChannel = rolesChannelId
                    ? guild.channels.cache.get(rolesChannelId) as TextChannel | undefined
                    : undefined;

                if (promoRolesChannel) {
                    const panel = SetupMessages.createPromoPanel([]);
                    const promoMsg = await promoRolesChannel.send(panel);
                    const currentMessages = setupManager.getSetupData().messages as Record<string, string | undefined>;
                    currentMessages.promoPanel = promoMsg.id;
                }

                await interaction.editReply(
                    SetupMessages.createProgressMessage(4, totalSteps, 'Groupes de promo créés', 'completed')
                );

                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            // Étape 5 : Sauvegarder dans la base de données
            await interaction.editReply(
                SetupMessages.createProgressMessage(saveStep, totalSteps, 'Sauvegarde de la configuration...', 'in-progress')
            );

            const saveResult = await setupManager.saveToDatabase();
            if (!saveResult.success) {
                throw new Error(saveResult.message);
            }

            await interaction.editReply(
                SetupMessages.createProgressMessage(saveStep, totalSteps, 'Configuration sauvegardée', 'completed')
            );

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Étape 5 : Générer le fichier .env (simulation)
            await interaction.editReply(
                SetupMessages.createProgressMessage(envStep, totalSteps, 'Génération des identifiants...', 'in-progress')
            );

            const envConfig = generateEnvConfig(setupData as any);

            await interaction.editReply(
                SetupMessages.createProgressMessage(envStep, totalSteps, 'Identifiants générés', 'completed')
            );

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Étape 6 : Configuration des permissions
            await interaction.editReply(
                SetupMessages.createProgressMessage(permStep, totalSteps, 'Configuration des permissions...', 'in-progress')
            );

            // Les permissions sont déjà configurées lors de la création
            await new Promise(resolve => setTimeout(resolve, 1000));

            await interaction.editReply(
                SetupMessages.createProgressMessage(permStep, totalSteps, 'Permissions configurées', 'completed')
            );

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Étape 7 : Finalisation
            await interaction.editReply(
                SetupMessages.createProgressMessage(finalStep, totalSteps, 'Finalisation...', 'in-progress')
            );

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Message de confirmation final
            const promoInfo = isPromo && setupData.promo
                ? `\n🎓 **Mode promotion activé :** ${setupData.promo.groupKeys.length} groupes (A–N) créés\n` +
                  '📢 Utilisez `/group reveal <lettre>` pour dévoiler les groupes progressivement.\n' +
                  (setupData.promo.inviteLink
                      ? `🔗 **Lien d'invitation de la promo :** ${setupData.promo.inviteLink}\n`
                      : '')
                : '';

            const finalEmbed = new EmbedBuilder()
                .setTitle('✅ Configuration terminée !')
                .setDescription(
                    '**Le serveur a été configuré avec succès !**\n\n' +
                    '**Résumé de la configuration :**\n' +
                    `🎭 **Rôles créés :** ${Object.keys(setupData.roles || {}).length}\n` +
                    `📁 **Catégories créées :** ${Object.keys(setupData.categories || {}).length}\n` +
                    `💬 **Salons créés :** ${Object.keys(setupData.channels || {}).length}\n` +
                    `📨 **Messages interactifs :** ${Object.keys(setupData.messages || {}).length}\n` +
                    promoInfo +
                    '\n**Configuration enregistrée dans la base de données.**\n\n' +
                    '**Identifiants pour le fichier .env :**\n' +
                    '```env\n' + envConfig + '\n```\n' +
                    '⚠️ **Important :** Copiez ces identifiants dans votre fichier `.env` pour configurer les fonctionnalités avancées.'
                )
                .setColor(Colors.Green)
                .setFooter({ text: 'Hotaru - Setup terminé' })
                .setTimestamp();

            await interaction.editReply({ embeds: [finalEmbed], components: [] });

        } catch (error) {
            console.error('Erreur lors du setup:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erreur lors du setup')
                .setDescription(
                    '**Une erreur s\'est produite lors de la configuration du serveur.**\n\n' +
                    `**Erreur :** ${error instanceof Error ? error.message : 'Erreur inconnue'}\n\n` +
                    'Veuillez utiliser `/cleanup` pour nettoyer les éléments partiellement créés, ' +
                    'puis réessayez le setup.'
                )
                .setColor(Colors.Red)
                .setFooter({ text: 'Hotaru - Erreur' })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }
    }
}).toJSON();
