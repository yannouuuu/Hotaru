import { ModalSubmitInteraction, EmbedBuilder, TextChannel, MessageFlags } from 'discord.js';
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
      try {
        const quotesChannel = await client.channels.fetch(quotesChannelId) as TextChannel;
        if (quotesChannel && quotesChannel.isTextBased()) {
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
        } else {
          console.warn('CHANNEL_QUOTES_ID does not point to a text-based channel. Skipping send.');
        }
      } catch (fetchError) {
        // Gérer le cas Unknown Channel (404) sans faire échouer l'action utilisateur
        console.error('Impossible de poster la citation, canal introuvable ou inaccessible:', fetchError);
      }
    } else {
      console.warn('CHANNEL_QUOTES_ID non défini. La citation a été enregistrée en base mais non publiée.');
    }

    await interaction.reply({
      content: '✅ Citation ajoutée avec succès !',
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la citation:', error);
    const payload = { content: '❌ Une erreur est survenue lors de l\'ajout de la citation.', flags: MessageFlags.Ephemeral } as any;
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
};

