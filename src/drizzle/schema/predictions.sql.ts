import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  varchar,
  numeric,
  bigint,
  boolean,
} from 'drizzle-orm/pg-core';

export const predictionsTable = pgTable('predictions', {
  id: varchar('id').primaryKey(),
  created_at: timestamp()
    .notNull()
    .default(sql`current_timestamp`),
  updated_at: timestamp()
    .notNull()
    .default(sql`current_timestamp`),

  transactionSignature: text('transaction_signature').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: false }).notNull(),
  poolAccount: varchar('pool_account', { length: 44 }).notNull(),
  predictorAccount: varchar('predictor_account', { length: 44 }).notNull(),
  poolTokenAccount: varchar('pool_token_account', { length: 44 }).notNull(),
  predictionAccount: varchar('prediction_account', { length: 44 }).notNull(),
  prediction: numeric('prediction', { precision: 25, scale: 6 }).notNull(),
  stake: bigint('stake', { mode: 'bigint' }).notNull(),
  isFeePayer: boolean('is_fee_payer').notNull(),
});

export type Prediction = typeof predictionsTable.$inferSelect;
export type NewPrediction = typeof predictionsTable.$inferInsert;
