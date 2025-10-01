import { Events, DMChannel, GuildChannel, EmbedBuilder, TextChannel } from 'discord.js';

export default {
  name: Events.ChannelDelete,
  async execute(channel: DMChannel | GuildChannel) {
    if (channel.isDMBased()) return;
    
    const logChannelId = process.env.CHANNEL_LOGS_SERVER_ID;
    if (!logChannelId) return;

    // Ne pas logger si c'est le salon de logs lui-même qui est supprimé
    if (channel.id === logChannelId) return;

    try {
      // Vérifier que le salon de logs existe encore
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
        .setColor(0xe74c3c)
        .setTitle('🗑️ Salon supprimé')
        .addFields(
          { name: 'Nom', value: channel.name, inline: true },
          { name: 'Type', value: channelType, inline: true },
          { name: 'ID', value: channel.id, inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors du log de suppression de salon:', error);
    }
  },
};

