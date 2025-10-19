import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Event } from '../../structure/Event.js';
import { SetupManager } from '../../utils/SetupManager.js';

const READ_ONLY_KEYS = ['rankingProfs', 'roles', 'informations'] as const;
const LINK_ONLY_KEYS = ['liensUtiles'] as const;
const POLL_ONLY_KEYS = ['sondages'] as const;
const MEDIA_ONLY_KEYS = ['pictures'] as const;
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

        const pollOnlyIds = new Set<string>();
        for (const key of POLL_ONLY_KEYS) {
            const channelId = channelsMap[key];
            if (channelId) {
                pollOnlyIds.add(channelId);
            }
        }

        const mediaOnlyIds = new Set<string>();
        for (const key of MEDIA_ONLY_KEYS) {
            const channelId = channelsMap[key];
            if (channelId) {
                mediaOnlyIds.add(channelId);
            }
        }

        const member = message.member;
        const canModerate = member?.permissions.has(PermissionFlagsBits.ManageMessages) ?? false;
        const annoncesId = channelsMap.annonces;

        if (annoncesId && message.channelId === annoncesId) {
            const isAdmin = member?.permissions.has(PermissionFlagsBits.ManageGuild) ?? false;

            if (isAdmin) {
                const files = Array.from(message.attachments.values()).map(attachment => ({
                    attachment: attachment.url,
                    name: attachment.name ?? 'attachment'
                }));

                const baseContent = message.content?.trim();
                const forwardedContent = baseContent && baseContent.length > 0
                    ? `@everyone\n${baseContent}`
                    : '@everyone';

                const embeds = message.embeds.length
                    ? message.embeds.map(embed => EmbedBuilder.from(embed).toJSON())
                    : undefined;

                await message.channel.send({
                    content: forwardedContent,
                    embeds,
                    files: files.length ? files : undefined,
                    allowedMentions: { parse: ['everyone'] }
                }).catch(() => undefined);

                if (message.deletable) {
                    await message.delete().catch(() => undefined);
                }

                return;
            }
        }

        const sendNotice = async (notice: string) => {
            if (message.author.bot) {
                return;
            }

            try {
                const warningMessage = await message.channel.send({
                    content: `${message.author} ${notice}`
                });

                setTimeout(() => {
                    warningMessage.delete().catch(() => {});
                }, 5000);
            } catch (error) {
                console.error('Erreur envoi warning dans channel:', error);
                // Fallback MP seulement si channel.send échoue vraiment
                try {
                    await message.author.send({
                        content: `${notice}\nSalon: #${message.channel.name}`
                    });
                } catch {
                }
            }
        };

        if (readOnlyIds.has(message.channelId)) {
            if (canModerate) {
                return;
            }
            if (message.deletable) {
                await message.delete().catch(() => undefined);
            }

            await sendNotice('Ce salon est réservé aux annonces automatiques, ton message a été supprimé.');
            return;
        }

        if (pollOnlyIds.has(message.channelId)) {
            const isPoll = (message.components && message.components.length > 0) ||
                          message.system;

            if (isPoll || canModerate) {
                return;
            }

            if (message.deletable) {
                await message.delete().catch(() => undefined);
            }

            await sendNotice('Ce salon est réservé aux sondages. Utilise les boutons de sondage de Discord !');
            return;
        }

        if (mediaOnlyIds.has(message.channelId)) {
            const hasMedia = message.attachments.size > 0 ||
                           message.embeds.some(embed => embed.image || embed.video);

            if (hasMedia || canModerate) {
                return;
            }

            if (message.deletable) {
                await message.delete().catch(() => undefined);
            }

            await sendNotice('Ce salon est réservé aux images et médias. Partage seulement des photos/vidéos !');
            return;
        }

        if (!linkOnlyIds.has(message.channelId)) {
            return;
        }

        if (canModerate) {
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
