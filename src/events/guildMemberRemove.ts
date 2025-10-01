import { Events, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(member: GuildMember) {
    const logChannelId = process.env.CHANNEL_LOGS_SERVER_ID;
    if (!logChannelId) return;

    try {
      const logChannel = await member.guild.channels.fetch(logChannelId) as TextChannel;
      if (!logChannel?.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('👋 Membre quitté')
        .setDescription(`${member.user.tag} a quitté le serveur`)
        .addFields(
          { name: 'Utilisateur', value: `${member.user.tag}`, inline: true },
          { name: 'ID', value: member.user.id, inline: true },
          { name: 'Membres restants', value: `${member.guild.memberCount}`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors du log de départ:', error);
    }
  },
};

