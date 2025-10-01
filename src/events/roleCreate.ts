import { Events, Role, EmbedBuilder, TextChannel } from 'discord.js';

export default {
  name: Events.GuildRoleCreate,
  async execute(role: Role) {
    const logChannelId = process.env.CHANNEL_LOGS_SERVER_ID;
    if (!logChannelId) return;

    try {
      // Vérifier que le salon de logs existe
      const logChannel = role.guild.channels.cache.get(logChannelId) as TextChannel;
      if (!logChannel?.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(0x00b894)
        .setTitle('➕ Rôle créé')
        .addFields(
          { name: 'Nom', value: role.name, inline: true },
          { name: 'Couleur', value: role.hexColor, inline: true },
          { name: 'ID', value: role.id, inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors du log de création de rôle:', error);
    }
  },
};

