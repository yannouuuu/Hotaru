import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { askAI } from '../../utils/openrouter.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Traduit une documentation technique')
    .addStringOption(option =>
      option
        .setName('langue')
        .setDescription('Langue cible')
        .setRequired(true)
        .addChoices(
          { name: 'Français', value: 'français' },
          { name: 'Anglais', value: 'anglais' },
          { name: 'Espagnol', value: 'espagnol' },
          { name: 'Allemand', value: 'allemand' },
          { name: 'Italien', value: 'italien' },
          { name: 'Portugais', value: 'portugais' },
          { name: 'Russe', value: 'russe' },
          { name: 'Japonais', value: 'japonais' },
          { name: 'Chinois', value: 'chinois' },
          { name: 'Coréen', value: 'coréen' },
          { name: 'Arabe', value: 'arabe' },
          { name: 'Hindi', value: 'hindi' },
          { name: 'Turc', value: 'turc' },
          { name: 'Polonais', value: 'polonais' },
          { name: 'Néerlandais', value: 'néerlandais' },
          { name: 'Suédois', value: 'suédois' },
          { name: 'Grec', value: 'grec' },
          { name: 'Hébreu', value: 'hébreu' },
          { name: 'Ukrainien', value: 'ukrainien' },
          { name: 'Vietnamien', value: 'vietnamien' }
        )
    )
    .addStringOption(option =>
      option
        .setName('texte')
        .setDescription('Le texte à traduire')
        .setRequired(true)
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const targetLanguage = interaction.options.getString('langue', true);
      const text = interaction.options.getString('texte', true);

      const systemPrompt = `Tu es un traducteur spécialisé en documentation technique.
Traduis le texte de manière précise en conservant:
- Les termes techniques appropriés
- La structure et le formatage
- Les exemples de code (ne pas traduire le code, juste les commentaires)
Fournis uniquement la traduction, sans commentaire supplémentaire.`;

      const prompt = `Traduis ce texte en ${targetLanguage}:\n\n${text}`;

      const translation = await askAI(prompt, systemPrompt);

      const truncatedTranslation = translation.length > 1900 
        ? translation.substring(0, 1900) + '...\n\n*(Réponse tronquée)*'
        : translation;

      await interaction.editReply({
        content: `**🌐 Traduction (${targetLanguage}):**\n\n${truncatedTranslation}`,
        allowedMentions: { parse: [] } // Bloque toutes les mentions
      });

    } catch (error) {
      console.error('Erreur lors de la traduction:', error);
      await interaction.editReply({
        content: `❌ Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  },
};

export default command;

