import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { askAI } from '../../utils/openrouter.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('summarize')
    .setDescription('Résume un article ou une documentation (par URL)')
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('URL de l\'article ou documentation à résumer')
        .setRequired(true)
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const url = interaction.options.getString('url', true);

      // Valider que c'est une URL
      try {
        new URL(url);
      } catch {
        await interaction.editReply({
          content: '❌ L\'URL fournie n\'est pas valide.'
        });
        return;
      }

      // Récupérer le contenu de la page
      const response = await fetch(url);
      if (!response.ok) {
        await interaction.editReply({
          content: `❌ Impossible d'accéder à l'URL (code ${response.status})`
        });
        return;
      }

      const html = await response.text();
      
      // Extraire le texte brut (simpliste, mais fonctionnel)
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 8000); // Limiter pour ne pas dépasser les limites de l'API

      if (textContent.length < 100) {
        await interaction.editReply({
          content: '❌ Le contenu de la page est trop court ou inaccessible.'
        });
        return;
      }

      const systemPrompt = `Tu es un assistant qui résume des articles et documentations techniques en français.
Fournis un résumé structuré avec:
- Le sujet principal
- Les points clés
- Les concepts importants
- Une conclusion
Sois concis mais complet.`;

      const prompt = `Résume cet article:\n\n${textContent}`;

      const summary = await askAI(prompt, systemPrompt);

      const truncatedSummary = summary.length > 1800 
        ? summary.substring(0, 1800) + '...\n\n*(Réponse tronquée)*'
        : summary;

      await interaction.editReply({
        content: `**📄 Résumé de:** ${url}\n\n${truncatedSummary}`,
        allowedMentions: { parse: [] } // Bloque toutes les mentions
      });

    } catch (error) {
      console.error('Erreur lors du résumé:', error);
      await interaction.editReply({
        content: `❌ Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  },
};

export default command;

