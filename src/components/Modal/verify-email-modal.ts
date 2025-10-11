import type { DiscordBot } from '../../client/DiscordBot.js';
import { MessageFlags } from 'discord.js';
import { Component } from '../../structure/Component.js';
import { VerificationManager } from '../../utils/VerificationManager.js';
import { VerificationMessages } from '../../utils/VerificationMessages.js';

export default new Component({
    customId: 'verify_email_modal',
    type: 'modal',
    
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isModalSubmit()) return;
        if (!interaction.inCachedGuild()) return;

        // Récupérer l'email saisi
        const email = interaction.fields.getTextInputValue('email_input').trim().toLowerCase();

        // Différer la réponse car l'envoi d'email peut prendre du temps
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        // Récupérer la configuration
        const verificationConfig = client.database.get('verification_config');
        if (!verificationConfig) {
            await interaction.editReply(
                VerificationMessages.createErrorMessage(
                    '❌ Configuration manquante',
                    'Le système de vérification n\'est pas configuré.'
                )
            );
            return;
        }

        // Créer le gestionnaire de vérification
        const verificationManager = new VerificationManager(client.database, verificationConfig);

        // Demander un code de vérification
        const result = await verificationManager.requestVerification(
            interaction.member,
            email
        );

        if (!result.success) {
            // Gérer les différents types d'erreurs
            let suggestion = '';
            
            switch (result.error) {
                case 'ALREADY_VERIFIED':
                    suggestion = 'Vous êtes déjà vérifié ! Profitez du serveur.';
                    break;
                case 'INVALID_EMAIL_FORMAT':
                    suggestion = 'Vérifiez que votre email est au bon format : `prenom.nom@univ-lille.fr`';
                    break;
                case 'DOMAIN_NOT_ALLOWED':
                    suggestion = 'Utilisez votre email universitaire `@univ-lille.fr` ou `@etu.univ-lille.fr`';
                    break;
                case 'EMAIL_ALREADY_USED':
                    suggestion = 'Si ce compte vous appartient, contactez un administrateur.';
                    break;
                case 'COOLDOWN_ACTIVE':
                    suggestion = 'Patientez avant de réessayer.';
                    break;
                case 'MAX_ATTEMPTS_REACHED':
                    suggestion = 'Contactez un administrateur si vous avez besoin d\'aide.';
                    break;
                case 'EMAIL_SEND_FAILED':
                    suggestion = 'Vérifiez que votre email est correct et réessayez dans quelques minutes.';
                    break;
                default:
                    suggestion = 'Contactez un administrateur pour obtenir de l\'aide.';
            }

            await interaction.editReply(
                VerificationMessages.createErrorMessage(
                    '❌ Erreur de vérification',
                    result.message,
                    suggestion
                )
            );
            return;
        }

        // Succès ! Afficher le message de confirmation
        await interaction.editReply(
            VerificationMessages.createCodeSentMessage(email)
        );
    }
}).toJSON();
