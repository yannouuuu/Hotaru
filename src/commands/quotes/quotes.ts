import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { getAllQuotes } from '../../utils/database.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('quotes')
    .setDescription('Afficher les dernières citations')
    .addIntegerOption(option =>
      option
        .setName('nombre')
        .setDescription('Nombre de citations à afficher (par défaut: 10)')
        .setMinValue(1)
        .setMaxValue(25)
        .setRequired(false)
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const count = interaction.options.getInteger('nombre') || 10;

    try {
      const allQuotes = getAllQuotes();
      const quotes = allQuotes.slice(0, count);

      if (quotes.length === 0) {
        await interaction.reply({
          content: '📝 Aucune citation n\'a encore été ajoutée. Utilisez `/quote` pour en ajouter une !',
          ephemeral: true,
        });
        return;
      }

      // Fonction pour échapper les caractères Markdown
      const escapeMarkdown = (text: string): string => {
        return text.replace(/[_*~`|]/g, '\\$&');
      };

      // Un seul embed avec toutes les citations
      const description = quotes.map((q, index) => {
        const date = new Date(q.timestamp).toLocaleDateString('fr-FR');
        return (
          `${index + 1}. "${escapeMarkdown(q.quote)}"\n` +
          `└ ${escapeMarkdown(q.professor)} • ${escapeMarkdown(q.author)} • ${date}`
        );
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle('📖 Les meilleures citations de nos profs')
        .setDescription(description)
        .setFooter({ text: `Total: ${allQuotes.length} citation(s) • Utilisez /quote pour en ajouter` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors de la récupération des citations:', error);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de la récupération des citations.',
        ephemeral: true,
      });
    }
  },
};

export default command;

