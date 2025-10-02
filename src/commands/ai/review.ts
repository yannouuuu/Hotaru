import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { askAI } from '../../utils/openrouter.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ai-review')
    .setDescription('Fait une relecture de code et suggère des améliorations')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Le code à analyser')
        .setRequired(true)
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const code = interaction.options.getString('code', true);

      const systemPrompt = `Tu es un expert en revue de code qui fournit des critiques constructives en français.
Analyse le code et fournis:
- Points positifs
- Points à améliorer
- Suggestions concrètes
- Bonnes pratiques recommandées
Sois concis et pratique.`;

      const prompt = `Fais une revue de ce code:\n\`\`\`\n${code}\n\`\`\``;

      const review = await askAI(prompt, systemPrompt);

      const truncatedReview = review.length > 1900 
        ? review.substring(0, 1900) + '...\n\n*(Réponse tronquée)*'
        : review;

      await interaction.editReply({
        content: `**🔍 Revue de code:**\n\n${truncatedReview}`,
        allowedMentions: { parse: [] } // Bloque toutes les mentions
      });

    } catch (error) {
      console.error('Erreur lors de la revue de code:', error);
      await interaction.editReply({
        content: `❌ Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  },
};

export default command;

