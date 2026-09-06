import { Event } from '../../structure/Event.js';
import type { GuildMember } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { SetupManager } from '../../utils/SetupManager.js';

export default new Event({
    event: 'guildMemberAdd',
    once: false,
    async run(client: DiscordBot, member: GuildMember) {
        if (member.user.bot) return;

        const promo = SetupManager.getPromoConfig(client, member.guild.id);
        if (!promo?.mode) return;

        const verified: any = client.database.get(`verification_${member.guild.id}.verifiedUsers.${member.id}`);
        if (!verified?.groupId) return;

        try {
            await SetupManager.unlockDueChannels(client, member.guild.id, verified.groupId);
        } catch (error) {
            console.error('Erreur lors du déblocage des salons promo:', error);
        }
    }
}).toJSON();
