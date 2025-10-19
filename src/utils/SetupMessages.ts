import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonStyle,
    Colors,
    type TextChannel
} from 'discord.js';
import type { SetupData, UsefulLink } from '../types/index.js';

export class SetupMessages {
    static createVerificationMessage() {
        const embed = new EmbedBuilder()
            .setTitle('✅ Vérification')
            .setDescription(
                '**Bienvenue sur le serveur du BUT Informatique de l\'Université de Lille !**\n\n' +
                'Pour accéder au reste du serveur, vous devez vous vérifier avec votre adresse email étudiante.\n\n' +
                '**Comment faire :**\n' +
                '🔘 Cliquez sur le bouton ci-dessous\n\n' +
                '⚠️ **Important :** Une fois vérifié, vous aurez accès à tous les salons du serveur.'
            )
            .setColor(Colors.Green)
            .setFooter({ text: 'Hotaru - Système de vérification' })
            .setTimestamp();

        const button = new ButtonBuilder()
            .setCustomId('verification_start')
            .setLabel('🎓 Commencer la vérification')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        return { embeds: [embed], components: [row] };
    }

    static createRolesMessage() {
        const embed = new EmbedBuilder()
            .setTitle('🎭 Rôles')
            .setDescription(
                '**Récupérez vos rôles en cliquant sur les boutons ci-dessous :**\n\n' +
                ` **Jobs** - Accédez au salon des offres de stage et d'emploi\n` +
                `🎪 **Animation** - Accédez au salon des animations et créations\n\n` +
                '⚠️ Les rôles de modération (Délégué, Admin, Support) sont attribués par les administrateurs.'
            )
            .setColor(Colors.Purple)
            .setFooter({ text: 'Hotaru - Gestion des rôles' })
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('role_jobs')
                    .setLabel('Jobs')
                    .setEmoji('💼')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('role_animation')
                    .setLabel('Animation')
                    .setEmoji('🎪')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [row] };
    }

    static createUsefulLinksMessage() {
        const embed = new EmbedBuilder()
            .setTitle('🔗 Ressources & Liens Utiles')
            .setDescription(
                '**Bienvenue sur le serveur du BUT Informatique de l\'Université de Lille !**\n\n' +
                '> Retrouvez ici tous les liens essentiels pour votre année universitaire.\n\n' +
                '**📚 Plateforme d\'apprentissage :**\n' +
                '• [Notion BUT1 2025-2026](https://www.notion.so/BUT1-Informatique-IUT-de-Lille-2025-2026-27b6e4f7ea6581998644c2590374d65b) - Ressources collaboratives\n' +
                '• [Aide BUT Info](https://but-info.septhime.fr/) - Tutorat et aide aux devoirs\n\n' +
                '**👥 Responsables du département :**\n' +
                '• **Chef de département** : Frédéric Guyomarch ([frederic.guyomarch@univ-lille.fr](mailto:frederic.guyomarch@univ-lille.fr))\n' +
                '• **Alternances** : Isabelle Delille ([isabelle.delille@univ-lille.fr](mailto:isabelle.delille@univ-lille.fr))\n\n' +
                '**📋 Responsables par année :**\n' +
                '**BUT 1** - Julien Baste ([julien.baste@univ-lille.fr](mailto:julien.baste@univ-lille.fr))\n' +
                '**BUT 2** - Patricia Everaere ([patricia.everaere-caillier@univ-lille.fr](mailto:patricia.everaere-caillier@univ-lille.fr))\n' +
                '**BUT 3** - Philippe Mathieu & Yvan Peter\n\n' +
                '**📌 Absences :**\n' +
                '• Prévenez ou écrivez au secrétariat de l\'IUT : [marie.ryckebosch@univ-lille.fr](mailto:marie.ryckebosch@univ-lille.fr)\n' +
                '• Fournissez un justificatif valide sous 72h après le premier jour d\'absence\n' +
                '• Pour un examen raté, un rattrapage est possible avec justificatif ; le secrétariat vous accompagnera pour l\'inscription (généralement un jeudi après-midi ou fin de semestre)\n\n' +
                '💡 *Utilisez le menu déroulant ci-dessous pour accéder rapidement aux plateformes*'
            )
            .setColor(0x7289da)
            .setFooter({ text: 'BUT Informatique - IUT Lille' })
            .setTimestamp();

        const links: UsefulLink[] = [
            {
                label: '📅 Emploi du temps',
                description: 'Consultez votre emploi du temps',
                emoji: '📅',
                url: 'https://edt-iut.univ-lille.fr/'
            },
            {
                label: '📊 Notes et bulletins',
                description: 'Accédez à vos notes et bulletins',
                emoji: '📊',
                url: 'https://bulletin.iut-info.univ-lille.fr/'
            },
            {
                label: '📧 Zimbra - Mail universitaire',
                description: 'Votre boîte mail universitaire',
                emoji: '📧',
                url: 'https://zimbra.univ-lille.fr/'
            },
            {
                label: '📚 Moodle - Cours en ligne',
                description: 'Ressources des cours',
                emoji: '📚',
                url: 'https://moodle.univ-lille.fr/'
            },
            {
                label: '🎓 ENT - Espace numérique',
                description: 'Environnement Numérique de Travail',
                emoji: '🎓',
                url: 'https://ent.univ-lille.fr/'
            },
            {
                label: '💡 Aide BUT Info',
                description: 'Tutorat - En partenariat avec le tutorat',
                emoji: '💡',
                url: 'https://but-info.septhime.fr/'
            },
            {
                label: '⚽ Sport universitaire',
                description: 'Activités sportives universitaires',
                emoji: '⚽',
                url: 'https://sport.univ-lille.fr/'
            },
            {
                label: '📝 Notion BUT1 2025-2026',
                description: 'Ressources collaboratives par Yann',
                emoji: '📝',
                url: 'https://www.notion.so/BUT1-Informatique-IUT-de-Lille-2025-2026-27b6e4f7ea6581998644c2590374d65b'
            }
        ];

        const select = new StringSelectMenuBuilder()
            .setCustomId('useful_links_menu')
            .setPlaceholder('🔗 Sélectionnez une plateforme')
            .addOptions(
                links.map(link => {
                    const option = new StringSelectMenuOptionBuilder()
                        .setLabel(link.label)
                        .setDescription(link.description)
                        .setValue(link.url);

                    if (link.emoji) {
                        option.setEmoji(link.emoji);
                    }

                    return option;
                })
            );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(select);

        return { embeds: [embed], components: [row] };
    }

    static createSupportMessage() {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Support')
            .setDescription(
                '**Besoin d\'aide ? Créez un ticket !**\n\n' +
                'Cliquez sur le bouton ci-dessous pour ouvrir un espace privé avec l\'équipe support. ' +
                'Chaque ticket reçoit un numéro de suivi et reste accessible tant qu\'il n\'est pas fermé.\n\n' +
                '**Quand créer un ticket ?**\n' +
                '• Questions sur le serveur ou la communauté\n' +
                '• Problèmes techniques ou bugs\n' +
                '• Signalement d\'un abus\n' +
                '• Demandes particulières à l\'équipe\n\n' +
                '**Bonnes pratiques :**\n' +
                '• Préparez les informations utiles (captures, IDs, contexte)\n' +
                '• Restez courtois et précis dans vos messages\n' +
                '• Utilisez la commande `/close-ticket` quand tout est résolu\n\n' +
                '⚠️ **Attention :** Les tickets inutiles ou abusifs pourront être sanctionnés.'
            )
            .setColor(Colors.Yellow)
            .setFooter({ text: 'Hotaru - Système de support' })
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('🎫 Créer un ticket')
                    .setStyle(ButtonStyle.Primary)
            );

        return { embeds: [embed], components: [row] };
    }

    static createControlPanelMessage() {
        const embed = new EmbedBuilder()
            .setTitle('🎛️ Panel de Contrôle')
            .setDescription(
                '**Panel d\'administration du serveur**\n\n' +
                'Utilisez les boutons ci-dessous pour gérer les messages interactifs du serveur.\n\n' +
                '**Actions disponibles :**\n' +
                '🔄 **Rafraîchir** - Recrée tous les messages interactifs\n' +
                '📊 **Statistiques** - Affiche les statistiques du serveur\n' +
                '⚙️ **Configuration** - Affiche la configuration actuelle\n'
            )
            .setColor(Colors.Red)
            .setFooter({ text: 'Hotaru - Panel de contrôle' })
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('panel_refresh')
                    .setLabel('🔄 Rafraîchir')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('panel_stats')
                    .setLabel('📊 Statistiques')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('panel_config')
                    .setLabel('⚙️ Configuration')
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [row] };
    }

    static async sendAllMessages(
        setupData: SetupData,
        channels: {
            verification: TextChannel;
            roles: TextChannel;
            informations: TextChannel;
            support: TextChannel;
            panelControle: TextChannel;
        }
    ): Promise<Partial<SetupData['messages']>> {
        const messages: Partial<SetupData['messages']> = {};

        try {
            const verificationMsg = await channels.verification.send(
                this.createVerificationMessage()
            );
            messages.verification = verificationMsg.id;

            const rolesMsg = await channels.roles.send(
                this.createRolesMessage()
            );
            messages.roles = rolesMsg.id;

            const linksMsg = await channels.informations.send(
                this.createUsefulLinksMessage()
            );
            messages.liensUtiles = linksMsg.id;

            const supportMsg = await channels.support.send(
                this.createSupportMessage()
            );
            messages.support = supportMsg.id;

            const panelMsg = await channels.panelControle.send(
                this.createControlPanelMessage()
            );
            messages.panelControle = panelMsg.id;

            return messages;
        } catch (error) {
            console.error('Erreur lors de l\'envoi des messages:', error);
            throw error;
        }
    }

    static createProgressMessage(
        step: number,
        totalSteps: number,
        stepName: string,
        status: 'pending' | 'in-progress' | 'completed' | 'error'
    ) {
        const statusEmoji = {
            pending: '⏳',
            'in-progress': '🔄',
            completed: '✅',
            error: '❌'
        };

        const statusColor = {
            pending: Colors.Grey,
            'in-progress': Colors.Blue,
            completed: Colors.Green,
            error: Colors.Red
        };

        const progressBar = this.createProgressBar(step, totalSteps);

        const embed = new EmbedBuilder()
            .setTitle(`${statusEmoji[status]} Configuration du serveur`)
            .setDescription(
                `**Étape ${step}/${totalSteps} :** ${stepName}\n\n` +
                `${progressBar}\n\n` +
                `**Progression :** ${Math.round((step / totalSteps) * 100)}%`
            )
            .setColor(statusColor[status])
            .setFooter({ text: 'Hotaru - Setup en cours' })
            .setTimestamp();

        return { embeds: [embed] };
    }

    private static createProgressBar(current: number, total: number): string {
        const barLength = 20;
        const filled = Math.round((current / total) * barLength);
        const empty = barLength - filled;

        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
    }

    static createSetupCompleteMessage(setupData: SetupData) {
        const embed = new EmbedBuilder()
            .setTitle('✅ Configuration terminée !')
            .setDescription(
                '**Le serveur a été configuré avec succès !**\n\n' +
                '**Résumé de la configuration :**\n' +
                `🎭 **Rôles créés :** ${Object.keys(setupData.roles).length}\n` +
                `📁 **Catégories créées :** ${Object.keys(setupData.categories).length}\n` +
                `💬 **Salons créés :** ${Object.keys(setupData.channels).length}\n` +
                `📨 **Messages interactifs :** ${Object.keys(setupData.messages).length}\n\n` +
                '**Configuration sauvegardée dans la base de données.**\n' +
                'Vous pouvez maintenant utiliser le serveur normalement !'
            )
            .setColor(Colors.Green)
            .setFooter({ text: 'Hotaru - Setup terminé' })
            .setTimestamp();

        return { embeds: [embed] };
    }

    static createSetupErrorMessage(error: string, step: string) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Erreur lors du setup')
            .setDescription(
                `**Une erreur s'est produite lors du setup**\n\n` +
                `**Étape :** ${step}\n` +
                `**Erreur :** ${error}\n\n` +
                `Veuillez réessayer ou contacter un développeur si le problème persiste.`
            )
            .setColor(Colors.Red)
            .setFooter({ text: 'Hotaru - Erreur' })
            .setTimestamp();

        return { embeds: [embed] };
    }

    static createChannelSetupLogsMessage(
        stats: { created: number; reused: number; total: number },
        logs: string[]
    ) {
        // Limiter les logs à 15 entrées pour ne pas dépasser la limite Discord
        const displayLogs = logs.slice(-15);
        const moreLogsCount = logs.length - displayLogs.length;

        const logsText = displayLogs.join('\n');
        const moreText = moreLogsCount > 0 ? `\n\n*... et ${moreLogsCount} autres actions*` : '';

        const embed = new EmbedBuilder()
            .setTitle('📊 Rapport de Configuration des Channels')
            .setDescription(
                `**Statistiques :**\n` +
                `➕ **Créés :** ${stats.created} channels\n` +
                `✅ **Réutilisés :** ${stats.reused} channels\n` +
                `📊 **Total :** ${stats.total} channels configurés\n\n` +
                `**Dernières actions :**\n` +
                `${logsText}${moreText}`
            )
            .setColor(stats.reused > 0 ? Colors.Blue : Colors.Green)
            .setFooter({ 
                text: stats.reused > 0 
                    ? `${stats.reused} channel(s) existant(s) réutilisé(s) - Historique préservé` 
                    : 'Tous les channels ont été créés' 
            })
            .setTimestamp();

        return { embeds: [embed] };
    }

    static createProgressMessageWithStats(
        step: number,
        totalSteps: number,
        stepName: string,
        status: 'pending' | 'in-progress' | 'completed' | 'error',
        stats?: { created: number; reused: number }
    ) {
        const statusEmoji = {
            pending: '⏳',
            'in-progress': '🔄',
            completed: '✅',
            error: '❌'
        };

        const statusColor = {
            pending: Colors.Grey,
            'in-progress': Colors.Blue,
            completed: Colors.Green,
            error: Colors.Red
        };

        const progressBar = this.createProgressBar(step, totalSteps);

        let statsText = '';
        if (stats) {
            statsText = `\n\n**Détails :**\n` +
                       `➕ ${stats.created} créé(s)\n` +
                       `✅ ${stats.reused} réutilisé(s)`;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${statusEmoji[status]} Configuration du serveur`)
            .setDescription(
                `**Étape ${step}/${totalSteps} :** ${stepName}\n\n` +
                `${progressBar}\n\n` +
                `**Progression :** ${Math.round((step / totalSteps) * 100)}%${statsText}`
            )
            .setColor(statusColor[status])
            .setFooter({ text: 'Hotaru - Setup en cours' })
            .setTimestamp();

        return { embeds: [embed] };
    }
}
