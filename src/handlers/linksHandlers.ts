import { StringSelectMenuInteraction, EmbedBuilder } from 'discord.js';

export const handleLinksMenu = async (interaction: StringSelectMenuInteraction): Promise<void> => {
  const choice = interaction.values[0];

  let embed: EmbedBuilder;

  switch (choice) {
    case 'notion_yann':
      embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle('📓 Notion de Yann - BUT Informatique')
        .setDescription(
          '**[📓 Accéder au Notion](https://www.notion.so/BUT1-Informatique-IUT-de-Lille-2025-2026-27b6e4f7ea6581998644c2590374d65b)**\n\n' +
          '✨ **Ressources complètes pour BUT Info 2025-2026**\n' +
          '• Cours et supports de cours\n' +
          '• Exercices et corrections\n' +
          '• Conseils et méthodologie\n'
        )
        .setFooter({ text: 'Notion - BUT Informatique IUT Lille' })
        .setTimestamp();
      break;

    case 'edt_notes':
      embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('📅 Emploi du temps & Notes')
        .setDescription(
          '**[📅 Emploi du temps](https://edt-iut.univ-lille.fr/)**\n' +
          'Consultez votre emploi du temps en temps réel\n\n' +
          '**[📊 Bulletin de notes](https://bulletin.iut-info.univ-lille.fr/)**\n' +
          'Accédez à vos notes et bulletins'
        )
        .setTimestamp();
      break;

    case 'communication':
      embed = new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle('📧 Communication & Ressources')
        .setDescription(
          '**[📧 Zimbra](https://zimbra.univ-lille.fr/)**\n' +
          'Votre boîte mail universitaire (@univ-lille.fr)\n\n' +
          '**[📚 Moodle](https://moodle.univ-lille.fr/)**\n' +
          'Ressources des cours, devoirs et annonces\n\n' +
          '**[🌐 ENT](https://ent.univ-lille.fr/)**\n' +
          'Environnement Numérique de Travail'
        )
        .setTimestamp();
      break;

    case 'vie_etudiante':
      embed = new EmbedBuilder()
        .setColor(0x00b894)
        .setTitle('🎯 Vie étudiante')
        .setDescription(
          '**[🎯 Aide BUT Info](https://but-info.septhime.fr/)**\n' +
          'Plateforme d\'aide et tutorat pour le BUT Informatique\n\n' +
          '**[🏃 Sport universitaire](https://sport.univ-lille.fr/)**\n' +
          'Activités sportives et inscriptions'
        )
        .setTimestamp();
      break;

    case 'contacts':
      embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('📞 Contacts - BUT Informatique')
        .setDescription(
          '**BUT 1 - Responsables**\n' +
          '• Julien Baste - julien.baste@univ-lille.fr\n' +
          '• Fabien Delecroix - fabien.delecroix@univ-lille.fr\n\n' +
          '**Secrétariat BUT 1**\n' +
          '• Marie Ryckebosch - marie.ryckebosch@univ-lille.fr\n\n' +
          '**Gestion EDT**\n' +
          '• Deise Santana Maia - deise.santanamaia@univ-lille.fr\n\n' +
          '⚠️ Pour justifier vos absences, contactez la secrétaire via Zimbra\n\n' +
          '💡 Utilisez `/contacts` pour plus de détails'
        )
        .setTimestamp();
      break;

    case 'all_links':
      embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('🔗 Tous les liens - Université de Lille')
        .addFields(
          {
            name: '📓 Notion Yann',
            value: '[Accéder](https://www.notion.so/BUT1-Informatique-IUT-de-Lille-2025-2026-27b6e4f7ea6581998644c2590374d65b)',
            inline: true
          },
          {
            name: '📅 Emploi du temps',
            value: '[Accéder](https://edt-iut.univ-lille.fr/)',
            inline: true
          },
          {
            name: '📊 Notes',
            value: '[Accéder](https://bulletin.iut-info.univ-lille.fr/)',
            inline: true
          },
          {
            name: '📧 Zimbra',
            value: '[Accéder](https://zimbra.univ-lille.fr/)',
            inline: true
          },
          {
            name: '📚 Moodle',
            value: '[Accéder](https://moodle.univ-lille.fr/)',
            inline: true
          },
          {
            name: '🎯 Aide BUT',
            value: '[Accéder](https://but-info.septhime.fr/)',
            inline: true
          },
          {
            name: '🏃 Sport',
            value: '[Accéder](https://sport.univ-lille.fr/)',
            inline: true
          },
          {
            name: '🌐 ENT',
            value: '[Accéder](https://ent.univ-lille.fr/)',
            inline: true
          }
        )
        .setTimestamp();
      break;

    default:
      embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setDescription('❌ Option invalide');
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
};

