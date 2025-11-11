import { lte, eq, and } from 'drizzle-orm';

import type { DatabaseTransaction } from '../database-types';
import { schema } from '../../drizzle';
import type { HashAndHeight } from './types';
import { RACE_MSG } from './utils';

export async function insertHotBlock(
  tx: DatabaseTransaction,
  block: HashAndHeight,
): Promise<void> {
  await tx
    .insert(schema.hotBlockTable)
    .values({
      height: block.height,
      hash: block.hash,
    })
    .onConflictDoNothing();
}

export async function deleteHotBlocks(
  tx: DatabaseTransaction,
  finalizedHeight: number,
): Promise<void> {
  await tx
    .delete(schema.hotBlockTable)
    .where(lte(schema.hotBlockTable.height, finalizedHeight));
}

export async function updateStatus(
  tx: DatabaseTransaction,
  nonce: number,
  next: HashAndHeight,
): Promise<void> {
  const result = await tx
    .update(schema.statusTable)
    .set({
      height: next.height,
      hash: next.hash,
      nonce: nonce + 1,
    })
    .where(
      and(eq(schema.statusTable.id, 0), eq(schema.statusTable.nonce, nonce)),
    )
    .returning();

  if (result.length === 0) {
    throw new Error(RACE_MSG);
  }
}
