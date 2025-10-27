import { event } from '../abi.support';
import {
  ConfigUpdatedEvent as ConfigUpdatedEvent_,
  PoolClaimedEvent as PoolClaimedEvent_,
  PoolCreatedEvent as PoolCreatedEvent_,
  PoolFinalizedEvent as PoolFinalizedEvent_,
  PoolPredictedEvent as PoolPredictedEvent_,
} from './types';

export type ConfigUpdatedEvent = ConfigUpdatedEvent_;

export const ConfigUpdatedEvent = event(
  {
    d8: '0xf59e81633c64d6dc',
  },
  ConfigUpdatedEvent_,
);

export type PoolClaimedEvent = PoolClaimedEvent_;

export const PoolClaimedEvent = event(
  {
    d8: '0xe8fde8ed0f43731a',
  },
  PoolClaimedEvent_,
);

export type PoolCreatedEvent = PoolCreatedEvent_;

export const PoolCreatedEvent = event(
  {
    d8: '0x195e4b2f7063353f',
  },
  PoolCreatedEvent_,
);

export type PoolFinalizedEvent = PoolFinalizedEvent_;

export const PoolFinalizedEvent = event(
  {
    d8: '0x4691cfbd8aacd0c2',
  },
  PoolFinalizedEvent_,
);

export type PoolPredictedEvent = PoolPredictedEvent_;

export const PoolPredictedEvent = event(
  {
    d8: '0x579c4e56484cff00',
  },
  PoolPredictedEvent_,
);
