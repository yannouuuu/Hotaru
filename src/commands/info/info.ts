import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { universityData } from '../../utils/universityData.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Afficher les informations et liens utiles de l\'Université de Lille')
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const mainEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('📚 Informations - BUT Informatique Université de Lille')
      .setDescription(
        'Bienvenue sur le serveur Discord du BUT Informatique de l\'Université de Lille !\n\n' +
        'Utilisez les commandes suivantes pour accéder aux informations :\n' +
        '• `/links` - Tous les liens utiles\n' +
        '• `/contacts` - Contacts du département\n' +
        '• `/quote` - Ajouter une citation d\'un professeur\n' +
        '• `/quotes` - Voir les dernières citations\n\n' +
        '**Liens rapides:**'
      )
      .addFields(
        { name: '📅 Emploi du temps', value: '[Accéder](https://edt-iut.univ-lille.fr/)', inline: true },
        { name: '📊 Notes', value: '[Accéder](https://bulletin.iut-info.univ-lille.fr/)', inline: true },
        { name: '📧 Zimbra', value: '[Accéder](https://zimbra.univ-lille.fr/)', inline: true },
        { name: '📚 Moodle', value: '[Accéder](https://moodle.univ-lille.fr/)', inline: true },
        { name: '🎯 Aide BUT Info', value: '[Accéder](https://but-info.septhime.fr/)', inline: true },
        { name: '🏃 Sport', value: '[Accéder](https://sport.univ-lille.fr/)', inline: true }
      )
      .setFooter({ text: 'Pour plus d\'aide, ouvrez un ticket avec /ticket' })
      .setTimestamp();

    await interaction.reply({ embeds: [mainEmbed] });
  },
};

export default command;

