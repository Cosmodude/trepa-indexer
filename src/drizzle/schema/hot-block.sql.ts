import { sql } from 'drizzle-orm';
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const hotBlockTable = pgTable('hot_blocks', {
  height: integer('height').primaryKey(),
  hash: text('hash').notNull(),
  created_at: timestamp()
    .notNull()
    .default(sql`current_timestamp`),
  updated_at: timestamp()
    .notNull()
    .default(sql`current_timestamp`),
});

export type HotBlock = typeof hotBlockTable.$inferSelect;
export type NewHotBlock = typeof hotBlockTable.$inferInsert;
