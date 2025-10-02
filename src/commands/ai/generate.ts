import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { askAI } from '../../utils/openrouter.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ai-gen')
    .setDescription('Génère un snippet de code à partir d\'un prompt')
    .addStringOption(option =>
      option
        .setName('prompt')
        .setDescription('Description du code à générer')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('langage')
        .setDescription('Langage de programmation (optionnel)')
        .setRequired(false)
        .addChoices(
          { name: 'TypeScript', value: 'typescript' },
          { name: 'JavaScript', value: 'javascript' },
          { name: 'Python', value: 'python' },
          { name: 'Java', value: 'java' },
          { name: 'C++', value: 'cpp' },
          { name: 'C', value: 'c' },
          { name: 'C#', value: 'csharp' },
          { name: 'Go', value: 'go' },
          { name: 'Rust', value: 'rust' },
          { name: 'PHP', value: 'php' },
          { name: 'Ruby', value: 'ruby' },
          { name: 'Swift', value: 'swift' },
          { name: 'Kotlin', value: 'kotlin' },
          { name: 'SQL', value: 'sql' },
          { name: 'HTML/CSS', value: 'html' },
          { name: 'R', value: 'r' },
          { name: 'Dart', value: 'dart' },
          { name: 'Scala', value: 'scala' },
          { name: 'Perl', value: 'perl' },
          { name: 'Lua', value: 'lua' },
          { name: 'Haskell', value: 'haskell' },
          { name: 'Assembly', value: 'assembly' },
          { name: 'Shell/Bash', value: 'bash' },
          { name: 'MATLAB', value: 'matlab' },
          { name: 'Autre', value: 'autre' }
        )
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const prompt = interaction.options.getString('prompt', true);
      const language = interaction.options.getString('langage');

      const systemPrompt = `Tu es un assistant de codage expert qui génère du code propre et bien commenté en français.
Fournis uniquement le code demandé avec des commentaires explicatifs.
Utilise les meilleures pratiques du langage choisi.`;

      const fullPrompt = language 
        ? `Génère du code en ${language} pour: ${prompt}`
        : `Génère du code pour: ${prompt}`;

      const generatedCode = await askAI(fullPrompt, systemPrompt);

      const truncatedCode = generatedCode.length > 1900 
        ? generatedCode.substring(0, 1900) + '...\n\n*(Réponse tronquée)*'
        : generatedCode;

      await interaction.editReply({
        content: `**💻 Code généré${language ? ` (${language})` : ''}:**\n\n${truncatedCode}`,
        allowedMentions: { parse: [] } // Bloque toutes les mentions
      });

    } catch (error) {
      console.error('Erreur lors de la génération de code:', error);
      await interaction.editReply({
        content: `❌ Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  },
};

export default command;

