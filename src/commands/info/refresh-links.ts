import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, TextChannel } from 'discord.js';
import type { Command } from '../../types/index.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('refresh-links')
    .setDescription('Envoyer le message des liens utiles dans le salon actuel')
    .setDefaultMemberPermissions('0')
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const mainEmbed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🔗 Liens Utiles - Université de Lille')
      .setDescription(
        '**Tous les liens importants pour votre parcours au BUT Informatique**\n\n' +
        'Utilisez le menu ci-dessous pour accéder rapidement aux différentes sections.'
      )
      .setFooter({ text: '💡 Ajoutez ces liens à vos favoris !' })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('links_menu')
      .setPlaceholder('📚 Sélectionnez une catégorie')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('📅 Emploi du temps & Notes')
          .setDescription('EDT et bulletin de notes')
          .setValue('edt_notes')
          .setEmoji('📅'),
        new StringSelectMenuOptionBuilder()
          .setLabel('📧 Communication')
          .setDescription('Zimbra, Moodle, ENT')
          .setValue('communication')
          .setEmoji('📧'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🎯 Vie étudiante')
          .setDescription('Sport, aide, tutorat')
          .setValue('vie_etudiante')
          .setEmoji('🎯'),
        new StringSelectMenuOptionBuilder()
          .setLabel('📞 Contacts')
          .setDescription('Contacts du département')
          .setValue('contacts')
          .setEmoji('📞'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🔗 Tous les liens')
          .setDescription('Afficher tous les liens en une fois')
          .setValue('all_links')
          .setEmoji('🔗')
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: '✅ Message des liens envoyé !',
      ephemeral: true,
    });

    if (interaction.channel && 'send' in interaction.channel) {
      await (interaction.channel as TextChannel).send({ 
        embeds: [mainEmbed], 
        components: [row] 
      });
    }
  },
};

export default command;

