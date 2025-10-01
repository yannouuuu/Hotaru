import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { universityData } from '../../utils/universityData.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('contacts')
    .setDescription('Afficher les contacts du département informatique')
    .addStringOption(option =>
      option
        .setName('année')
        .setDescription('Année concernée')
        .setRequired(false)
        .addChoices(
          { name: 'Département (général)', value: 'département' },
          { name: 'BUT 1', value: 'but1' },
          { name: 'BUT 2', value: 'but2' },
          { name: 'BUT 3', value: 'but3' }
        )
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const year = interaction.options.getString('année');

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('📞 Contacts - Département Informatique');

    if (!year || year === 'département') {
      const deptContact = universityData.contacts[0];
      embed.setDescription('**Département Informatique - Contacts généraux**');
      
      for (const responsible of deptContact.responsibles) {
        embed.addFields({
          name: `${responsible.role}`,
          value: `${responsible.name}\n📧 ${responsible.email}`,
          inline: false
        });
      }
    } else {
      const yearMap: { [key: string]: number } = {
        'but1': 1,
        'but2': 2,
        'but3': 3
      };
      
      const contactIndex = yearMap[year];
      if (contactIndex && universityData.contacts[contactIndex]) {
        const yearContact = universityData.contacts[contactIndex];
        embed.setDescription(`**${yearContact.year} - Contacts**\n\n⚠️ Pour justifier vos absences, contactez la secrétaire via Zimbra avec votre justificatif.`);
        
        embed.addFields({
          name: '👥 Responsables',
          value: yearContact.responsibles.map(r => `**${r.role}**\n${r.name}\n📧 ${r.email}`).join('\n\n'),
          inline: false
        });

        if (yearContact.secretary.name) {
          embed.addFields({
            name: '📋 Secrétaire',
            value: `${yearContact.secretary.name}\n📧 ${yearContact.secretary.email}`,
            inline: true
          });
        }

        if (yearContact.edt.name) {
          embed.addFields({
            name: '📅 Gestion EDT',
            value: `${yearContact.edt.name}\n📧 ${yearContact.edt.email}`,
            inline: true
          });
        }
      }
    }

    embed.setFooter({ text: 'N\'hésitez pas à les contacter en cas de besoin !' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;

