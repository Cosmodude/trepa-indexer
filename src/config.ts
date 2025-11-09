import { DataSourceBuilder } from '@subsquid/solana-stream';

export const START_BLOCK_HEIGHT = 420_371_800;
export const PORTAL_URL = 'https://portal.sqd.dev/datasets/solana-devnet';

export const dataSource = new DataSourceBuilder()
  .setPortal({
    url: PORTAL_URL,
    http: {
      retryAttempts: Infinity,
    },
  })
  .setBlockRange({ from: START_BLOCK_HEIGHT, to: START_BLOCK_HEIGHT + 1000 })
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
    include: {
      transaction: true,
      innerInstructions: true,
    },
  })
  .build();
