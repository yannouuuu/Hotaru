import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { universityData } from '../../utils/universityData.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('links')
    .setDescription('Afficher tous les liens utiles de l\'Université de Lille')
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x00b894)
      .setTitle('🔗 Liens utiles - Université de Lille')
      .setDescription('Voici tous les liens importants pour votre parcours au BUT Informatique :')
      .addFields(
        universityData.links.map(link => ({
          name: `${link.name}`,
          value: `[${link.description}](${link.url})`,
          inline: false
        }))
      )
      .setFooter({ text: '💡 Ajoutez ces liens à vos favoris !' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;

