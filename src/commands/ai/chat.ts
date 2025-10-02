import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { askAI } from '../../utils/openrouter.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ai-chat')
    .setDescription('Discute avec l\'IA de manière naturelle')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Votre message pour l\'IA')
        .setRequired(true)
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const userMessage = interaction.options.getString('message', true);

      const systemPrompt = `Tu es un assistant IA amical et serviable qui répond en français.
Tu aides les étudiants en informatique avec leurs questions diverses.
Sois clair, concis et pédagogique dans tes réponses.`;

      const response = await askAI(userMessage, systemPrompt);

      // Limiter la réponse à 1900 caractères pour respecter la limite de Discord
      const truncatedResponse = response.length > 1900 
        ? response.substring(0, 1900) + '...\n\n*(Réponse tronquée)*'
        : response;

      await interaction.editReply({
        content: `**💬 ${interaction.user.username} :** ${userMessage}\n\n**🤖 IA :**\n${truncatedResponse}`,
        allowedMentions: { parse: [] } // Bloque toutes les mentions
      });

    } catch (error) {
      console.error('Erreur lors de la discussion avec l\'IA:', error);
      await interaction.editReply({
        content: `❌ Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  },
};

export default command;

