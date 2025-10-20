import { Database } from '@subsquid/batch-processor';
import { db } from './db';
import { 
  predictedEvent, 
  claimedEvent, 
  poolCreatedEvent, 
  poolFinalizedEvent,
  type NewPredictedEvent,
  type NewClaimedEvent,
  type NewPoolCreatedEvent,
  type NewPoolFinalizedEvent
} from './schema';

export class DrizzleDatabase {
  async connect(): Promise<void> {
    // Connection is handled by the db instance in db.ts
    // This method is required by Subsquid but we don't need to do anything here
    // since the connection is already established
  }

  async insert(records: any[]): Promise<void> {
    if (records.length === 0) return;

    // Group records by type
    const predictedEvents: NewPredictedEvent[] = [];
    const claimedEvents: NewClaimedEvent[] = [];
    const createdEvents: NewPoolCreatedEvent[] = [];
    const finalizedEvents: NewPoolFinalizedEvent[] = [];

    for (const record of records) {
      if (record instanceof Object && 'stake' in record) {
        predictedEvents.push(record as NewPredictedEvent);
      } else if (record instanceof Object && 'amount' in record) {
        claimedEvents.push(record as NewClaimedEvent);
      } else if (record instanceof Object && 'questionId' in record) {
        createdEvents.push(record as NewPoolCreatedEvent);
      } else if (record instanceof Object && 'merkleRoot' in record) {
        finalizedEvents.push(record as NewPoolFinalizedEvent);
      }
    }

    // Insert each type of event
    if (predictedEvents.length > 0) {
      await db.insert(predictedEvent).values(predictedEvents);
    }
    if (claimedEvents.length > 0) {
      await db.insert(claimedEvent).values(claimedEvents);
    }
    if (createdEvents.length > 0) {
      await db.insert(poolCreatedEvent).values(createdEvents);
    }
    if (finalizedEvents.length > 0) {
      await db.insert(poolFinalizedEvent).values(finalizedEvents);
    }
  }

  async upsert(records: any[]): Promise<void> {
    // For now, just use insert - you can implement proper upsert logic if needed
    await this.insert(records);
  }

  async update(records: any[]): Promise<void> {
    // Implement update logic if needed
    throw new Error('Update not implemented yet');
  }

  async delete(records: any[]): Promise<void> {
    // Implement delete logic if needed
    throw new Error('Delete not implemented yet');
  }
}
