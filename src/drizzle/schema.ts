import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const predictedEvent = pgTable('predicted_event', {
  id: varchar('id').primaryKey(),
  transactionSignature: text('transaction_signature').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  poolAccount: text('pool_account').notNull(),
  predictor: text('predictor').notNull(),
  poolTokenAccount: text('pool_token_account').notNull(),
  predictionAccount: text('prediction_account').notNull(),
  stake: text('stake').notNull(),
  feePayer: text('fee_payer').notNull(),
});

export const claimedEvent = pgTable('claimed_event', {
  id: varchar('id').primaryKey(),
  transactionSignature: text('transaction_signature').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  poolAccount: text('pool_account').notNull(),
  predictor: text('predictor').notNull(),
  poolTokenAccount: text('pool_token_account').notNull(),
  predictionAccount: text('prediction_account').notNull(),
  amount: text('amount').notNull(),
  proof: text('proof').notNull(),
});

export const poolCreatedEvent = pgTable('pool_created_event', {
  id: varchar('id').primaryKey(),
  transactionSignature: text('transaction_signature').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  poolAccount: text('pool_account').notNull(),
  questionId: text('question_id').notNull(),
  predictionEndTime: text('prediction_end_time').notNull(),
  bump: text('bump').notNull(),
});

export const poolFinalizedEvent = pgTable('pool_finalized_event', {
  id: varchar('id').primaryKey(),
  transactionSignature: text('transaction_signature').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  poolAccount: text('pool_account').notNull(),
  merkleRoot: text('merkle_root').notNull(),
  protocolFee: text('protocol_fee').notNull(),
});

export type PredictedEvent = typeof predictedEvent.$inferSelect;
export type NewPredictedEvent = typeof predictedEvent.$inferInsert;

export type ClaimedEvent = typeof claimedEvent.$inferSelect;
export type NewClaimedEvent = typeof claimedEvent.$inferInsert;

export type PoolCreatedEvent = typeof poolCreatedEvent.$inferSelect;
export type NewPoolCreatedEvent = typeof poolCreatedEvent.$inferInsert;

export type PoolFinalizedEvent = typeof poolFinalizedEvent.$inferSelect;
export type NewPoolFinalizedEvent = typeof poolFinalizedEvent.$inferInsert;
