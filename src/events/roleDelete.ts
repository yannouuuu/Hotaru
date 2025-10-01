import { Events, Role, EmbedBuilder, TextChannel } from 'discord.js';

export default {
  name: Events.GuildRoleDelete,
  async execute(role: Role) {
    const logChannelId = process.env.CHANNEL_LOGS_SERVER_ID;
    if (!logChannelId) return;

    try {
      // Vérifier que le salon de logs existe encore
      const logChannel = role.guild.channels.cache.get(logChannelId) as TextChannel;
      if (!logChannel?.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('🗑️ Rôle supprimé')
        .addFields(
          { name: 'Nom', value: role.name, inline: true },
          { name: 'ID', value: role.id, inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors du log de suppression de rôle:', error);
    }
  },
};

