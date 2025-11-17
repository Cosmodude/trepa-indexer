import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  uuid,
  bigint,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const claimsTable = pgTable(
  'claims',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    created_at: timestamp()
      .notNull()
      .default(sql`current_timestamp`),
    updated_at: timestamp()
      .notNull()
      .default(sql`current_timestamp`),
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
    index('idx_claims_created_at').on(t.created_at),
  ],
);

export type Claim = typeof claimsTable.$inferSelect;
export type NewClaim = typeof claimsTable.$inferInsert;
