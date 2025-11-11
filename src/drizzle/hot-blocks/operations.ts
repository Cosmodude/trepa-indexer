import { lte, eq, and } from 'drizzle-orm';

import type { DatabaseTransaction } from '../database-types';
import { hotBlock, status } from '../schema';
import type { HashAndHeight } from './types';
import { RACE_MSG } from './utils';

export async function insertHotBlock(
  tx: DatabaseTransaction,
  block: HashAndHeight,
): Promise<void> {
  await tx
    .insert(hotBlock)
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
  await tx.delete(hotBlock).where(lte(hotBlock.height, finalizedHeight));
}

export async function updateStatus(
  tx: DatabaseTransaction,
  nonce: number,
  next: HashAndHeight,
): Promise<void> {
  const result = await tx
    .update(status)
    .set({
      height: next.height,
      hash: next.hash,
      nonce: nonce + 1,
    })
    .where(and(eq(status.id, 0), eq(status.nonce, nonce)))
    .returning();

  if (result.length === 0) {
    throw new Error(RACE_MSG);
  }
}
