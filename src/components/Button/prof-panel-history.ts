import { ActionRowBuilder, Colors, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

const truncate = (text: string, max: number): string =>
    text.length > max ? `${text.slice(0, max - 1)}…` : text;

export default new Component({
    customId: 'prof-panel_history',
    type: 'button',
    options: {
        public: false
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;

        if (!interaction.inCachedGuild() || !interaction.guildId) {
            await interaction.reply({
                content: '❌ Cette action n\'est disponible que sur un serveur.',
                ephemeral: true
            });
            return;
        }

        const manager = client.professorRankingManager;
        if (!manager) {
            await interaction.reply({
                content: '❌ Le système de classement est indisponible pour le moment.',
                ephemeral: true
            });
            return;
        }

        const professors = manager.listProfessors(interaction.guildId, true)
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
            .slice(0, 25);

        if (professors.length === 0) {
            await interaction.reply({
                content: 'ℹ️ Aucun professeur enregistré pour le moment.',
                ephemeral: true
            });
            return;
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('prof-panel_history-select')
            .setPlaceholder('Choisis un professeur')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                professors.map((prof) => ({
                    label: truncate(prof.emoji ? `${prof.emoji} ${prof.name}` : prof.name, 100),
                    value: prof.id,
                    description: prof.active ? undefined : 'Archivé'
                }))
            );

        const embed = new EmbedBuilder()
            .setTitle('📈 Historique d\'un professeur')
            .setDescription('Sélectionne un professeur pour voir son évolution sur les dernières semaines.')
            .setColor(Colors.DarkGold);

        await interaction.reply({
            embeds: [embed],
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
            ephemeral: true
        });
    }
}).toJSON();
