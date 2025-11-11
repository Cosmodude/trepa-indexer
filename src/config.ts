import { config as dotenvConfig } from 'dotenv';
import { DataSourceBuilder } from '@subsquid/solana-stream';

import * as trepa from './abi/trepa';

dotenvConfig();

export const START_BLOCK_HEIGHT = Number(process.env.START_BLOCK_HEIGHT!);
export const PORTAL_URL = process.env.PORTAL_URL!;
export const TREPA_PROGRAM_ID = trepa.programId;

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
