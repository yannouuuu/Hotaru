import {
    EmbedBuilder,
    Colors,
    MessageFlags
} from 'discord.js';
import { Component } from '../../structure/Component.js';
import type { DiscordBot } from '../../client/DiscordBot.js';

export default new Component({
    customId: 'role_jobs',
    type: 'button',

    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;

        const member = interaction.member;
        const roleId = client.database.get(`setup_${interaction.guildId}`)?.roles?.jobs;

        if (!roleId) {
            await interaction.reply({
                content: '❌ Le rôle Jobs n\'a pas été trouvé dans la configuration.',
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
            await interaction.reply({
                content: '❌ Le rôle Jobs n\'existe plus sur ce serveur.',
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // Vérifier si le membre a déjà le rôle
        if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('💼 Rôle retiré')
                        .setDescription(`Le rôle ${role} vous a été retiré.\n\nVous n'aurez plus accès au salon des offres d'emploi.`)
                        .setColor(Colors.Orange)
                ],
                flags: [MessageFlags.Ephemeral]
            });
        } else {
            await member.roles.add(roleId);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('💼 Rôle attribué')
                        .setDescription(`Le rôle ${role} vous a été attribué !\n\nVous avez maintenant accès au salon des offres d'emploi.`)
                        .setColor(Colors.Green)
                ],
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
}).toJSON();
