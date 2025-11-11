import { eq } from 'drizzle-orm';

import { ChangeTracker } from './hot-blocks';
import {
  predictions,
  claims,
  type NewPrediction,
  type NewClaim,
} from './schema';

export function createStore(
  tx: any,
  changeTracker?: ChangeTracker,
): {
  insert: (records: any[]) => Promise<void>;
  upsert: (records: any[]) => Promise<void>;
  update: (records: any[]) => Promise<void>;
  delete: (records: any[]) => Promise<void>;
} {
  const running = { value: true };

  return {
    insert: async (records: any[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      const predictedEvents: NewPrediction[] = [];
      const claimedEvents: NewClaim[] = [];

      for (const record of records) {
        if (record instanceof Object && 'stake' in record) {
          predictedEvents.push(record as NewPrediction);
          if (changeTracker) {
            await changeTracker.recordInsert('predictions', record);
          }
        } else if (record instanceof Object && 'amount' in record) {
          claimedEvents.push(record as NewClaim);
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
    upsert: async (records: any[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      const predictedEvents: NewPrediction[] = [];
      const claimedEvents: NewClaim[] = [];

      for (const record of records) {
        if (record instanceof Object && 'stake' in record) {
          predictedEvents.push(record as NewPrediction);
        } else if (record instanceof Object && 'amount' in record) {
          claimedEvents.push(record as NewClaim);
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
    update: async (records: any[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      for (const record of records) {
        if (record instanceof Object && 'stake' in record) {
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
        } else if (record instanceof Object && 'amount' in record) {
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
    delete: async (records: any[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      for (const record of records) {
        if (record instanceof Object && 'stake' in record) {
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
        } else if (record instanceof Object && 'amount' in record) {
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
  cb: (store: any) => Promise<void>,
  tx: any,
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
