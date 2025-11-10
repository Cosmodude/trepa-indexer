import {
  pgTable,
  text,
  timestamp,
  varchar,
  numeric,
  integer,
  boolean,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const predictions = pgTable('predictions', {
  id: varchar('id').primaryKey(),
  transactionSignature: text('transaction_signature').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: false }).notNull(),
  poolAccount: varchar('pool_account', { length: 44 }).notNull(),
  predictorAccount: varchar('predictor_account', { length: 44 }).notNull(),
  poolTokenAccount: varchar('pool_token_account', { length: 44 }).notNull(),
  predictionAccount: varchar('prediction_account', { length: 44 }).notNull(),
  prediction: numeric('prediction', { precision: 25, scale: 6 }).notNull(),
  stake: integer('stake').notNull(),
  isFeePayer: boolean('is_fee_payer').notNull(),
});

export const claims = pgTable(
  'claims',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    rewardId: uuid('reward_id'),
    userWalletAddress: varchar('user_wallet_address', { length: 44 }).notNull(),
    predictionAccount: varchar('prediction_account', { length: 44 }).notNull(),
    amount: integer('amount').notNull(),
  },
  (t) => [
    uniqueIndex('idx_claims_prediction_user').on(
      t.predictionAccount,
      t.userWalletAddress,
    ),
    index('idx_claims_user_wallet').on(t.userWalletAddress),
    index('idx_claims_created_at').on(t.createdAt),
  ],
);

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

export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;

export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;

export type PoolCreatedEvent = typeof poolCreatedEvent.$inferSelect;
export type NewPoolCreatedEvent = typeof poolCreatedEvent.$inferInsert;

export type PoolFinalizedEvent = typeof poolFinalizedEvent.$inferSelect;
export type NewPoolFinalizedEvent = typeof poolFinalizedEvent.$inferInsert;
