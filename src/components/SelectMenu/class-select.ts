import { MessageFlags } from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { SetupManager } from '../../utils/SetupManager.js';
import { SetupMessages } from '../../utils/SetupMessages.js';

export default new Component({
    customId: 'class_select',
    type: 'select',

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isStringSelectMenu()) return;
        if (!interaction.inCachedGuild()) return;

        const promo = SetupManager.getPromoConfig(client, interaction.guildId);
        if (!promo?.mode) {
            await interaction.reply({
                content: '❌ Le mode promotion n\'est pas activé sur ce serveur.',
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const groupKey = interaction.values[0];

        // Vérifier si l'utilisateur a déjà un groupe
        const verified: any = client.database.get(`verification_${interaction.guildId}.verifiedUsers.${interaction.user.id}`);
        const previousGroupId: string | undefined = verified?.groupId;

        if (previousGroupId && previousGroupId !== groupKey) {
            // Retirer l'ancien rôle de groupe
            const previousGroup = promo.groups[previousGroupId];
            if (previousGroup && interaction.member.roles.cache.has(previousGroup.roleId)) {
                await interaction.member.roles.remove(previousGroup.roleId).catch(() => undefined);
            }
        }

        const result = await SetupManager.assignGroupToUser(client, interaction.member, groupKey);

        if (!result.success) {
            await interaction.reply({
                content: result.message,
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        await interaction.reply(
            SetupMessages.createClassAssignedMessage(promo.groups[groupKey].name, result.unlockedChannels ?? [])
        );
    }
}).toJSON();
