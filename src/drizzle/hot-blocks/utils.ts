import type { HashAndHeight } from './types';

export function last<T>(arr: T[]): T | undefined {
  return arr.length ? arr[arr.length - 1] : undefined;
}

export function maybeLast<T>(arr?: T[]): T | undefined {
  return arr ? last(arr) : undefined;
}

export function assertChainContinuity(
  base: HashAndHeight,
  chain: HashAndHeight[],
) {
  if (chain.length && chain[0].height <= base.height) {
    throw new Error('first block must be > base');
  }
  for (let i = 1; i < chain.length; i++) {
    if (chain[i].height <= chain[i - 1].height) {
      throw new Error('blocks must be strictly increasing');
    }
  }
}

export const RACE_MSG =
  'status table was updated by foreign process, make sure no other processor is running';
