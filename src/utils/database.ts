/**
 * Gestionnaire de base de données SQLite
 * 
 * Tables:
 * - quotes: Citations des professeurs
 * - tickets: Tickets de support
 * - verified_users: Utilisateurs vérifiés
 * - photo_counter: Compteur de photos par salon
 */

import type { QuoteData, TicketData } from '../types/index.ts';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new Database(join(dataDir, 'hotaru.db'));

// Créer les tables
db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    quote TEXT NOT NULL,
    professor TEXT NOT NULL,
    author TEXT NOT NULL,
    authorId TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    channelId TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    category TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    status TEXT DEFAULT 'open',
    closedAt INTEGER
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS verified_users (
    userId TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    verifiedAt INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS photo_counter (
    channelId TEXT PRIMARY KEY,
    counter INTEGER DEFAULT 0
  )
`);

// Fonctions pour les citations
export const addQuote = (quote: QuoteData): void => {
  const stmt = db.prepare(
    'INSERT INTO quotes (id, quote, professor, author, authorId, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(quote.id, quote.quote, quote.professor, quote.author, quote.authorId, quote.timestamp);
};

export const getAllQuotes = (): QuoteData[] => {
  const stmt = db.prepare('SELECT * FROM quotes ORDER BY timestamp DESC');
  return stmt.all() as QuoteData[];
};

export const getQuoteById = (id: string): QuoteData | undefined => {
  const stmt = db.prepare('SELECT * FROM quotes WHERE id = ?');
  return stmt.get(id) as QuoteData | undefined;
};

// Fonctions pour les tickets
export const createTicket = (ticket: TicketData): void => {
  const stmt = db.prepare(
    'INSERT INTO tickets (channelId, userId, category, createdAt, status, closedAt) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(ticket.channelId, ticket.userId, ticket.category, ticket.createdAt, ticket.status, ticket.closedAt || null);
};

export const getTicket = (channelId: string): TicketData | undefined => {
  const stmt = db.prepare('SELECT * FROM tickets WHERE channelId = ?');
  const result = stmt.get(channelId) as any;
  if (!result) return undefined;
  return result as TicketData;
};

export const updateTicketStatus = (channelId: string, status: string): void => {
  const stmt = db.prepare('UPDATE tickets SET status = ?, closedAt = ? WHERE channelId = ?');
  const closedAt = (status === 'closed' || status === 'archived') ? Date.now() : null;
  stmt.run(status, closedAt, channelId);
};

export const getActiveTickets = (): TicketData[] => {
  const stmt = db.prepare('SELECT * FROM tickets WHERE status = ?');
  return stmt.all('open') as TicketData[];
};

export const getUserActiveTicket = (userId: string): TicketData | undefined => {
  const stmt = db.prepare('SELECT * FROM tickets WHERE userId = ? AND status = ?');
  return stmt.get(userId, 'open') as TicketData | undefined;
};

// Fonctions pour les utilisateurs vérifiés
export const addVerifiedUser = (userId: string, email: string): void => {
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO verified_users (userId, email, verifiedAt) VALUES (?, ?, ?)'
  );
  stmt.run(userId, email, Date.now());
};

export const isUserVerified = (userId: string): boolean => {
  const stmt = db.prepare('SELECT * FROM verified_users WHERE userId = ?');
  return stmt.get(userId) !== null;
};

export const getVerifiedUser = (userId: string): { userId: string; email: string; verifiedAt: number } | undefined => {
  const stmt = db.prepare('SELECT * FROM verified_users WHERE userId = ?');
  return stmt.get(userId) as { userId: string; email: string; verifiedAt: number } | undefined;
};

// Fonctions pour le compteur de photos
export const getPhotoCounter = (channelId: string): number => {
  const stmt = db.prepare('SELECT counter FROM photo_counter WHERE channelId = ?');
  const result = stmt.get(channelId) as { counter: number } | undefined;
  return result?.counter || 0;
};

export const incrementPhotoCounter = (channelId: string): number => {
  const currentCount = getPhotoCounter(channelId);
  const newCount = currentCount + 1;
  
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO photo_counter (channelId, counter) VALUES (?, ?)'
  );
  stmt.run(channelId, newCount);
  
  return newCount;
};

export default db;

