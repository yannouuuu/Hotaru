import {
    EmbedBuilder,
    Colors,
    TextChannel,
    MessageFlags
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { SetupMessages } from '../../utils/SetupMessages.js';
import type { SetupData } from '../../types/setup.js';

export default new Component({
    customId: 'panel_refresh',
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

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('🔄 Rafraîchissement en cours...')
                    .setDescription('Les messages interactifs sont en cours de rafraîchissement...')
                    .setColor(Colors.Blue)
            ],
            flags: [MessageFlags.Ephemeral]
        });

        try {
            const guild = interaction.guild;
            const setupData = client.database.get(`setup_${guild.id}`) as SetupData;

            if (!setupData) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('❌ Erreur')
                            .setDescription('Aucune configuration trouvée pour ce serveur.')
                            .setColor(Colors.Red)
                    ]
                });
                return;
            }

            // Supprimer les anciens messages
            for (const [key, messageId] of Object.entries(setupData.messages)) {
                try {
                    const channelId = setupData.channels[key as keyof SetupData['channels']];
                    const channel = guild.channels.cache.get(channelId) as TextChannel;
                    if (channel) {
                        const message = await channel.messages.fetch(messageId).catch(() => null);
                        if (message) {
                            await message.delete();
                        }
                    }
                } catch (error) {
                    console.error(`Erreur lors de la suppression du message ${key}:`, error);
                }
            }

            // Recréer les messages
            const verificationChannel = guild.channels.cache.get(setupData.channels.verification) as TextChannel;
            const rolesChannel = guild.channels.cache.get(setupData.channels.roles) as TextChannel;
            const informationsChannel = guild.channels.cache.get(setupData.channels.informations) as TextChannel;
            const supportChannel = guild.channels.cache.get(setupData.channels.support) as TextChannel;
            const panelControleChannel = guild.channels.cache.get(setupData.channels.panelControle) as TextChannel;

            const newMessages = await SetupMessages.sendAllMessages(
                setupData,
                {
                    verification: verificationChannel,
                    roles: rolesChannel,
                    informations: informationsChannel,
                    support: supportChannel,
                    panelControle: panelControleChannel
                }
            );

            // Mettre à jour la base de données
            setupData.messages = newMessages as any;
            client.database.set(`setup_${guild.id}`, setupData);

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('✅ Rafraîchissement terminé')
                        .setDescription('Tous les messages interactifs ont été rafraîchis avec succès !')
                        .setColor(Colors.Green)
                ]
            });

        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Erreur')
                        .setDescription('Une erreur s\'est produite lors du rafraîchissement des messages.')
                        .setColor(Colors.Red)
                ]
            });
        }
    }
}).toJSON();
