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
    throw new Error(
      `First block height ${chain[0].height} must be greater than base height ${base.height}`,
    );
  }
  for (let i = 1; i < chain.length; i++) {
    if (chain[i].height <= chain[i - 1].height) {
      throw new Error(
        `Block heights must be strictly increasing: block[${i}].height (${chain[i].height}) must be greater than block[${i - 1}].height (${chain[i - 1].height})`,
      );
    }
  }
}

export const RACE_MSG =
  'status table was updated by foreign process, make sure no other processor is running';
