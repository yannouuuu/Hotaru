import { Events, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    // Message de bienvenue
    const welcomeChannelId = process.env.CHANNEL_WELCOME_ID;
    if (welcomeChannelId) {
      try {
        const welcomeChannel = await member.guild.channels.fetch(welcomeChannelId) as TextChannel;
        if (welcomeChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(0x00b894)
            .setTitle('🎓 Bienvenue sur le serveur BUT Info Lille !')
            .setDescription(
              `Salut ${member} ! Bienvenue parmi nous ! 👋\n\n` +
              `Pour accéder au serveur, tu dois d'abord vérifier que tu es bien étudiant à l'Université de Lille.\n\n` +
              `📧 Utilise la commande \`/verify\` dans <#${process.env.CHANNEL_VERIFY_ID}> avec ton email universitaire (@univ-lille.fr)\n\n` +
              `Une fois vérifié, tu auras accès à tous les salons et fonctionnalités du serveur !`
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ 
              text: `Membre #${member.guild.memberCount}`,
              iconURL: member.guild.iconURL() || undefined
            })
            .setTimestamp();

          await welcomeChannel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message de bienvenue:', error);
      }
    }

    // Log dans logs-serveur
    const logChannelId = process.env.CHANNEL_LOGS_SERVER_ID;
    if (logChannelId) {
      try {
        const logChannel = await member.guild.channels.fetch(logChannelId) as TextChannel;
        if (logChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(0x00b894)
            .setTitle('➕ Nouveau membre')
            .setDescription(`${member.user.tag} a rejoint le serveur`)
            .addFields(
              { name: 'Utilisateur', value: `${member.user.tag}`, inline: true },
              { name: 'ID', value: member.user.id, inline: true },
              { name: 'Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
              { name: 'Total membres', value: `${member.guild.memberCount}`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

          await logChannel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error('Erreur lors du log d\'arrivée:', error);
      }
    }
  },
};

