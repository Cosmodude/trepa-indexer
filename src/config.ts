import { DataSourceBuilder } from '@subsquid/solana-stream';

import { programId } from './abi/trepa';

export const START_BLOCK_HEIGHT = 420_584_500;
export const PORTAL_URL = 'https://portal.sqd.dev/datasets/solana-devnet';
export const TREPA_PROGRAM_ID = programId;

export const dataSource = new DataSourceBuilder()
  .setPortal({
    url: PORTAL_URL,
    http: {
      retryAttempts: Infinity,
    },
  })
  .setBlockRange({ from: START_BLOCK_HEIGHT })
  .setFields({
    block: {
      timestamp: true,
    },
    transaction: {
      signatures: true,
    },
    instruction: {
      programId: true,
      data: true,
    },
  })
  .addInstruction({
    where: {
      programId: [TREPA_PROGRAM_ID],
      isCommitted: true,
    },
    include: {
      transaction: true,
      innerInstructions: true,
    },
  })
  .build();
