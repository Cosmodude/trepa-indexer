import { sql } from 'drizzle-orm';
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const statusTable = pgTable('statuses', {
  id: integer('id').primaryKey().default(0),
  height: integer('height').notNull(),
  hash: text('hash').notNull(),
  nonce: integer('nonce').notNull().default(0),
  created_at: timestamp()
    .notNull()
    .default(sql`current_timestamp`),
  updated_at: timestamp()
    .notNull()
    .default(sql`current_timestamp`),
});

export type Status = typeof statusTable.$inferSelect;
export type NewStatus = typeof statusTable.$inferInsert;
