import type { NewPrediction, NewClaim } from './schema';

export function isPredictionRecord(record: unknown): record is NewPrediction {
  return (
    typeof record === 'object' &&
    record !== null &&
    'stake' in record &&
    !('amount' in record)
  );
}

export function isClaimRecord(record: unknown): record is NewClaim {
  return (
    typeof record === 'object' &&
    record !== null &&
    'amount' in record &&
    !('stake' in record)
  );
}
