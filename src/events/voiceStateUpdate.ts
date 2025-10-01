/**
 * Événement: État vocal modifié
 * Gère la création automatique de salons vocaux privés
 */

import { Events, VoiceState, ChannelType, PermissionFlagsBits } from 'discord.js';

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    const categoryVoiceId = process.env.CATEGORY_VOICE_ID;

    // Création automatique de salon vocal privé
    if (newState.channel && newState.channel.name === '➕┃Créer un vocal privé') {
      try {
        const guild = newState.guild;
        const member = newState.member;

        if (!member) return;

        // Créer un salon vocal privé automatiquement
        const voiceChannel = await guild.channels.create({
          name: `🔒 ${member.user.username}`,
          type: ChannelType.GuildVoice,
          parent: categoryVoiceId || newState.channel.parentId || undefined,
          userLimit: 5,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
              ],
            },
          ],
        });

        // Déplacer l'utilisateur dans le nouveau salon
        await member.voice.setChannel(voiceChannel);

        // Surveiller le salon pour suppression automatique
        const checkInterval = setInterval(async () => {
          try {
            const channel = guild.channels.cache.get(voiceChannel.id);
            if (!channel) {
              clearInterval(checkInterval);
              return;
            }

            if (channel.type === ChannelType.GuildVoice && channel.members.size === 0) {
              setTimeout(async () => {
                try {
                  const stillEmpty = guild.channels.cache.get(voiceChannel.id);
                  if (stillEmpty && stillEmpty.type === ChannelType.GuildVoice && stillEmpty.members.size === 0) {
                    await stillEmpty.delete();
                  }
                } catch {
                  // Erreur silencieuse si le salon n'existe plus
                }
                clearInterval(checkInterval);
              }, 5 * 60 * 1000); // 5 minutes
            }
          } catch (error) {
            console.error('Erreur monitoring:', error);
            clearInterval(checkInterval);
          }
        }, 30000); // Vérifier toutes les 30 secondes

      } catch (error) {
        console.error('Erreur lors de la création du salon vocal privé:', error);
      }
    }
  },
};

