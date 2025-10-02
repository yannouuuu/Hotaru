import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { askAI } from '../../utils/openrouter.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ai-explain')
    .setDescription('Explique un code source avec l\'aide de l\'IA')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Le code à expliquer')
        .setRequired(true)
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const code = interaction.options.getString('code', true);

      const systemPrompt = `Tu es un assistant technique qui explique du code de manière claire et pédagogique en français. 
Fournis une explication structurée avec:
- Ce que fait le code
- Comment il fonctionne
- Les concepts clés utilisés
- Des conseils si pertinent`;

      const prompt = `Explique ce code:\n\`\`\`\n${code}\n\`\`\``;

      const explanation = await askAI(prompt, systemPrompt);

      // Limiter la réponse à 2000 caractères (limite Discord)
      const truncatedExplanation = explanation.length > 1900 
        ? explanation.substring(0, 1900) + '...\n\n*(Réponse tronquée)*'
        : explanation;

      await interaction.editReply({
        content: `**🤖 Explication du code:**\n\n${truncatedExplanation}`,
        allowedMentions: { parse: [] } // Bloque toutes les mentions
      });

    } catch (error) {
      console.error('Erreur lors de l\'explication du code:', error);
      await interaction.editReply({
        content: `❌ Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  },
};

export default command;

