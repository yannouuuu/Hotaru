import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import type { Command } from '../../types/index.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('refresh-ticket')
    .setDescription('Renvoyer le message de ticket dans le salon actuel')
    .setDefaultMemberPermissions('0')
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🎫 Système de tickets')
      .setDescription(
        '**Besoin d\'aide ou d\'assistance ?**\n\n' +
        'Cliquez sur le bouton ci-dessous pour ouvrir un ticket.\n' +
        'Un salon privé sera créé où vous pourrez discuter avec l\'équipe de support.\n\n' +
        '⚠️ **N\'ouvrez pas de ticket pour des questions qui peuvent être posées publiquement dans le salon d\'entraide.**'
      )
      .setFooter({ text: 'Un membre du support vous répondra dès que possible' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Ouvrir un ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await interaction.reply({
      content: '✅ Message de ticket envoyé !',
      ephemeral: true,
    });

    if (interaction.channel && 'send' in interaction.channel) {
      await (interaction.channel as TextChannel).send({ embeds: [embed], components: [row] });
    }
  },
};

export default command;

