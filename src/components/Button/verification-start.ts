import {
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

export default new Component({
    customId: 'verification_start',
    type: 'button',
    
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;

        // Vérifier si l'utilisateur est déjà vérifié
        const setupData = client.database.get(`setup_${interaction.guildId}`);
        if (!setupData?.roles?.verifie) {
            await interaction.reply({
                content: '❌ La vérification n\'est pas configurée sur ce serveur.',
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const member = interaction.member;
        if (member.roles.cache.has(setupData.roles.verifie)) {
            await interaction.reply({
                content: '✅ Vous êtes déjà vérifié(e) !',
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // Créer un modal pour demander l'email
        const modal = new ModalBuilder()
            .setCustomId('verify_email_modal')
            .setTitle('🎓 Vérification Étudiante');

        const emailInput = new TextInputBuilder()
            .setCustomId('email_input')
            .setLabel('Adresse email étudiante')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('prenom.nom.etu@univ-lille.fr')
            .setRequired(true)
            .setMaxLength(100);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
}).toJSON();