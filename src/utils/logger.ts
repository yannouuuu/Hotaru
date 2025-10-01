/**
 * Système de logging centralisé
 * Envoie les logs dans les salons appropriés selon le type d'action
 */

import { EmbedBuilder, TextChannel } from 'discord.js';
import type { BotClient } from '../types/index.ts';

type LogType = 'bot' | 'moderation' | 'server';

export const logAction = async (
  client: BotClient,
  action: string,
  executor: string,
  target?: string,
  reason?: string,
  color: number = 0x3498db,
  logType: LogType = 'bot'
): Promise<void> => {
  let logChannelId: string | undefined;

  // Choisir le bon salon selon le type de log
  switch (logType) {
    case 'bot':
      logChannelId = process.env.CHANNEL_LOGS_BOTS_ID;
      break;
    case 'moderation':
      logChannelId = process.env.CHANNEL_LOGS_MODERATION_ID;
      break;
    case 'server':
      logChannelId = process.env.CHANNEL_LOGS_SERVER_ID;
      break;
  }

  if (!logChannelId) return;

  try {
    const logChannel = await client.channels.fetch(logChannelId) as TextChannel;
    if (!logChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`📋 ${action}`)
      .addFields(
        { name: 'Exécuté par', value: executor, inline: true },
        ...(target ? [{ name: 'Cible', value: target, inline: true }] : []),
        ...(reason ? [{ name: 'Détails', value: reason }] : [])
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur lors du log:', error);
  }
};

