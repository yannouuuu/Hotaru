import {
    EmbedBuilder,
    Colors,
    ChannelType,
    PermissionFlagsBits,
    MessageFlags,
    type GuildTextBasedChannel
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { TicketManager } from '../../utils/TicketManager.js';
import type { SetupData } from '../../types/setup.js';

export default new Component({
    customId: 'create_ticket',
    type: 'button',

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;

        const guild = interaction.guild;
        const member = interaction.member;
        const memberId = member.id;

        const existingTicketData = TicketManager.getOpenTicketForUser(client, guild.id, memberId);
        if (existingTicketData) {
            const existingChannel = guild.channels.cache.get(existingTicketData.channelId);

            if (existingChannel && existingChannel.isTextBased()) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('❌ Ticket déjà ouvert')
                            .setDescription(`Vous avez déjà un ticket en cours : ${existingChannel}`)
                            .setColor(Colors.Red)
                            .setFooter({ text: `Ticket #${existingTicketData.number.toString().padStart(4, '0')}` })
                    ],
                    flags: [MessageFlags.Ephemeral]
                });
                return;
            }

            // Nettoyer les entrées obsolètes si le salon n'existe plus
            TicketManager.deleteTicketRecord(client, guild.id, existingTicketData.channelId);
        }

        const setupData = client.database.get(`setup_${guild.id}`) as SetupData | undefined;
        const supportRoleId = setupData?.roles?.support;
        const delegueRoleId = setupData?.roles?.delegue;
        const adminRoleId = setupData?.roles?.admin;
        const supportCategoryId = setupData?.categories?.support;
        const logChannelId = setupData?.channels?.logsBots ?? setupData?.channels?.logsModeration;

        const ticketNumber = TicketManager.allocateTicketNumber(client, guild.id);
        const paddedNumber = ticketNumber.toString().padStart(4, '0');
        const sanitizedUsername = member.user.username
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 20) || 'user';
        const channelName = `ticket-${sanitizedUsername}-${paddedNumber}`;

        const permissionOverwrites = [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: memberId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles
                ]
            }
        ];

        const staffRoleIds = [supportRoleId, delegueRoleId, adminRoleId].filter(Boolean) as string[];
        for (const roleId of staffRoleIds) {
            permissionOverwrites.push({
                id: roleId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageMessages
                ]
            });
        }

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`🎫 Création du ticket #${paddedNumber}`)
                    .setDescription('Votre ticket est en cours de création, veuillez patienter...')
                    .setColor(Colors.Blue)
            ],
            flags: [MessageFlags.Ephemeral]
        });

        let createdChannelId: string | null = null;

        try {
            const createdChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: supportCategoryId || null,
                topic: `Ticket #${paddedNumber} • ${member.user.tag}`,
                permissionOverwrites,
                reason: `Ticket de support pour ${member.user.tag}`
            });

            createdChannelId = createdChannel.id;

            if (!createdChannel.isTextBased()) {
                throw new Error('Le ticket créé n\'est pas un salon textuel.');
            }

            const ticketChannel = createdChannel as GuildTextBasedChannel;

            TicketManager.createTicket(client, {
                guildId: guild.id,
                channelId: ticketChannel.id,
                ownerId: memberId,
                number: ticketNumber
            });

            const staffMentions = staffRoleIds.map(roleId => `<@&${roleId}>`);
            const mentionParts = [member.toString(), ...staffMentions];
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`🎫 Ticket #${paddedNumber}`)
                .setDescription(
                    `Bonjour ${member} !\n\n` +
                    `Merci d\'avoir contacté le support. Un membre de l'équipe prendra en charge votre demande au plus vite.` +
                    '\n\n__Pour accélérer le traitement :__\n' +
                    '• Décrivez votre demande de manière détaillée\n' +
                    '• Ajoutez des captures ou pièces jointes si nécessaire\n' +
                    '• Mentionnez les personnes concernées si utile\n\n' +
                    `Quand tout est réglé, utilisez la commande \`/close-ticket\` pour fermer ce ticket.\n` +
                    'Un membre du support peut également le faire pour vous.'
                )
                .setColor(Colors.Blue)
                .setFooter({ text: `Ticket #${paddedNumber}` })
                .setTimestamp();

            await ticketChannel.send({
                content: mentionParts.join(' '),
                embeds: [welcomeEmbed]
            });

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('✅ Ticket créé !')
                        .setDescription(`Votre ticket #${paddedNumber} a été créé : ${ticketChannel}`)
                        .setColor(Colors.Green)
                        .setFooter({ text: 'Un membre du support vous répondra bientôt.' })
                ]
            });

            if (logChannelId) {
                const logChannel = guild.channels.cache.get(logChannelId);
                if (logChannel && logChannel.isTextBased()) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('🎫 Nouveau ticket ouvert')
                        .setColor(Colors.Blue)
                        .addFields(
                            { name: 'Ticket', value: `#${paddedNumber}`, inline: true },
                            { name: 'Auteur', value: `${member.user.tag} (${memberId})`, inline: true },
                            { name: 'Salon', value: `${ticketChannel}`, inline: false }
                        )
                        .setTimestamp();

                    try {
                        await (logChannel as GuildTextBasedChannel).send({ embeds: [logEmbed] });
                    } catch (logError) {
                        console.error('Erreur lors de l\'envoi dans le salon de logs:', logError);
                    }
                }
            }

        } catch (error) {
            console.error('Erreur lors de la création du ticket:', error);

            if (createdChannelId) {
                TicketManager.deleteTicketRecord(client, guild.id, createdChannelId);

                const createdChannel = guild.channels.cache.get(createdChannelId);
                if (createdChannel) {
                    await createdChannel.delete('Suppression du ticket suite à une erreur.').catch(() => null);
                }
            }

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Erreur')
                        .setDescription('Une erreur s\'est produite lors de la création du ticket. Merci de réessayer ou de contacter un administrateur.')
                        .setColor(Colors.Red)
                ]
            });
        }
    }
}).toJSON();
