import {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { SetupManager } from '../../utils/SetupManager.js';

export default new Component({
    customId: 'class_choose',
    type: 'button',

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;

        const promo = SetupManager.getPromoConfig(client, interaction.guildId);
        if (!promo?.mode) {
            await interaction.reply({
                content: '❌ Le mode promotion n\'est pas activé sur ce serveur.',
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const revealedGroups = SetupManager.getRevealedGroups(client, interaction.guildId);

        if (revealedGroups.length === 0) {
            await interaction.reply({
                content: '🚫 Aucun groupe n\'est disponible pour le moment. Revenez plus tard !',
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('class_select')
            .setPlaceholder('🎓 Sélectionnez votre groupe')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                revealedGroups.map(group => {
                    const option = new StringSelectMenuOptionBuilder()
                        .setLabel(group.name)
                        .setDescription(`Salon privé du groupe ${group.key}`)
                        .setValue(group.key);
                    return option;
                })
            );

        await interaction.reply({
            content: '**📚 Choisis ton groupe de TD :**',
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
            flags: [MessageFlags.Ephemeral]
        });
    }
}).toJSON();
