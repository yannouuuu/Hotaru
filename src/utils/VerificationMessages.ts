import { EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { VerificationStats, VerifiedUser } from '../types/verify.js';

/**
 * Messages et embeds pour le système de vérification
 */
export class VerificationMessages {
    /**
     * Message de succès après envoi du code
     */
    static createCodeSentMessage(email: string): { embeds: EmbedBuilder[], components: ActionRowBuilder<ButtonBuilder>[] } {
        const embed = new EmbedBuilder()
            .setTitle('✅ Code de vérification envoyé !')
            .setDescription(
                `Un code de vérification a été envoyé à :\n` +
                `📧 **${email}**\n\n` +
                `**Prochaines étapes :**\n` +
                `1️⃣ Consultez votre boîte mail\n` +
                `2️⃣ Copiez le code de vérification\n` +
                `3️⃣ Cliquez sur le bouton ci-dessous\n` +
                `4️⃣ Entrez le code reçu\n\n` +
                `⏱️ **Le code expire dans 15 minutes**\n` +
                `💡 Si vous ne recevez pas l'email, vérifiez vos spams`
            )
            .setColor(Colors.Green)
            .setFooter({ text: 'Hotaru - Vérification' })
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId('verify_code_input')
            .setLabel('📝 Entrer le code de vérification')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        return { embeds: [embed], components: [row] };
    }

    /**
     * Message de succès après validation
     */
    static createVerificationSuccessMessage(showClassButton: boolean = false): { embeds: EmbedBuilder[]; components?: ActionRowBuilder<ButtonBuilder>[] } {
        const embed = new EmbedBuilder()
            .setTitle('🎉 Vérification réussie !')
            .setDescription(
                `**Excellent !** Votre compte étudiant a été vérifié avec succès.\n\n` +
                `✅ Vous avez reçu le rôle **"✅ Vérifié"**\n` +
                `👨‍🎓 Vous avez reçu le rôle **"Étudiant"**\n` +
                `🔓 Vous avez maintenant accès aux salons généraux du serveur\n\n` +
                '**Accès disponibles :**\n' +
                '💬 Discussions générales et gossip\n' +
                '🔊 Salons vocaux pour les cours/projets\n' +
                '📚 Entraide et partage de cours\n' +
                '🎮 Détente entre les cours\n\n' +
                'Bienvenue dans votre groupe de semestre ! 🎓'
            )
            .setColor(Colors.Gold)
            .setFooter({ text: 'Hotaru - BUT Informatique' })
            .setTimestamp();

        const result: { embeds: EmbedBuilder[]; components?: ActionRowBuilder<ButtonBuilder>[] } = { embeds: [embed] };

        if (showClassButton) {
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('class_choose')
                        .setLabel('📚 Choisir ma classe')
                        .setStyle(ButtonStyle.Primary)
                );
            result.components = [row];
        }

        return result;
    }

    /**
     * Message d'erreur générique
     */
    static createErrorMessage(
        title: string,
        description: string,
        suggestion?: string
    ): { embeds: EmbedBuilder[] } {
        let fullDescription = `❌ ${description}`;
        
        if (suggestion) {
            fullDescription += `\n\n💡 **Suggestion :**\n${suggestion}`;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(fullDescription)
            .setColor(Colors.Red)
            .setFooter({ text: 'Hotaru - Erreur' })
            .setTimestamp();

        return { embeds: [embed] };
    }

    /**
     * Message d'aide pour la vérification
     */
    static createHelpMessage(): { embeds: EmbedBuilder[] } {
        const embed = new EmbedBuilder()
            .setTitle('📖 Aide - Système de vérification')
            .setDescription(
                `**Comment se vérifier ?**\n\n` +
                `**Étape 1 :** Cliquez sur "🎓 Commencer la vérification"\n` +
                `Un modal s'ouvrira pour entrer votre email universitaire\n\n` +
                `**Étape 2 :** Entrez votre email\n` +
                `Format accepté : \`prenom.nom.etu@univ-lille.fr\`\n` +
                `Autres domaines autorisés : \`@univ-lille.fr\`, \`@etu.univ-lille.fr\`\n\n` +
                `**Étape 3 :** Consultez vos emails\n` +
                `Vous recevrez un code de vérification à 6 caractères\n\n` +
                `**Étape 4 :** Validez le code\n` +
                `Cliquez sur "📝 Entrer le code de vérification" puis entrez le code reçu\n\n` +
                `**Sécurité :**\n` +
                `🔒 Code valide 15 minutes\n` +
                `⏱️ Cooldown de 5 minutes entre les tentatives\n` +
                `🚫 Maximum 3 tentatives par jour\n\n` +
                `**Problèmes ?**\n` +
                `Créez un ticket ou contactez un modérateur`
            )
            .setColor(Colors.Blue)
            .setFooter({ text: 'Hotaru - Aide' })
            .setTimestamp();

        return { embeds: [embed] };
    }

    /**
     * Message de statistiques pour les admins
     */
    static createStatsMessage(stats: VerificationStats): { embeds: EmbedBuilder[] } {
        const embed = new EmbedBuilder()
            .setTitle('📊 Statistiques de vérification')
            .setDescription(
                `**Vue d'ensemble :**\n\n` +
                `👥 **Total vérifié :** ${stats.totalVerified} utilisateurs\n` +
                `📅 **Aujourd'hui :** ${stats.verifiedToday} vérifications\n` +
                `📆 **Cette semaine :** ${stats.verifiedThisWeek} vérifications\n` +
                `📝 **Tentatives totales :** ${stats.totalAttempts}\n` +
                `✅ **Taux de réussite :** ${stats.successRate}%\n\n` +
                `**Performance :**\n` +
                `${stats.successRate >= 80 ? '🟢 Excellent' : stats.successRate >= 60 ? '🟡 Correct' : '🔴 À améliorer'}`
            )
            .setColor(Colors.Blue)
            .setFooter({ text: 'Hotaru - Statistiques' })
            .setTimestamp();

        return { embeds: [embed] };
    }

    /**
     * Message de liste des utilisateurs vérifiés
     */
    static createVerifiedListMessage(
        users: VerifiedUser[],
        page: number = 1,
        perPage: number = 10
    ): { embeds: EmbedBuilder[] } {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const pageUsers = users.slice(start, end);
        const totalPages = Math.ceil(users.length / perPage);

        let description = `**Liste des utilisateurs vérifiés** (${users.length} total)\n\n`;

        pageUsers.forEach((user, index) => {
            const verifiedDate = new Date(user.verifiedAt).toLocaleDateString('fr-FR');
            const verifiedBy = user.verifiedBy === 'email' ? '📧 Email' : '👑 Manuel';
            description += `**${start + index + 1}.** <@${user.userId}>\n`;
            description += `   📧 ${user.email}\n`;
            description += `   ${verifiedBy} - ${verifiedDate}\n\n`;
        });

        if (totalPages > 1) {
            description += `\n📄 Page ${page}/${totalPages}`;
        }

        const embed = new EmbedBuilder()
            .setTitle('✅ Utilisateurs vérifiés')
            .setDescription(description)
            .setColor(Colors.Green)
            .setFooter({ text: `Hotaru - Page ${page}/${totalPages}` })
            .setTimestamp();

        return { embeds: [embed] };
    }

    /**
     * Message de confirmation de suppression
     */
    static createRemovalConfirmation(userId: string, email: string): { embeds: EmbedBuilder[] } {
        const embed = new EmbedBuilder()
            .setTitle('✅ Vérification supprimée')
            .setDescription(
                `La vérification a été supprimée avec succès.\n\n` +
                `**Utilisateur :** <@${userId}>\n` +
                `**Email :** ${email}\n\n` +
                `L'utilisateur devra se vérifier à nouveau pour accéder au serveur.`
            )
            .setColor(Colors.Orange)
            .setFooter({ text: 'Hotaru - Administration' })
            .setTimestamp();

        return { embeds: [embed] };
    }

    /**
     * Message de vérification manuelle réussie
     */
    static createManualVerifySuccess(userId: string, email: string): { embeds: EmbedBuilder[] } {
        const embed = new EmbedBuilder()
            .setTitle('✅ Vérification manuelle effectuée')
            .setDescription(
                `L'utilisateur a été vérifié manuellement avec succès.\n\n` +
                `**Utilisateur :** <@${userId}>\n` +
                `**Email :** ${email}\n` +
                `**Méthode :** Vérification manuelle par un administrateur\n\n` +
                `Le rôle "✅ Vérifié" a été attribué.`
            )
            .setColor(Colors.Green)
            .setFooter({ text: 'Hotaru - Administration' })
            .setTimestamp();

        return { embeds: [embed] };
    }

    /**
     * Embed de log pour le canal des logs
     */
    static createLogEmbed(
        action: 'verified' | 'removed' | 'manual',
        userId: string,
        username: string,
        email: string,
        adminName?: string
    ): EmbedBuilder {
        const titles = {
            verified: '✅ Nouvelle vérification',
            removed: '🗑️ Vérification supprimée',
            manual: '👑 Vérification manuelle'
        };

        const colors = {
            verified: Colors.Green,
            removed: Colors.Red,
            manual: Colors.Gold
        };

        const embed = new EmbedBuilder()
            .setTitle(titles[action])
            .setDescription(
                `**Utilisateur :** <@${userId}> (${username})\n` +
                `**Email :** ${email}\n` +
                (adminName ? `**Administrateur :** ${adminName}\n` : '') +
                `**Date :** ${new Date().toLocaleString('fr-FR')}`
            )
            .setColor(colors[action])
            .setFooter({ text: 'Hotaru - Logs' })
            .setTimestamp();

        return embed;
    }
}
