import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

export const sqlClient = connectionString ? neon(connectionString) : null;
export const db = sqlClient ? drizzle(sqlClient, { schema }) : null;

export function getDb() {
  if (!db) {
    throw new Error('Database is not configured. DATABASE_URL is required.');
  }
  return db;
}
