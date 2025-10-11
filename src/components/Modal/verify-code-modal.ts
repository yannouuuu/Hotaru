import type { DiscordBot } from '../../client/DiscordBot.js';
import { MessageFlags } from 'discord.js';
import { Component } from '../../structure/Component.js';
import { VerificationManager } from '../../utils/VerificationManager.js';
import { VerificationMessages } from '../../utils/VerificationMessages.js';

export default new Component({
    customId: 'verify_code_modal',
    type: 'modal',
    
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isModalSubmit()) return;
        if (!interaction.inCachedGuild()) return;

        // Récupérer le code saisi
        const code = interaction.fields.getTextInputValue('verification_code').trim().toUpperCase();

        // Différer la réponse pour avoir le temps de traiter
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

        // Valider le code
        const result = await verificationManager.validateCode(
            interaction.member,
            code
        );

        if (!result.success) {
            // Gérer les différents types d'erreurs
            let suggestion = '';
            
            switch (result.error) {
                case 'CODE_NOT_FOUND':
                    suggestion = 'Demandez d\'abord un code de vérification.';
                    break;
                case 'CODE_INVALID':
                    suggestion = 'Vérifiez que vous avez bien copié le code depuis votre email.';
                    break;
                case 'CODE_EXPIRED':
                    suggestion = 'Demandez un nouveau code de vérification.';
                    break;
                case 'MAX_ATTEMPTS_REACHED':
                    suggestion = 'Contactez un administrateur pour obtenir de l\'aide.';
                    break;
                case 'ALREADY_VERIFIED':
                    suggestion = 'Vous êtes déjà vérifié ! Profitez du serveur.';
                    break;
                default:
                    suggestion = 'Contactez un administrateur pour obtenir de l\'aide.';
            }

            await interaction.editReply(
                VerificationMessages.createErrorMessage(
                    '❌ Code invalide',
                    result.message,
                    suggestion
                )
            );
            return;
        }

        // Succès ! Afficher le message de réussite
        await interaction.editReply(
            VerificationMessages.createVerificationSuccessMessage()
        );
    }
}).toJSON();