import { ActionRowBuilder, Colors, EmbedBuilder, StringSelectMenuBuilder, type Snowflake } from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

const truncate = (text: string, max: number): string =>
    text.length > max ? `${text.slice(0, max - 1)}…` : text;

export default new Component({
    customId: 'prof-panel_vote',
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

        const guildId = interaction.guildId;
        const weekly = manager.getCurrentWeekLeaderboard(guildId);

        if (weekly.votes[interaction.user.id as Snowflake]) {
            await interaction.reply({
                content: '✅ Tu as déjà voté cette semaine. Reviens dimanche prochain !',
                ephemeral: true
            });
            return;
        }

        const professors = manager.listProfessors(guildId)
            .filter((prof) => prof.active)
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
            .slice(0, 25);

        if (professors.length === 0) {
            await interaction.reply({
                content: 'ℹ️ Aucun professeur n\'est enregistré pour le moment. Parle-en à un admin !',
                ephemeral: true
            });
            return;
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('prof-panel_vote-select')
            .setPlaceholder('Choisis jusqu\'à 3 professeurs')
            .setMinValues(1)
            .setMaxValues(Math.min(3, professors.length))
            .addOptions(
                professors.map((prof) => ({
                    label: truncate(prof.emoji ? `${prof.emoji} ${prof.name}` : prof.name, 100),
                    value: prof.id,
                    description: prof.bio ? truncate(prof.bio, 100) : undefined
                }))
            );

        const embed = new EmbedBuilder()
            .setTitle('🗳️ Vote hebdomadaire')
            .setDescription(
                'Sélectionne jusqu\'à **3 professeurs** dans la liste.\n' +
                'Ton premier choix vaut **3 points**, le second **2**, le troisième **1**.'
            )
            .setColor(Colors.Gold);

        await interaction.reply({
            embeds: [embed],
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
            ephemeral: true
        });
    }
}).toJSON();
