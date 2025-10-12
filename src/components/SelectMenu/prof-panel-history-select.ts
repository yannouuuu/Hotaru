import { ActionRowBuilder, Colors, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

export default new Component({
    customId: 'prof-panel_history-select',
    type: 'select',
    options: {
        public: false
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isStringSelectMenu()) return;

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

        const professorId = interaction.values[0];
        const professor = manager.listProfessors(interaction.guildId, true).find((prof) => prof.id === professorId);

        if (!professor) {
            await interaction.update({
                content: '❌ Professeur introuvable.',
                components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(StringSelectMenuBuilder.from(interaction.component))],
                embeds: []
            });
            return;
        }

        const history = manager.getProfessorHistory(interaction.guildId, professorId, 8);

        const description = history.length
            ? history.map((entry) => {
                const rank = entry.rankings.find((item) => item.professorId === professorId);
                if (!rank) {
                    return `${entry.weekKey} — 0 pt`;
                }
                return `${entry.weekKey} — ${rank.points} pts (rang ${rank.rank})`;
            }).join('\n')
            : 'Aucun vote récent pour ce professeur.';

        const embed = new EmbedBuilder()
            .setTitle(`📈 Historique de ${professor.name}`)
            .setDescription(description)
            .setColor(Colors.DarkGold)
            .setFooter({ text: `Derniers ${history.length || 0} résultats` });

        await interaction.update({
            embeds: [embed],
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(StringSelectMenuBuilder.from(interaction.component))]
        });
    }
}).toJSON();
