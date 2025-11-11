import { eq, sql } from 'drizzle-orm';

import type { DatabaseTransaction } from '../database-types';
import { predictions, claims, hotChangeLog, hotBlock } from '../schema';
import type { DBChange } from './types';

export async function applyRollbackChange(
  tx: DatabaseTransaction,
  change: DBChange,
): Promise<void> {
  switch (change.type) {
    case 'insert':
      if (change.table === 'predictions') {
        await tx
          .delete(predictions)
          .where(eq(predictions.id, change.entity.id));
      } else if (change.table === 'claims') {
        await tx.delete(claims).where(eq(claims.id, change.entity.id));
      }
      break;
    case 'update':
      if (change.oldEntity) {
        if (change.table === 'predictions') {
          await tx
            .update(predictions)
            .set(change.oldEntity)
            .where(eq(predictions.id, change.oldEntity.id));
        } else if (change.table === 'claims') {
          await tx
            .update(claims)
            .set(change.oldEntity)
            .where(eq(claims.id, change.oldEntity.id));
        }
      }
      break;
    case 'delete':
      if (change.entity) {
        if (change.table === 'predictions') {
          await tx
            .insert(predictions)
            .values(change.entity)
            .onConflictDoNothing();
        } else if (change.table === 'claims') {
          await tx.insert(claims).values(change.entity).onConflictDoNothing();
        }
      }
      break;
  }
}

export async function rollbackBlock(
  tx: DatabaseTransaction,
  blockHeight: number,
): Promise<void> {
  const changes = await tx
    .select()
    .from(hotChangeLog)
    .where(eq(hotChangeLog.blockHeight, blockHeight))
    .orderBy(sql`${hotChangeLog.index} DESC`);

  for (const changeLog of changes) {
    await applyRollbackChange(tx, changeLog.change as DBChange);
  }

  await tx
    .delete(hotChangeLog)
    .where(eq(hotChangeLog.blockHeight, blockHeight));
  await tx.delete(hotBlock).where(eq(hotBlock.height, blockHeight));
}
