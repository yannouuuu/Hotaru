import { Client, Collection, SlashCommandBuilder, CommandInteraction, ChatInputCommandInteraction } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface BotClient extends Client {
  commands: Collection<string, Command>;
}

export interface QuoteData {
  id: string;
  quote: string;
  professor: string;
  author: string;
  authorId: string;
  timestamp: number;
}

export interface TicketData {
  channelId: string;
  userId: string;
  category: string;
  createdAt: number;
  status: 'open' | 'pending' | 'closed' | 'archived';
  closedAt?: number;
}

export interface UniversityInfo {
  links: {
    name: string;
    url: string;
    description: string;
  }[];
  contacts: {
    year: string;
    responsibles: { name: string; email: string; role: string }[];
    secretary: { name: string; email: string };
    edt: { name: string; email: string };
  }[];
}

