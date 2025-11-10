import { db } from './db';
import {
  predictions,
  claims,
  poolCreatedEvent,
  poolFinalizedEvent,
  type NewPrediction,
  type NewClaim,
  type NewPoolCreatedEvent,
  type NewPoolFinalizedEvent,
} from './schema';

export class DrizzleDatabase {
  async connect(): Promise<{ height: number; hash: string }> {
    // Return the starting block height from the main configuration
    // This should match START_BLOCK_HEIGHT in main.ts
    return {
      height: 399_335_925,
      hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    };
  }

  async insert(records: any[]): Promise<void> {
    if (records.length === 0) return;

    // Group records by type
    const predictedEvents: NewPrediction[] = [];
    const claimedEvents: NewClaim[] = [];
    const createdEvents: NewPoolCreatedEvent[] = [];
    const finalizedEvents: NewPoolFinalizedEvent[] = [];

    for (const record of records) {
      if (record instanceof Object && 'stake' in record) {
        predictedEvents.push(record as NewPrediction);
      } else if (record instanceof Object && 'amount' in record) {
        claimedEvents.push(record as NewClaim);
      } else if (record instanceof Object && 'questionId' in record) {
        createdEvents.push(record as NewPoolCreatedEvent);
      } else if (record instanceof Object && 'merkleRoot' in record) {
        finalizedEvents.push(record as NewPoolFinalizedEvent);
      }
    }

    // Insert each type of event
    if (predictedEvents.length > 0) {
      await db.insert(predictions).values(predictedEvents);
    }
    if (claimedEvents.length > 0) {
      await db.insert(claims).values(claimedEvents);
    }
    if (createdEvents.length > 0) {
      await db.insert(poolCreatedEvent).values(createdEvents);
    }
    if (finalizedEvents.length > 0) {
      await db.insert(poolFinalizedEvent).values(finalizedEvents);
    }
  }

  async upsert(records: any[]): Promise<void> {
    if (records.length === 0) return;

    // Group records by type
    const predictedEvents: NewPrediction[] = [];
    const claimedEvents: NewClaim[] = [];
    const createdEvents: NewPoolCreatedEvent[] = [];
    const finalizedEvents: NewPoolFinalizedEvent[] = [];

    for (const record of records) {
      if (record instanceof Object && 'stake' in record) {
        predictedEvents.push(record as NewPrediction);
      } else if (record instanceof Object && 'amount' in record) {
        claimedEvents.push(record as NewClaim);
      } else if (record instanceof Object && 'questionId' in record) {
        createdEvents.push(record as NewPoolCreatedEvent);
      } else if (record instanceof Object && 'merkleRoot' in record) {
        finalizedEvents.push(record as NewPoolFinalizedEvent);
      }
    }

    // Use ON CONFLICT DO NOTHING for upsert behavior
    if (predictedEvents.length > 0) {
      await db
        .insert(predictions)
        .values(predictedEvents)
        .onConflictDoNothing();
    }
    if (claimedEvents.length > 0) {
      await db.insert(claims).values(claimedEvents).onConflictDoNothing();
    }
    if (createdEvents.length > 0) {
      await db
        .insert(poolCreatedEvent)
        .values(createdEvents)
        .onConflictDoNothing();
    }
    if (finalizedEvents.length > 0) {
      await db
        .insert(poolFinalizedEvent)
        .values(finalizedEvents)
        .onConflictDoNothing();
    }
  }

  async update(_records: any[]): Promise<void> {
    // Implement update logic if needed
    throw new Error('Update not implemented yet');
  }

  async delete(_records: any[]): Promise<void> {
    // Implement delete logic if needed
    throw new Error('Delete not implemented yet');
  }

  async transact(info: any, cb: (store: any) => Promise<void>): Promise<void> {
    // Execute the callback with the store (which is this database instance)
    await cb(this);
  }
}
