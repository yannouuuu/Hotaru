import { SlashCommandBuilder, ChatInputCommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { isUserVerified } from '../../utils/database.ts';
// import { generateCASLink } from '../../utils/casServer.ts'; // ⚠️ CAS non disponible pour l'instant

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Vérifier votre statut d\'étudiant de l\'Université de Lille')
    /* // ⚠️ CAS désactivé pour l'instant - Nécessite une URL publique enregistrée auprès de l'université
    .addStringOption(option =>
      option
        .setName('méthode')
        .setDescription('Méthode de vérification')
        .setRequired(false)
        .addChoices(
          { name: '🔐 CAS (Portail universitaire)', value: 'cas' },
          { name: '📧 Email manuel', value: 'email' }
        )
    )
    */
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    // Vérifier si l'utilisateur est déjà vérifié
    if (isUserVerified(interaction.user.id)) {
      await interaction.reply({
        content: '✅ Vous êtes déjà vérifié !',
        ephemeral: true,
      });
      return;
    }

    /* // ⚠️ MÉTHODE CAS - Commentée pour l'instant
    // Raison : Le CAS de l'Université de Lille n'accepte que les URLs pré-enregistrées
    // Pour activer : 
    //   1. Héberger le bot sur un serveur avec URL publique
    //   2. Demander à l'université d'enregistrer l'URL dans le CAS
    //   3. Décommenter ce code et le serveur dans casServer.ts
    
    const method = interaction.options.getString('méthode') || 'email';

    if (method === 'cas') {
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xf39c12)
          .setTitle('⚠️ CAS non disponible')
          .setDescription(
            'La vérification via CAS n\'est pas encore disponible.\n\n' +
            'Cette fonctionnalité nécessite que le bot soit hébergé sur un serveur public ' +
            'et que l\'URL soit enregistrée auprès de l\'université.\n\n' +
            'Veuillez utiliser la méthode email pour l\'instant.'
          )],
        ephemeral: true
      });
      return;
    }
    */

    // Créer le modal pour demander l'email
    const modal = new ModalBuilder()
      .setCustomId('verify_modal')
      .setTitle('Vérification - Université de Lille');

    const emailInput = new TextInputBuilder()
      .setCustomId('email_input')
      .setLabel('Votre email universitaire')
      .setPlaceholder('prenom.nom@univ-lille.fr')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(100);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput);
    modal.addComponents(firstRow);

    await interaction.showModal(modal);
  },
};

export default command;


