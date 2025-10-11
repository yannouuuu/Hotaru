import type { Snowflake } from 'discord.js';
import type { DiscordBot } from '../client/DiscordBot.js';

export type TicketStatus = 'open' | 'closing' | 'closed';

export interface TicketData {
    guildId: Snowflake;
    channelId: Snowflake;
    ownerId: Snowflake;
    number: number;
    createdAt: number;
    status: TicketStatus;
    closedAt?: number;
    closedById?: Snowflake;
    closeReason?: string;
}

interface TicketStore {
    tickets: Record<Snowflake, TicketData>;
    userIndex: Record<Snowflake, Snowflake>;
    counter: number;
}

export class TicketManager {
    private static getBaseKey(guildId: Snowflake): string {
        return `tickets_${guildId}`;
    }

    private static ensureStore(client: DiscordBot, guildId: Snowflake): TicketStore {
        const baseKey = this.getBaseKey(guildId);
        const existing = client.database.get(baseKey) as Partial<TicketStore> | undefined;
        const store: TicketStore = {
            tickets: existing?.tickets ?? {},
            userIndex: existing?.userIndex ?? {},
            counter: typeof existing?.counter === 'number' ? existing.counter : 0
        };

        client.database.set(baseKey, store);

        return store;
    }

    static allocateTicketNumber(client: DiscordBot, guildId: Snowflake): number {
        const baseKey = this.getBaseKey(guildId);
        const store = this.ensureStore(client, guildId);
        const nextNumber = store.counter + 1;
        store.counter = nextNumber;
        client.database.set(baseKey, store);
        return nextNumber;
    }

    static createTicket(
        client: DiscordBot,
        data: Omit<TicketData, 'createdAt' | 'status'>
    ): TicketData {
        const baseKey = this.getBaseKey(data.guildId);
        const store = this.ensureStore(client, data.guildId);

        const ticket: TicketData = {
            ...data,
            createdAt: Date.now(),
            status: 'open'
        };

        store.tickets[ticket.channelId] = ticket;
        store.userIndex[ticket.ownerId] = ticket.channelId;
        client.database.set(baseKey, store);

        return ticket;
    }

    static getOpenTicketForUser(
        client: DiscordBot,
        guildId: Snowflake,
        userId: Snowflake
    ): TicketData | null {
        const store = this.ensureStore(client, guildId);
        const channelId = store.userIndex[userId];
        if (!channelId) return null;

        const ticket = store.tickets[channelId];
        if (ticket && ticket.status === 'open') {
            return ticket;
        }

        // Nettoyer les entrées obsolètes
        delete store.userIndex[userId];
        if (!ticket) {
            delete store.tickets[channelId];
        }
        client.database.set(this.getBaseKey(guildId), store);

        return null;
    }

    static getTicketByChannel(
        client: DiscordBot,
        guildId: Snowflake,
        channelId: Snowflake
    ): TicketData | null {
        const store = this.ensureStore(client, guildId);
        const ticket = store.tickets[channelId];
        return ticket ?? null;
    }

    static closeTicket(
        client: DiscordBot,
        guildId: Snowflake,
        channelId: Snowflake,
        options: { closedById: Snowflake; reason?: string }
    ): TicketData | null {
        const baseKey = this.getBaseKey(guildId);
        const store = this.ensureStore(client, guildId);
        const ticket = store.tickets[channelId];
        if (!ticket) {
            return null;
        }

        const updated: TicketData = {
            ...ticket,
            status: 'closed',
            closedAt: Date.now(),
            closedById: options.closedById,
            closeReason: options.reason
        };

        store.tickets[channelId] = updated;

        const existingChannel = store.userIndex[ticket.ownerId];
        if (existingChannel === channelId) {
            delete store.userIndex[ticket.ownerId];
        }

        client.database.set(baseKey, store);

        return updated;
    }

    static deleteTicketRecord(
        client: DiscordBot,
        guildId: Snowflake,
        channelId: Snowflake
    ): void {
        const baseKey = this.getBaseKey(guildId);
        const store = this.ensureStore(client, guildId);
        const ticket = store.tickets[channelId];
        if (ticket) {
            const existingChannel = store.userIndex[ticket.ownerId];
            if (existingChannel === channelId) {
                delete store.userIndex[ticket.ownerId];
            }
        }

        delete store.tickets[channelId];
        client.database.set(baseKey, store);
    }
}
