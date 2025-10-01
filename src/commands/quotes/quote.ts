import { SlashCommandBuilder, ChatInputCommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import type { Command } from '../../types/index.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Ajouter une citation d\'un professeur')
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('quote_modal')
      .setTitle('Ajouter une citation');

    const quoteInput = new TextInputBuilder()
      .setCustomId('quote_text')
      .setLabel('Citation')
      .setPlaceholder('Entrez la citation du professeur...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(500);

    const professorInput = new TextInputBuilder()
      .setCustomId('professor_name')
      .setLabel('Nom du professeur')
      .setPlaceholder('Ex: M. Dupont')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(100);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(quoteInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(professorInput);
    
    modal.addComponents(firstRow, secondRow);

    await interaction.showModal(modal);
  },
};

export default command;

