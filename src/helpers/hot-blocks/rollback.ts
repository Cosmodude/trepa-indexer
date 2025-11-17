import { eq, sql } from 'drizzle-orm';

import { schema } from '../../drizzle';
import type { DatabaseTransaction } from '../database-types';
import type { DBChange } from './types';

export async function applyRollbackChange(
  tx: DatabaseTransaction,
  change: DBChange,
): Promise<void> {
  switch (change.type) {
    case 'insert':
      if (change.table === 'predictions') {
        await tx
          .delete(schema.predictionsTable)
          .where(eq(schema.predictionsTable.id, change.entity.id));
      } else if (change.table === 'claims') {
        await tx
          .delete(schema.claimsTable)
          .where(eq(schema.claimsTable.id, change.entity.id));
      }
      break;
    case 'update':
      if (change.oldEntity) {
        if (change.table === 'predictions') {
          await tx
            .update(schema.predictionsTable)
            .set(change.oldEntity)
            .where(eq(schema.predictionsTable.id, change.oldEntity.id));
        } else if (change.table === 'claims') {
          await tx
            .update(schema.claimsTable)
            .set(change.oldEntity)
            .where(eq(schema.claimsTable.id, change.oldEntity.id));
        }
      }
      break;
    case 'delete':
      if (change.entity) {
        if (change.table === 'predictions') {
          await tx
            .insert(schema.predictionsTable)
            .values(change.entity)
            .onConflictDoNothing();
        } else if (change.table === 'claims') {
          await tx
            .insert(schema.claimsTable)
            .values(change.entity)
            .onConflictDoNothing();
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
    .from(schema.hotChangeLogTable)
    .where(eq(schema.hotChangeLogTable.blockHeight, blockHeight))
    .orderBy(sql`${schema.hotChangeLogTable.index} DESC`);

  for (const changeLog of changes) {
    await applyRollbackChange(tx, changeLog.change as DBChange);
  }

  await tx
    .delete(schema.hotChangeLogTable)
    .where(eq(schema.hotChangeLogTable.blockHeight, blockHeight));
  await tx
    .delete(schema.hotBlockTable)
    .where(eq(schema.hotBlockTable.height, blockHeight));
}
