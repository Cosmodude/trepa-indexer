import { eq } from 'drizzle-orm';

import type { DatabaseTransaction, DatabaseRecord } from './database-types';
import { classifyRecords } from './record-classifier';
import { schema } from '../drizzle';

export async function insertRecords(
  db: DatabaseTransaction,
  records: DatabaseRecord[],
): Promise<void> {
  if (records.length === 0) return;

  const { predictedEvents, claimedEvents } = classifyRecords(records);

  if (predictedEvents.length > 0) {
    await db.insert(schema.predictionsTable).values(predictedEvents);
  }
  if (claimedEvents.length > 0) {
    await db.insert(schema.claimsTable).values(claimedEvents);
  }
}

export async function upsertRecords(
  db: DatabaseTransaction,
  records: DatabaseRecord[],
): Promise<void> {
  if (records.length === 0) return;

  const { predictedEvents, claimedEvents } = classifyRecords(records);

  if (predictedEvents.length > 0) {
    await db
      .insert(schema.predictionsTable)
      .values(predictedEvents)
      .onConflictDoNothing();
  }
  if (claimedEvents.length > 0) {
    await db
      .insert(schema.claimsTable)
      .values(claimedEvents)
      .onConflictDoNothing();
  }
}

export async function updateRecords(
  db: DatabaseTransaction,
  records: DatabaseRecord[],
): Promise<void> {
  if (records.length === 0) return;

  const { predictedEvents, claimedEvents } = classifyRecords(records);

  for (const event of predictedEvents) {
    if (event.predictionAccount) {
      const { id: _id, predictionAccount, ...updateData } = event;

      await db
        .update(schema.predictionsTable)
        .set(updateData)
        .where(
          eq(schema.predictionsTable.predictionAccount, predictionAccount),
        );
    } else if (event.id) {
      const { id: _id, ...updateData } = event;
      await db
        .update(schema.predictionsTable)
        .set(updateData)
        .where(eq(schema.predictionsTable.id, event.id));
    }
  }
  for (const event of claimedEvents) {
    if (event.id) {
      const { id: _id, ...updateData } = event;
      await db
        .update(schema.claimsTable)
        .set(updateData)
        .where(eq(schema.claimsTable.id, event.id));
    }
  }
}

export async function deleteRecords(
  db: DatabaseTransaction,
  records: DatabaseRecord[],
): Promise<void> {
  if (records.length === 0) return;

  const { predictedEvents, claimedEvents } = classifyRecords(records);

  for (const event of predictedEvents) {
    if (event.id) {
      await db
        .delete(schema.predictionsTable)
        .where(eq(schema.predictionsTable.id, event.id));
    }
  }
  for (const event of claimedEvents) {
    if (event.id) {
      await db
        .delete(schema.claimsTable)
        .where(eq(schema.claimsTable.id, event.id));
    }
  }
}
