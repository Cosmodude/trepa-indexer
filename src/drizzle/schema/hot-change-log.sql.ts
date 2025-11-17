import { sql } from 'drizzle-orm';
import {
  pgTable,
  integer,
  jsonb,
  primaryKey,
  timestamp,
} from 'drizzle-orm/pg-core';

import { hotBlockTable } from './hot-block.sql';

export const hotChangeLogTable = pgTable(
  'hot_change_logs',
  {
    blockHeight: integer('block_height')
      .notNull()
      .references(() => hotBlockTable.height, { onDelete: 'cascade' }),
    index: integer('index').notNull(),
    change: jsonb('change').notNull(),
    created_at: timestamp()
      .notNull()
      .default(sql`current_timestamp`),
    updated_at: timestamp()
      .notNull()
      .default(sql`current_timestamp`),
  },
  (t) => [primaryKey({ columns: [t.blockHeight, t.index] })],
);

export type HotChangeLog = typeof hotChangeLogTable.$inferSelect;
export type NewHotChangeLog = typeof hotChangeLogTable.$inferInsert;
