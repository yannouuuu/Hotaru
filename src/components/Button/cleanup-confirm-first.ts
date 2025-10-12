import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

export default new Component({
    customId: 'cleanup_confirm_first',
    type: 'button',

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;

        // Second avertissement encore plus explicite
        const secondWarningEmbed = new EmbedBuilder()
            .setTitle('🚨 DERNIÈRE CONFIRMATION - SUPPRESSION DÉFINITIVE')
            .setDescription(
                '**ATTENTION ! VOUS ÊTES À UN CLIC DE TOUT SUPPRIMER !**\n\n' +
                '**Cette action va :**\n' +
                '1️⃣ Supprimer TOUS les salons créés par le setup\n' +
                '2️⃣ Supprimer TOUTES les catégories\n' +
                '3️⃣ Supprimer TOUS les rôles (sauf @everyone)\n' +
                '4️⃣ Supprimer TOUTES les données de la base de données\n\n' +
                '🚨 **IL N\'Y AURA AUCUN MOYEN DE REVENIR EN ARRIÈRE !**\n\n' +
                'Tapez le nom du serveur pour confirmer, ou annulez maintenant.'
            )
            .setColor(Colors.Red)
            .setFooter({ text: 'Hotaru - Confirmation finale requise' })
            .setTimestamp();

        const finalButtons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cleanup_execute')
                    .setLabel('🗑️ SUPPRIMER DÉFINITIVEMENT')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cleanup_cancel')
                    .setLabel('❌ Annuler')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({
            embeds: [secondWarningEmbed],
            components: [finalButtons]
        });
    }
}).toJSON();
