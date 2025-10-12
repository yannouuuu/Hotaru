import { PermissionFlagsBits } from 'discord.js';
import { Event } from '../../structure/Event.js';
import { SetupManager } from '../../utils/SetupManager.js';

const READ_ONLY_KEYS = ['rankingProfs', 'sondages', 'roles', 'informations'] as const;
const LINK_ONLY_KEYS = ['liensUtiles'] as const;
const URL_PATTERN = /^(https?:\/\/|www\.)\S+$/i;

export default new Event({
    event: 'messageCreate',
    async run(__client__, message) {
        if (!message.inGuild() || message.author.bot || message.system) {
            return;
        }

        const setupData = SetupManager.getSetupData(__client__, message.guild.id);
        const channels = setupData?.channels;
        if (!channels) {
            return;
        }

        const channelsMap = channels as Record<string, string>;

        const readOnlyIds = new Set<string>();
        for (const key of READ_ONLY_KEYS) {
            const channelId = channelsMap[key];
            if (channelId) {
                readOnlyIds.add(channelId);
            }
        }

        const linkOnlyIds = new Set<string>();
        for (const key of LINK_ONLY_KEYS) {
            const channelId = channelsMap[key];
            if (channelId) {
                linkOnlyIds.add(channelId);
            }
        }

        const member = message.member;
        if (member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return;
        }

        const sendNotice = async (notice: string) => {
            if (message.author.bot) {
                return;
            }

            try {
                await message.author.send({
                    content: `${notice}\nSalon: #${message.channel.name}`
                });
            } catch {
                // DM impossible (paramètres de confidentialité)
            }
        };

        if (readOnlyIds.has(message.channelId)) {
            if (message.deletable) {
                await message.delete().catch(() => undefined);
            }

            await sendNotice('Ce salon est réservé aux annonces automatiques, ton message a été supprimé.');
            return;
        }

        if (!linkOnlyIds.has(message.channelId)) {
            return;
        }

        const tokens = message.content
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(token => token.replace(/^<|>$/g, ''));

        const hasOnlyLinks = tokens.length > 0 && tokens.every(token => URL_PATTERN.test(token));

        if (hasOnlyLinks) {
            return;
        }

        if (message.deletable) {
            await message.delete().catch(() => undefined);
        }

        await sendNotice('Merci de ne partager que des liens dans ce salon.');
    }
}).toJSON();
