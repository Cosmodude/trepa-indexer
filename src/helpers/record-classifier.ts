import type { DatabaseRecord } from './database-types';
import type { NewPrediction, NewClaim } from '../drizzle';
import { isPredictionRecord, isClaimRecord } from './type-guards';

export interface ClassifiedRecords {
  predictedEvents: NewPrediction[];
  claimedEvents: NewClaim[];
}

export function classifyRecords(records: DatabaseRecord[]): ClassifiedRecords {
  const predictedEvents: NewPrediction[] = [];
  const claimedEvents: NewClaim[] = [];

  for (const record of records) {
    if (isPredictionRecord(record)) {
      predictedEvents.push(record);
    } else if (isClaimRecord(record)) {
      claimedEvents.push(record);
    }
  }

  return { predictedEvents, claimedEvents };
}
