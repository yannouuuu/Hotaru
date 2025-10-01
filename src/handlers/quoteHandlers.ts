import { ModalSubmitInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import type { BotClient, QuoteData } from '../types/index.ts';
import { addQuote } from '../utils/database.ts';

export const handleQuoteModal = async (
  interaction: ModalSubmitInteraction,
  client: BotClient
): Promise<void> => {
  const quoteText = interaction.fields.getTextInputValue('quote_text');
  const professorName = interaction.fields.getTextInputValue('professor_name');

  // Fonction pour échapper les caractères Markdown
  const escapeMarkdown = (text: string): string => {
    return text.replace(/[_*~`|]/g, '\\$&');
  };

  try {
    // Créer la citation
    const quote: QuoteData = {
      id: `${Date.now()}-${interaction.user.id}`,
      quote: quoteText,
      professor: professorName,
      author: interaction.user.username,
      authorId: interaction.user.id,
      timestamp: Date.now(),
    };

    // Sauvegarder dans la base de données
    addQuote(quote);

    // Poster dans le salon des citations avec un style amélioré
    const quotesChannelId = process.env.CHANNEL_QUOTES_ID;
    if (quotesChannelId) {
      const quotesChannel = await client.channels.fetch(quotesChannelId) as TextChannel;
      if (quotesChannel?.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(0xe67e22)
          .setDescription(
            `> "${escapeMarkdown(quoteText)}"\n` +
            `> \n` +
            `> — ${escapeMarkdown(professorName)}`
          )
          .setFooter({ 
            text: `Ajouté par ${escapeMarkdown(interaction.user.username)} • ${new Date().toLocaleDateString('fr-FR')}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();

        await quotesChannel.send({ embeds: [embed] });
      }
    }

    await interaction.reply({
      content: '✅ Citation ajoutée avec succès !',
      ephemeral: true,
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la citation:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue lors de l\'ajout de la citation.',
      ephemeral: true,
    });
  }
};

