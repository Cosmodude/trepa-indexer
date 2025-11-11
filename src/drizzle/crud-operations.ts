import { eq } from 'drizzle-orm';

import type { DatabaseTransaction, DatabaseRecord } from './database-types';
import { classifyRecords } from './record-classifier';
import { predictions, claims } from './schema';

export async function insertRecords(
  db: DatabaseTransaction,
  records: DatabaseRecord[],
): Promise<void> {
  if (records.length === 0) return;

  const { predictedEvents, claimedEvents } = classifyRecords(records);

  if (predictedEvents.length > 0) {
    await db.insert(predictions).values(predictedEvents);
  }
  if (claimedEvents.length > 0) {
    await db.insert(claims).values(claimedEvents);
  }
}

export async function upsertRecords(
  db: DatabaseTransaction,
  records: DatabaseRecord[],
): Promise<void> {
  if (records.length === 0) return;

  const { predictedEvents, claimedEvents } = classifyRecords(records);

  if (predictedEvents.length > 0) {
    await db.insert(predictions).values(predictedEvents).onConflictDoNothing();
  }
  if (claimedEvents.length > 0) {
    await db.insert(claims).values(claimedEvents).onConflictDoNothing();
  }
}

export async function updateRecords(
  db: DatabaseTransaction,
  records: DatabaseRecord[],
): Promise<void> {
  if (records.length === 0) return;

  const { predictedEvents, claimedEvents } = classifyRecords(records);

  for (const event of predictedEvents) {
    await db.update(predictions).set(event).where(eq(predictions.id, event.id));
  }
  for (const event of claimedEvents) {
    if (event.id) {
      await db.update(claims).set(event).where(eq(claims.id, event.id));
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
    await db.delete(predictions).where(eq(predictions.id, event.id));
  }
  for (const event of claimedEvents) {
    if (event.id) {
      await db.delete(claims).where(eq(claims.id, event.id));
    }
  }
}
