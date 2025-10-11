import {
    PermissionFlagsBits,
    ApplicationCommandType,
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
        options: []
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

        try {
            // Étape 1 : Créer les rôles (7 rôles)
            await interaction.editReply(
                SetupMessages.createProgressMessage(1, 7, 'Création des rôles...', 'in-progress')
            );

            const rolesResult = await setupManager.createRoles();
            if (!rolesResult.success) {
                throw new Error(rolesResult.message);
            }

            await interaction.editReply(
                SetupMessages.createProgressMessage(1, 7, 'Rôles créés avec succès', 'completed')
            );

            // Attendre un peu pour éviter le rate limit
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Étape 2 : Créer les catégories et salons (avec réutilisation intelligente)
            await interaction.editReply(
                SetupMessages.createProgressMessage(2, 7, 'Analyse et configuration des catégories et salons...', 'in-progress')
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
                SetupMessages.createProgressMessage(3, 7, 'Envoi des messages interactifs...', 'in-progress')
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
                SetupMessages.createProgressMessage(3, 7, 'Messages envoyés avec succès', 'completed')
            );

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Étape 4 : Sauvegarder dans la base de données
            await interaction.editReply(
                SetupMessages.createProgressMessage(4, 7, 'Sauvegarde de la configuration...', 'in-progress')
            );

            const saveResult = await setupManager.saveToDatabase();
            if (!saveResult.success) {
                throw new Error(saveResult.message);
            }

            await interaction.editReply(
                SetupMessages.createProgressMessage(4, 7, 'Configuration sauvegardée', 'completed')
            );

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Étape 5 : Générer le fichier .env (simulation)
            await interaction.editReply(
                SetupMessages.createProgressMessage(5, 7, 'Génération des identifiants...', 'in-progress')
            );

            const envConfig = generateEnvConfig(setupData as any);

            await interaction.editReply(
                SetupMessages.createProgressMessage(5, 7, 'Identifiants générés', 'completed')
            );

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Étape 6 : Configuration des permissions
            await interaction.editReply(
                SetupMessages.createProgressMessage(6, 7, 'Configuration des permissions...', 'in-progress')
            );

            // Les permissions sont déjà configurées lors de la création
            await new Promise(resolve => setTimeout(resolve, 1000));

            await interaction.editReply(
                SetupMessages.createProgressMessage(6, 7, 'Permissions configurées', 'completed')
            );

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Étape 7 : Finalisation
            await interaction.editReply(
                SetupMessages.createProgressMessage(7, 7, 'Finalisation...', 'in-progress')
            );

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Message de confirmation final
            const finalEmbed = new EmbedBuilder()
                .setTitle('✅ Configuration terminée !')
                .setDescription(
                    '**Le serveur a été configuré avec succès !**\n\n' +
                    '**Résumé de la configuration :**\n' +
                    `🎭 **Rôles créés :** ${Object.keys(setupData.roles || {}).length}\n` +
                    `📁 **Catégories créées :** ${Object.keys(setupData.categories || {}).length}\n` +
                    `💬 **Salons créés :** ${Object.keys(setupData.channels || {}).length}\n` +
                    `📨 **Messages interactifs :** ${Object.keys(setupData.messages || {}).length}\n\n` +
                    '**Configuration enregistrée dans la base de données.**\n\n' +
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
