import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type {
  NodePgQueryResultHKT,
  NodePgDatabase,
} from 'drizzle-orm/node-postgres';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { Pool } from 'pg';

import type * as schema from './schema';

export type DatabaseTransaction =
  | PgTransaction<
      NodePgQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >
  | (NodePgDatabase<Record<string, unknown>> & { $client: Pool });

export type DatabaseRecord =
  | schema.NewPrediction
  | schema.NewClaim
  | schema.NewHotBlock
  | schema.NewHotChangeLog
  | schema.NewStatus;

export interface Store {
  insert: (records: DatabaseRecord[]) => Promise<void>;
  upsert: (records: DatabaseRecord[]) => Promise<void>;
  update: (records: DatabaseRecord[]) => Promise<void>;
  delete: (records: DatabaseRecord[]) => Promise<void>;
}

export type StoreCallback = (store: Store) => Promise<void>;

export interface TransactionInfo {
  [key: string]: unknown;
}
