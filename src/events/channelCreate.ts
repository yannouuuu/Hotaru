import { Events, GuildChannel, EmbedBuilder, TextChannel } from 'discord.js';

export default {
  name: Events.ChannelCreate,
  async execute(channel: GuildChannel) {
    const logChannelId = process.env.CHANNEL_LOGS_SERVER_ID;
    if (!logChannelId || channel.id === logChannelId) return;

    try {
      // Vérifier que le salon de logs existe
      const logChannel = channel.guild.channels.cache.get(logChannelId) as TextChannel;
      if (!logChannel?.isTextBased()) return;

      const channelType = {
        0: 'Textuel',
        2: 'Vocal',
        4: 'Catégorie',
        5: 'Annonce',
        13: 'Stage',
        15: 'Forum'
      }[channel.type] || 'Inconnu';

      const embed = new EmbedBuilder()
        .setColor(0x00b894)
        .setTitle('➕ Salon créé')
        .addFields(
          { name: 'Nom', value: channel.name, inline: true },
          { name: 'Type', value: channelType, inline: true },
          { name: 'ID', value: channel.id, inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors du log de création de salon:', error);
    }
  },
};

