import {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

export default new Component({
    customId: 'verify_code_input',
    type: 'button',
    
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;

        // Le modal se chargera de vérifier si le code est valide
        // Pas besoin de vérifier ici car cela peut créer de la confusion

        // Créer un modal pour la saisie du code
        const modal = new ModalBuilder()
            .setCustomId('verify_code_modal')
            .setTitle('🔑 Code de Vérification');

        const codeInput = new TextInputBuilder()
            .setCustomId('verification_code')
            .setLabel('Code de vérification')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('ABC12345')
            .setRequired(true)
            .setMinLength(8)
            .setMaxLength(8);

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(codeInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
}).toJSON();