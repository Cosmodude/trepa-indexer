import { eq } from 'drizzle-orm';

import type {
  DatabaseTransaction,
  DatabaseRecord,
  Store,
  StoreCallback,
} from './database-types';
import { ChangeTracker } from './hot-blocks';
import { classifyRecords } from './record-classifier';
import { schema } from '../drizzle';

export function createStore(
  tx: DatabaseTransaction,
  changeTracker?: ChangeTracker,
): { store: Store; running: { value: boolean } } {
  const running = { value: true };

  const store: Store = {
    insert: async (records: DatabaseRecord[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      const { predictedEvents, claimedEvents } = classifyRecords(records);

      if (changeTracker) {
        for (const record of predictedEvents) {
          await changeTracker.recordInsert('predictions', record);
        }
        for (const record of claimedEvents) {
          await changeTracker.recordInsert('claims', record);
        }
      }

      if (predictedEvents.length > 0) {
        await tx.insert(schema.predictionsTable).values(predictedEvents);
      }
      if (claimedEvents.length > 0) {
        await tx.insert(schema.claimsTable).values(claimedEvents);
      }
    },
    upsert: async (records: DatabaseRecord[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      const { predictedEvents, claimedEvents } = classifyRecords(records);

      if (predictedEvents.length > 0) {
        const insertedPredictions = await tx
          .insert(schema.predictionsTable)
          .values(predictedEvents)
          .onConflictDoNothing()
          .returning({ id: schema.predictionsTable.id });

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
          .insert(schema.claimsTable)
          .values(claimedEvents)
          .onConflictDoNothing()
          .returning({ id: schema.claimsTable.id });

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

      const { predictedEvents, claimedEvents } = classifyRecords(records);

      for (const record of predictedEvents) {
        if (record.id) {
          if (changeTracker) {
            const oldEntity = await tx
              .select()
              .from(schema.predictionsTable)
              .where(eq(schema.predictionsTable.id, record.id))
              .limit(1);

            await tx
              .update(schema.predictionsTable)
              .set(record)
              .where(eq(schema.predictionsTable.id, record.id));

            if (oldEntity.length > 0) {
              await changeTracker.recordUpdate(
                'predictions',
                record,
                oldEntity[0],
                { id: record.id },
              );
            }
          } else {
            await tx
              .update(schema.predictionsTable)
              .set(record)
              .where(eq(schema.predictionsTable.id, record.id));
          }
        }
      }

      for (const record of claimedEvents) {
        if (record.id) {
          if (changeTracker) {
            const oldEntity = await tx
              .select()
              .from(schema.claimsTable)
              .where(eq(schema.claimsTable.id, record.id))
              .limit(1);

            await tx
              .update(schema.claimsTable)
              .set(record)
              .where(eq(schema.claimsTable.id, record.id));

            if (oldEntity.length > 0) {
              await changeTracker.recordUpdate('claims', record, oldEntity[0], {
                id: record.id,
              });
            }
          } else {
            await tx
              .update(schema.claimsTable)
              .set(record)
              .where(eq(schema.claimsTable.id, record.id));
          }
        }
      }
    },
    delete: async (records: DatabaseRecord[]) => {
      if (!running.value) throw new Error('too late to perform db updates');

      if (records.length === 0) return;

      const { predictedEvents, claimedEvents } = classifyRecords(records);

      for (const record of predictedEvents) {
        if (record.id) {
          if (changeTracker) {
            const oldEntity = await tx
              .select()
              .from(schema.predictionsTable)
              .where(eq(schema.predictionsTable.id, record.id))
              .limit(1);

            await tx
              .delete(schema.predictionsTable)
              .where(eq(schema.predictionsTable.id, record.id));

            if (oldEntity.length > 0) {
              await changeTracker.recordDelete('predictions', oldEntity[0], {
                id: record.id,
              });
            }
          } else {
            await tx
              .delete(schema.predictionsTable)
              .where(eq(schema.predictionsTable.id, record.id));
          }
        }
      }

      for (const record of claimedEvents) {
        if (record.id) {
          if (changeTracker) {
            const oldEntity = await tx
              .select()
              .from(schema.claimsTable)
              .where(eq(schema.claimsTable.id, record.id))
              .limit(1);

            await tx
              .delete(schema.claimsTable)
              .where(eq(schema.claimsTable.id, record.id));

            if (oldEntity.length > 0) {
              await changeTracker.recordDelete('claims', oldEntity[0], {
                id: record.id,
              });
            }
          } else {
            await tx
              .delete(schema.claimsTable)
              .where(eq(schema.claimsTable.id, record.id));
          }
        }
      }
    },
  };

  return { store, running };
}

export async function performUpdates(
  cb: StoreCallback,
  tx: DatabaseTransaction,
  changeTracker?: ChangeTracker,
): Promise<void> {
  const { store, running } = createStore(tx, changeTracker);

  try {
    await cb(store);
    if (changeTracker) {
      await changeTracker.persist();
    }
  } finally {
    running.value = false;
  }
}
