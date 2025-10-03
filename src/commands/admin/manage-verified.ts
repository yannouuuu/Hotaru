import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  EmbedBuilder,
  User
} from 'discord.js';
import type { Command } from '../../types/index.ts';
import { removeVerifiedUser, getAllVerifiedUsers, getVerifiedUser } from '../../utils/database.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('manage-verified')
    .setDescription('Gérer les utilisateurs vérifiés')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Supprimer le statut de vérification d\'un utilisateur')
        .addUserOption(option =>
          option
            .setName('utilisateur')
            .setDescription('L\'utilisateur à dé-vérifier')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Lister tous les utilisateurs vérifiés')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Vérifier le statut d\'un utilisateur')
        .addUserOption(option =>
          option
            .setName('utilisateur')
            .setDescription('L\'utilisateur à vérifier')
            .setRequired(true)
        )
    )
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'remove': {
        const user = interaction.options.getUser('utilisateur', true);
        
        const verifiedUser = getVerifiedUser(user.id);
        if (!verifiedUser) {
          await interaction.reply({
            content: `❌ L'utilisateur ${user.tag} n'est pas vérifié.`,
            ephemeral: true
          });
          return;
        }

        const success = removeVerifiedUser(user.id);
        if (success) {
          await interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle('✅ Utilisateur dé-vérifié')
              .setDescription(`L'utilisateur ${user.tag} a été supprimé de la liste des utilisateurs vérifiés.`)
              .addFields(
                { name: 'Email', value: verifiedUser.email, inline: true },
                { name: 'Vérifié le', value: `<t:${Math.floor(verifiedUser.verifiedAt / 1000)}:F>`, inline: true }
              )
              .setTimestamp()
            ],
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: `❌ Erreur lors de la suppression de l'utilisateur ${user.tag}.`,
            ephemeral: true
          });
        }
        break;
      }

      case 'list': {
        await interaction.deferReply({ ephemeral: true });
        
        const verifiedUsers = getAllVerifiedUsers();
        
        if (verifiedUsers.length === 0) {
          await interaction.editReply({
            content: '📝 Aucun utilisateur vérifié trouvé.'
          });
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle('📋 Utilisateurs vérifiés')
          .setDescription(`Total : ${verifiedUsers.length} utilisateur(s)`)
          .setTimestamp();

        // Limiter à 25 utilisateurs pour éviter de dépasser la limite des fields
        const displayUsers = verifiedUsers.slice(0, 25);
        
        for (const verifiedUser of displayUsers) {
          try {
            const user = await interaction.client.users.fetch(verifiedUser.userId);
            embed.addFields({
              name: user.tag,
              value: `Email: ${verifiedUser.email}\nVérifié: <t:${Math.floor(verifiedUser.verifiedAt / 1000)}:R>`,
              inline: true
            });
          } catch (error) {
            embed.addFields({
              name: `Utilisateur inconnu (${verifiedUser.userId})`,
              value: `Email: ${verifiedUser.email}\nVérifié: <t:${Math.floor(verifiedUser.verifiedAt / 1000)}:R>`,
              inline: true
            });
          }
        }

        if (verifiedUsers.length > 25) {
          embed.setFooter({ text: `... et ${verifiedUsers.length - 25} autre(s) utilisateur(s)` });
        }

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'check': {
        const user = interaction.options.getUser('utilisateur', true);
        const verifiedUser = getVerifiedUser(user.id);
        
        const embed = new EmbedBuilder()
          .setColor(verifiedUser ? 0x00ff00 : 0xff0000)
          .setTitle(`🔍 Statut de vérification - ${user.tag}`)
          .setThumbnail(user.displayAvatarURL())
          .setTimestamp();

        if (verifiedUser) {
          embed
            .setDescription('✅ Cet utilisateur est vérifié')
            .addFields(
              { name: 'Email', value: verifiedUser.email, inline: true },
              { name: 'Vérifié le', value: `<t:${Math.floor(verifiedUser.verifiedAt / 1000)}:F>`, inline: true },
              { name: 'Il y a', value: `<t:${Math.floor(verifiedUser.verifiedAt / 1000)}:R>`, inline: true }
            );
        } else {
          embed.setDescription('❌ Cet utilisateur n\'est pas vérifié');
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }
    }
  },
};

export default command;