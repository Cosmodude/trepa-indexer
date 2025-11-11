import type { NewPrediction, NewClaim } from './schema';

export interface ClassifiedRecords {
  predictedEvents: NewPrediction[];
  claimedEvents: NewClaim[];
}

export function classifyRecords(records: any[]): ClassifiedRecords {
  const predictedEvents: NewPrediction[] = [];
  const claimedEvents: NewClaim[] = [];

  for (const record of records) {
    if (record instanceof Object && 'stake' in record) {
      predictedEvents.push(record as NewPrediction);
    } else if (record instanceof Object && 'amount' in record) {
      claimedEvents.push(record as NewClaim);
    }
  }

  return { predictedEvents, claimedEvents };
}
