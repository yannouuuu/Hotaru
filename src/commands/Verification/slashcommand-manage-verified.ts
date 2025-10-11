import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    MessageFlags,
    PermissionFlagsBits,
    TextChannel,
    EmbedBuilder,
    Colors
} from 'discord.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { VerificationManager } from '../../utils/VerificationManager.js';
import { VerificationMessages } from '../../utils/VerificationMessages.js';
import type { VerifiedUser } from '../../types/verify.js';

export default new ApplicationCommand({
    command: {
        name: 'manage-verified',
        description: '[ADMIN] Gérer les utilisateurs vérifiés',
        type: ApplicationCommandType.ChatInput,
        dmPermission: false,
        defaultMemberPermissions: PermissionFlagsBits.Administrator,
        options: [
            {
                name: 'stats',
                description: 'Afficher les statistiques de vérification',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'list',
                description: 'Lister tous les utilisateurs vérifiés',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'page',
                        description: 'Numéro de page (10 utilisateurs par page)',
                        type: ApplicationCommandOptionType.Integer,
                        required: false,
                        minValue: 1
                    }
                ]
            },
            {
                name: 'search',
                description: 'Rechercher un utilisateur vérifié',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'query',
                        description: 'Rechercher par email ou ID Discord',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    }
                ]
            },
            {
                name: 'remove',
                description: 'Retirer la vérification d\'un utilisateur',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'user',
                        description: 'L\'utilisateur à dévérifier',
                        type: ApplicationCommandOptionType.User,
                        required: true
                    },
                    {
                        name: 'reason',
                        description: 'Raison de la suppression',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    }
                ]
            },
            {
                name: 'manual-verify',
                description: 'Vérifier manuellement un utilisateur (bypass email)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'user',
                        description: 'L\'utilisateur à vérifier',
                        type: ApplicationCommandOptionType.User,
                        required: true
                    },
                    {
                        name: 'email',
                        description: 'Email universitaire de l\'utilisateur',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'reason',
                        description: 'Raison de la vérification manuelle',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    }
                ]
            }
        ]
    },

    options: {
        cooldown: 3000
    },

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const verificationConfig = client.database.get('verification_config');
        if (!verificationConfig?.enabled) {
            await interaction.editReply(
                VerificationMessages.createErrorMessage(
                    '❌ Système désactivé',
                    'Le système de vérification n\'est pas activé sur ce serveur.'
                )
            );
            return;
        }

        const verificationManager = new VerificationManager(client.database, verificationConfig);
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'stats':
                    await handleStats(interaction, verificationManager);
                    break;
                case 'list':
                    await handleList(interaction, client);
                    break;
                case 'search':
                    await handleSearch(interaction, client);
                    break;
                case 'remove':
                    await handleRemove(interaction, client, verificationManager, verificationConfig);
                    break;
                case 'manual-verify':
                    await handleManualVerify(interaction, client, verificationManager, verificationConfig);
                    break;
            }
        } catch (error) {
            console.error('[manage-verified] Erreur:', error);
            await interaction.editReply(
                VerificationMessages.createErrorMessage(
                    '❌ Erreur interne',
                    'Une erreur s\'est produite lors de l\'exécution de la commande.'
                )
            );
        }
    }
}).toJSON();

/**
 * Gère la sous-commande stats
 */
async function handleStats(
    interaction: any,
    verificationManager: VerificationManager
) {
    const stats = verificationManager.getStats(interaction.guild.id);
    await interaction.editReply(
        VerificationMessages.createStatsMessage({
            ...stats,
            topDomains: []
        })
    );
}

/**
 * Gère la sous-commande list
 */
async function handleList(interaction: any, client: DiscordBot): Promise<void> {
    const page = interaction.options.getInteger('page') || 1;
    const perPage = 10;

    // Récupérer la liste des IDs d'utilisateurs vérifiés
    const verifiedUserIds: string[] = client.database.get(`verification_${interaction.guild.id}.verifiedUserIds`) || [];
    const users: VerifiedUser[] = [];

    // Récupérer les données de chaque utilisateur
    for (const userId of verifiedUserIds) {
        const user = client.database.get(`verification_${interaction.guild.id}.verifiedUsers.${userId}`);
        if (user) {
            users.push(user as VerifiedUser);
        }
    }

    if (users.length === 0) {
        await interaction.editReply(
            VerificationMessages.createErrorMessage(
                '📋 Liste vide',
                'Aucun utilisateur vérifié sur ce serveur.'
            )
        );
        return;
    }

    const totalPages = Math.ceil(users.length / perPage);
    if (page > totalPages) {
        await interaction.editReply(
            VerificationMessages.createErrorMessage(
                '❌ Page invalide',
                `Il n'y a que ${totalPages} page(s) disponible(s).`
            )
        );
        return;
    }

    await interaction.editReply(
        VerificationMessages.createVerifiedListMessage(users, page, totalPages)
    );
}

/**
 * Gère la sous-commande search
 */
async function handleSearch(interaction: any, client: DiscordBot): Promise<void> {
    const query = interaction.options.getString('query', true).toLowerCase();
    
    // Récupérer la liste des IDs d'utilisateurs vérifiés
    const verifiedUserIds: string[] = client.database.get(`verification_${interaction.guild.id}.verifiedUserIds`) || [];
    const allUsers: VerifiedUser[] = [];

    // Récupérer les données de chaque utilisateur
    for (const userId of verifiedUserIds) {
        const user = client.database.get(`verification_${interaction.guild.id}.verifiedUsers.${userId}`);
        if (user) {
            allUsers.push(user as VerifiedUser);
        }
    }

    const results = allUsers.filter((user: VerifiedUser) =>
        user.userId === query || user.email.toLowerCase().includes(query)
    );

    if (results.length === 0) {
        await interaction.editReply(
            VerificationMessages.createErrorMessage(
                '🔍 Aucun résultat',
                'Aucun utilisateur vérifié ne correspond à votre recherche.',
                'Essayez avec un email complet ou un ID Discord.'
            )
        );
        return;
    }

    await interaction.editReply(
        VerificationMessages.createVerifiedListMessage(results, 1, 1)
    );
}

/**
 * Gère la sous-commande remove
 */
async function handleRemove(
    interaction: any,
    client: DiscordBot,
    verificationManager: VerificationManager,
    verificationConfig: any
): Promise<void> {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'Non spécifié';

    // Supprimer la vérification de la base de données
    const result = verificationManager.removeVerification(
        user.id,
        interaction.guild.id,
        interaction.user.id,
        interaction.user.username
    );

    if (!result.success) {
        await interaction.editReply(
            VerificationMessages.createErrorMessage('❌ Erreur', result.message)
        );
        return;
    }

    // Retirer les rôles (vérifié + étudiant)
    const rolesRemoved = await removeVerificationRoles(interaction.guild, user.id, client.database);

    // Message de confirmation
    const embed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setTitle('🗑️ Vérification retirée')
        .setDescription(`La vérification de <@${user.id}> a été retirée avec succès.`)
        .addFields(
            { name: '📧 Email', value: result.data.email, inline: true },
            { name: '📝 Raison', value: reason, inline: true },
            { name: '👤 Par', value: `<@${interaction.user.id}>`, inline: true },
            { name: '🎭 Rôles retirés', value: rolesRemoved || 'Aucun', inline: false }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Log dans le canal des logs
    await sendLogMessage(
        interaction.guild,
        verificationConfig.logChannelId,
        VerificationMessages.createLogEmbed(
            'removed',
            user.id,
            user.username,
            result.data.email,
            interaction.user.username
        )
    );
}

/**
 * Gère la sous-commande manual-verify
 */
async function handleManualVerify(
    interaction: any,
    client: DiscordBot,
    verificationManager: VerificationManager,
    verificationConfig: any
): Promise<void> {
    const user = interaction.options.getUser('user', true);
    const email = interaction.options.getString('email', true).toLowerCase();
    const reason = interaction.options.getString('reason') || 'Vérification manuelle par admin';

    // Valider le format de l'email
    if (!isValidEmail(email)) {
        await interaction.editReply(
            VerificationMessages.createErrorMessage(
                '❌ Email invalide',
                'Le format de l\'email n\'est pas valide.',
                'Exemple: prenom.nom.etu@univ-lille.fr'
            )
        );
        return;
    }

    // Vérifier manuellement l'utilisateur
    const member = await interaction.guild.members.fetch(user.id);
    const result = await verificationManager.manualVerify(
        member,
        email,
        interaction.user.id,
        interaction.user.username
    );

    if (!result.success) {
        await interaction.editReply(
            VerificationMessages.createErrorMessage('❌ Erreur', result.message)
        );
        return;
    }

    // Récupérer les rôles attribués
    const setupData = client.database.get(`setup_${interaction.guild.id}`);
    const rolesInfo = getRolesInfo(setupData);

    // Message de confirmation
    const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('✅ Utilisateur vérifié manuellement')
        .setDescription(`<@${user.id}> a été vérifié avec succès.`)
        .addFields(
            { name: '📧 Email', value: email, inline: true },
            { name: '📝 Raison', value: reason, inline: true },
            { name: '👤 Par', value: `<@${interaction.user.id}>`, inline: true },
            { name: '🎭 Rôles attribués', value: rolesInfo || 'Aucun configuré', inline: false }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Log dans le canal des logs
    await sendLogMessage(
        interaction.guild,
        verificationConfig.logChannelId,
        VerificationMessages.createLogEmbed(
            'manual',
            user.id,
            user.username,
            email,
            interaction.user.username
        )
    );
}

/**
 * Retire les rôles de vérification d'un utilisateur
 */
async function removeVerificationRoles(
    guild: any,
    userId: string,
    database: any
): Promise<string | null> {
    try {
        const member = await guild.members.fetch(userId);
        const setupData = database.get(`setup_${guild.id}`);

        const verifiedRoleId = setupData?.roles?.verifie;
        const studentRoleId = setupData?.roles?.etudiant;

        const rolesToRemove: string[] = [];
        const roleNames: string[] = [];

        if (verifiedRoleId && member.roles.cache.has(verifiedRoleId)) {
            rolesToRemove.push(verifiedRoleId);
            roleNames.push('✅ Vérifié');
        }
        if (studentRoleId && member.roles.cache.has(studentRoleId)) {
            rolesToRemove.push(studentRoleId);
            roleNames.push('👨‍🎓 Étudiant');
        }

        if (rolesToRemove.length > 0) {
            await member.roles.remove(rolesToRemove);
            return roleNames.join(', ');
        }

        return 'Aucun rôle à retirer';
    } catch (error) {
        console.error('[removeVerificationRoles] Erreur:', error);
        return null;
    }
}

/**
 * Récupère les informations des rôles attribués
 */
function getRolesInfo(setupData: any): string {
    if (!setupData || !setupData.roles) {
        return '⚠️ Setup non effectué - Exécutez `/setup` d\'abord';
    }

    const roles: string[] = [];

    if (setupData.roles.verifie) {
        roles.push(`✅ <@&${setupData.roles.verifie}>`);
    }
    if (setupData.roles.etudiant) {
        roles.push(`👨‍🎓 <@&${setupData.roles.etudiant}>`);
    }

    return roles.length > 0 ? roles.join('\n') : '⚠️ Rôles de vérification non configurés';
}

/**
 * Envoie un message dans le canal des logs
 */
async function sendLogMessage(
    guild: any,
    logChannelId: string | undefined,
    embed: EmbedBuilder
): Promise<void> {
    if (!logChannelId) return;

    try {
        const logChannel = guild.channels.cache.get(logChannelId) as TextChannel;
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('[sendLogMessage] Erreur:', error);
    }
}

/**
 * Valide le format d'un email
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

