import { eq } from 'drizzle-orm';

import type {
  DatabaseTransaction,
  DatabaseRecord,
  Store,
  StoreCallback,
} from './database-types';
import { ChangeTracker } from './hot-blocks';
import {
  predictions,
  claims,
  type NewPrediction,
  type NewClaim,
} from './schema';
import { isPredictionRecord, isClaimRecord } from './type-guards';

export function createStore(
  tx: DatabaseTransaction,
  changeTracker?: ChangeTracker,
): Store {
  const running = { value: true };

  return {
    insert: async (records: DatabaseRecord[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      const predictedEvents: NewPrediction[] = [];
      const claimedEvents: NewClaim[] = [];

      for (const record of records) {
        if (isPredictionRecord(record)) {
          predictedEvents.push(record);
          if (changeTracker) {
            await changeTracker.recordInsert('predictions', record);
          }
        } else if (isClaimRecord(record)) {
          claimedEvents.push(record);
          if (changeTracker) {
            await changeTracker.recordInsert('claims', record);
          }
        }
      }

      if (predictedEvents.length > 0) {
        await tx.insert(predictions).values(predictedEvents);
      }
      if (claimedEvents.length > 0) {
        await tx.insert(claims).values(claimedEvents);
      }
    },
    upsert: async (records: DatabaseRecord[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      const predictedEvents: NewPrediction[] = [];
      const claimedEvents: NewClaim[] = [];

      for (const record of records) {
        if (isPredictionRecord(record)) {
          predictedEvents.push(record);
        } else if (isClaimRecord(record)) {
          claimedEvents.push(record);
        }
      }

      if (predictedEvents.length > 0) {
        const insertedPredictions = await tx
          .insert(predictions)
          .values(predictedEvents)
          .onConflictDoNothing()
          .returning({ id: predictions.id });

        if (changeTracker) {
          for (const inserted of insertedPredictions) {
            const fullRecord = predictedEvents.find(
              (p) => p.id === inserted.id,
            );
            if (fullRecord) {
              await changeTracker.recordInsert('predictions', fullRecord);
            }
          }
        }
      }
      if (claimedEvents.length > 0) {
        const insertedClaims = await tx
          .insert(claims)
          .values(claimedEvents)
          .onConflictDoNothing()
          .returning({ id: claims.id });

        if (changeTracker) {
          for (const inserted of insertedClaims) {
            const fullRecord = claimedEvents.find((c) => c.id === inserted.id);
            if (fullRecord) {
              await changeTracker.recordInsert('claims', fullRecord);
            }
          }
        }
      }
    },
    update: async (records: DatabaseRecord[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      for (const record of records) {
        if (isPredictionRecord(record)) {
          const oldEntity = await tx
            .select()
            .from(predictions)
            .where(eq(predictions.id, record.id))
            .limit(1);

          await tx
            .update(predictions)
            .set(record)
            .where(eq(predictions.id, record.id));

          if (changeTracker && oldEntity.length > 0) {
            await changeTracker.recordUpdate(
              'predictions',
              record,
              oldEntity[0],
              { id: record.id },
            );
          }
        } else if (isClaimRecord(record) && record.id) {
          const oldEntity = await tx
            .select()
            .from(claims)
            .where(eq(claims.id, record.id))
            .limit(1);

          await tx.update(claims).set(record).where(eq(claims.id, record.id));

          if (changeTracker && oldEntity.length > 0) {
            await changeTracker.recordUpdate('claims', record, oldEntity[0], {
              id: record.id,
            });
          }
        }
      }
    },
    delete: async (records: DatabaseRecord[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      for (const record of records) {
        if (isPredictionRecord(record)) {
          const oldEntity = await tx
            .select()
            .from(predictions)
            .where(eq(predictions.id, record.id))
            .limit(1);

          await tx.delete(predictions).where(eq(predictions.id, record.id));

          if (changeTracker && oldEntity.length > 0) {
            await changeTracker.recordDelete('predictions', oldEntity[0], {
              id: record.id,
            });
          }
        } else if (isClaimRecord(record) && record.id) {
          const oldEntity = await tx
            .select()
            .from(claims)
            .where(eq(claims.id, record.id))
            .limit(1);

          await tx.delete(claims).where(eq(claims.id, record.id));

          if (changeTracker && oldEntity.length > 0) {
            await changeTracker.recordDelete('claims', oldEntity[0], {
              id: record.id,
            });
          }
        }
      }
    },
  };
}

export async function performUpdates(
  cb: StoreCallback,
  tx: DatabaseTransaction,
  changeTracker?: ChangeTracker,
): Promise<void> {
  const store = createStore(tx, changeTracker);

  try {
    await cb(store);
    if (changeTracker) {
      await changeTracker.persist();
    }
  } finally {
    (store as any).running = { value: false };
  }
}
