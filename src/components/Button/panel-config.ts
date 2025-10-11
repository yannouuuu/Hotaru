import {
    EmbedBuilder,
    Colors,
    MessageFlags
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import type { SetupData } from '../../types/setup.js';

export default new Component({
    customId: 'panel_config',
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

        // Créer la liste des rôles
        const rolesText = Object.entries(setupData.roles)
            .map(([key, roleId]) => {
                const role = guild.roles.cache.get(roleId);
                return `• **${key}** : ${role || '❌ Introuvable'}`;
            })
            .join('\n');

        // Créer la liste des catégories
        const categoriesText = Object.entries(setupData.categories)
            .map(([key, catId]) => {
                const category = guild.channels.cache.get(catId);
                return `• **${key}** : ${category?.name || '❌ Introuvable'}`;
            })
            .join('\n');

        const configEmbed = new EmbedBuilder()
            .setTitle('⚙️ Configuration actuelle')
            .setDescription('**Configuration complète du serveur**')
            .addFields(
                {
                    name: `🎭 Rôles (${Object.keys(setupData.roles).length})`,
                    value: rolesText.length > 1024 ? rolesText.substring(0, 1020) + '...' : rolesText
                },
                {
                    name: `📁 Catégories (${Object.keys(setupData.categories).length})`,
                    value: categoriesText.length > 1024 ? categoriesText.substring(0, 1020) + '...' : categoriesText
                },
                {
                    name: '📊 Statistiques',
                    value: `Salons : **${Object.keys(setupData.channels).length}**\nMessages : **${Object.keys(setupData.messages).length}**`
                }
            )
            .setColor(Colors.Blue)
            .setFooter({ text: `Configuration du ${new Date(setupData.setupDate).toLocaleDateString('fr-FR')}` })
            .setTimestamp();

        await interaction.reply({
            embeds: [configEmbed],
            flags: [MessageFlags.Ephemeral]
        });
    }
}).toJSON();
