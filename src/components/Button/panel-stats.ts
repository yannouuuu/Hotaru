import {
    EmbedBuilder,
    Colors,
    MessageFlags
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import type { SetupData } from '../../types/setup.js';

export default new Component({
    customId: 'panel_stats',
    type: 'button',

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;

        // Vérifier les permissions
        if (!interaction.member.permissions.has('Administrator')) {
            await interaction.reply({
                content: '❌ Seuls les administrateurs peuvent utiliser cette fonctionnalité.',
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const guild = interaction.guild;
        const setupData = client.database.get(`setup_${guild.id}`) as SetupData;

        if (!setupData) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Erreur')
                        .setDescription('Aucune configuration trouvée pour ce serveur.')
                        .setColor(Colors.Red)
                ],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // Calculer les statistiques
        const totalMembers = guild.memberCount;
        const totalChannels = guild.channels.cache.size;
        const totalRoles = guild.roles.cache.size;
        const setupDate = new Date(setupData.setupDate);

        // Compter les membres avec certains rôles
        const verifiedRole = guild.roles.cache.get(setupData.roles.verifie);
        const verifiedCount = verifiedRole ? verifiedRole.members.size : 0;

        const statsEmbed = new EmbedBuilder()
            .setTitle('📊 Statistiques du serveur')
            .setDescription('**Statistiques globales et de configuration**')
            .addFields(
                {
                    name: '👥 Membres',
                    value: `Total : **${totalMembers}**\nVérifiés : **${verifiedCount}**`,
                    inline: true
                },
                {
                    name: '💬 Salons',
                    value: `Total : **${totalChannels}**\nSetup : **${Object.keys(setupData.channels).length}**`,
                    inline: true
                },
                {
                    name: '🎭 Rôles',
                    value: `Total : **${totalRoles}**\nSetup : **${Object.keys(setupData.roles).length}**`,
                    inline: true
                },
                {
                    name: '📁 Catégories',
                    value: `Setup : **${Object.keys(setupData.categories).length}**`,
                    inline: true
                },
                {
                    name: '📨 Messages',
                    value: `Interactifs : **${Object.keys(setupData.messages).length}**`,
                    inline: true
                },
                {
                    name: '📅 Configuration',
                    value: `Date : **${setupDate.toLocaleDateString('fr-FR')}**`,
                    inline: true
                }
            )
            .setColor(Colors.Blue)
            .setFooter({ text: 'Hotaru - Statistiques' })
            .setTimestamp();

        await interaction.reply({
            embeds: [statsEmbed],
            flags: [MessageFlags.Ephemeral]
        });
    }
}).toJSON();
