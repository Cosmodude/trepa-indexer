import {
  pgTable,
  text,
  timestamp,
  varchar,
  numeric,
  bigint,
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
  stake: bigint('stake', { mode: 'bigint' }).notNull(),
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
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
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

export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;

export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;
