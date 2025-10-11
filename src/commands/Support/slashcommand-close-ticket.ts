import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    Colors,
    type GuildTextBasedChannel,
    type TextChannel
} from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import { TicketManager } from '../../utils/TicketManager.js';
import type { SetupData } from '../../types/setup.js';

export default new ApplicationCommand({
    command: {
        name: 'close-ticket',
        description: 'Ferme le ticket de support actuel.',
        type: ApplicationCommandType.ChatInput,
        dmPermission: false,
        options: [
            {
                name: 'raison',
                description: 'Expliquez pourquoi le ticket est fermé.',
                type: ApplicationCommandOptionType.String,
                required: false,
                maxLength: 512
            }
        ]
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) {
            await interaction.reply({
                content: 'Cette commande ne peut être utilisée que dans un serveur.',
                ephemeral: true
            });
            return;
        }

        const guild = interaction.guild;
        const channel = interaction.channel;

        if (!channel || channel.type !== ChannelType.GuildText) {
            await interaction.reply({
                content: 'Cette commande doit être exécutée dans un salon de ticket.',
                ephemeral: true
            });
            return;
        }

        const ticket = TicketManager.getTicketByChannel(client, guild.id, channel.id);
        if (!ticket || ticket.status !== 'open') {
            await interaction.reply({
                content: 'Ce salon n\'est associé à aucun ticket actif.',
                ephemeral: true
            });
            return;
        }

        const setupData = client.database.get(`setup_${guild.id}`) as SetupData | undefined;
        const supportRoleId = setupData?.roles?.support;
        const adminRoleId = setupData?.roles?.admin;

        const member = interaction.member;
        const hasSupportRole = supportRoleId ? member.roles.cache.has(supportRoleId) : false;
        const hasAdminRole = adminRoleId ? member.roles.cache.has(adminRoleId) : false;
        const hasManageChannels = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ?? false;
        const isOwner = ticket.ownerId === interaction.user.id;

        if (!isOwner && !hasSupportRole && !hasAdminRole && !hasManageChannels) {
            await interaction.reply({
                content: 'Vous n\'avez pas la permission de fermer ce ticket.',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const reason = interaction.options.getString('raison')?.trim() || null;

        const closedTicket = TicketManager.closeTicket(client, guild.id, channel.id, {
            closedById: interaction.user.id,
            reason: reason ?? undefined
        });

        if (!closedTicket) {
            await interaction.editReply({
                content: 'Impossible de fermer ce ticket. Veuillez réessayer plus tard.'
            });
            return;
        }

    const ticketChannel = channel as TextChannel;

        const closeEmbed = new EmbedBuilder()
            .setTitle(`🔒 Ticket #${closedTicket.number.toString().padStart(4, '0')} fermé`)
            .setDescription(
                `Ticket fermé par ${interaction.user}.

` +
                `**Raison :** ${reason ?? 'Non spécifiée'}`
            )
            .setColor(Colors.Orange)
            .setTimestamp();

        if (ticket.ownerId) {
            try {
                await ticketChannel.permissionOverwrites.edit(ticket.ownerId, {
                    SendMessages: false,
                    AttachFiles: false
                });
            } catch (overwriteError) {
                console.error('Impossible de mettre à jour les permissions du ticket lors de la fermeture :', overwriteError);
            }
        }

        try {
            await ticketChannel.send({ embeds: [closeEmbed] });
        } catch (sendError) {
            console.error('Erreur lors de l\'envoi du message de fermeture :', sendError);
        }

        const logChannelId = setupData?.channels?.logsBots ?? setupData?.channels?.logsModeration;
        if (logChannelId) {
            const logChannel = guild.channels.cache.get(logChannelId);
            if (logChannel && logChannel.isTextBased()) {
                const ownerMember = await guild.members.fetch(ticket.ownerId).catch(() => null);
                const logEmbed = new EmbedBuilder()
                    .setTitle('🔒 Ticket fermé')
                    .setColor(Colors.Red)
                    .addFields(
                        { name: 'Ticket', value: `#${closedTicket.number.toString().padStart(4, '0')}`, inline: true },
                        { name: 'Auteur', value: ownerMember ? `${ownerMember.user.tag} (${ticket.ownerId})` : ticket.ownerId, inline: true },
                        { name: 'Fermé par', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Raison', value: reason ?? 'Non spécifiée', inline: false }
                    )
                    .setTimestamp();

                try {
                    await (logChannel as GuildTextBasedChannel).send({ embeds: [logEmbed] });
                } catch (logError) {
                    console.error('Erreur lors de l\'envoi du log de fermeture :', logError);
                }
            }
        }

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('✅ Ticket fermé')
                    .setDescription('Le ticket sera supprimé dans quelques secondes.')
                    .addFields({ name: 'Raison', value: reason ?? 'Non spécifiée', inline: false })
                    .setColor(Colors.Green)
            ]
        });

        setTimeout(() => {
            if (ticketChannel.deletable) {
                ticketChannel.delete(`Ticket fermé par ${interaction.user.tag}`).catch((deleteError) => {
                    console.error('Impossible de supprimer le ticket fermé :', deleteError);
                });
            }
        }, 10_000);
    }
}).toJSON();
