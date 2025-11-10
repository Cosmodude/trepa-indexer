import { db } from './db';
import {
  predictions,
  claims,
  type NewPrediction,
  type NewClaim,
} from './schema';
import { START_BLOCK_HEIGHT } from '../config';

export class DrizzleDatabase {
  async connect(): Promise<{ height: number; hash: string }> {
    // Return the starting block height from the main configuration
    // This should match START_BLOCK_HEIGHT in main.ts
    return {
      height: START_BLOCK_HEIGHT,
      hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    };
  }

  async insert(records: any[]): Promise<void> {
    if (records.length === 0) return;

    // Group records by type
    const predictedEvents: NewPrediction[] = [];
    const claimedEvents: NewClaim[] = [];

    for (const record of records) {
      if (record instanceof Object && 'stake' in record) {
        predictedEvents.push(record as NewPrediction);
      } else if (record instanceof Object && 'amount' in record) {
        claimedEvents.push(record as NewClaim);
      }
    }

    // Insert each type of event
    if (predictedEvents.length > 0) {
      await db.insert(predictions).values(predictedEvents);
    }
    if (claimedEvents.length > 0) {
      await db.insert(claims).values(claimedEvents);
    }
  }

  async upsert(records: any[]): Promise<void> {
    if (records.length === 0) return;

    // Group records by type
    const predictedEvents: NewPrediction[] = [];
    const claimedEvents: NewClaim[] = [];

    for (const record of records) {
      if (record instanceof Object && 'stake' in record) {
        predictedEvents.push(record as NewPrediction);
      } else if (record instanceof Object && 'amount' in record) {
        claimedEvents.push(record as NewClaim);
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
