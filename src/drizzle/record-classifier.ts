import type { NewPrediction, NewClaim } from './schema';
import { isPredictionRecord, isClaimRecord } from './type-guards';

export interface ClassifiedRecords {
  predictedEvents: NewPrediction[];
  claimedEvents: NewClaim[];
}

export function classifyRecords(records: any[]): ClassifiedRecords {
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
