import { run } from '@subsquid/batch-processor';
import { augmentBlock } from '@subsquid/solana-objects';
import bs58 from 'bs58';
import { config as dotenvConfig } from 'dotenv';

import * as trepa from './abi/trepa';
import { dataSource, PORTAL_URL } from './config';
import { DrizzleDatabase } from './drizzle/database';
import { processEventData } from './helpers/event-processor';

dotenvConfig();

console.log('Data source configuration:');
console.log('- Portal URL: ', PORTAL_URL);
console.log('- Trepa Program ID: ', trepa.programId);
console.log('- Tracking Trepa program cpi_emit inner instructions');

async function startIndexer() {
  console.log('Starting indexer with timeout...');

  const timeout = setTimeout(() => {
    console.log('Indexer timeout - no data received in 30 seconds');
    process.exit(0);
  }, 30_000);

  const db = new DrizzleDatabase();

  await run(dataSource, db as any, async (ctx) => {
    clearTimeout(timeout);

    try {
      const blocks = ctx.blocks.map(augmentBlock);

      const collections = {
        predictedEvents: [],
        claimedEvents: [],
      };

      console.log(
        `Processing ${blocks.length} blocks (at block height ${blocks[0]?.header.number || 'unknown'})`,
      );

      for (const block of blocks) {
        const timestamp = new Date(block.header.timestamp * 1000);

        for (const instruction of block.instructions) {
          if (instruction.programId !== trepa.programId) {
            continue;
          }

          if (!instruction.inner || instruction.inner.length === 0) {
            continue;
          }

          const trepaInnerOnly = instruction.inner.filter(
            (inner) => inner.programId === trepa.programId,
          );

          if (trepaInnerOnly.length === 0) {
            continue;
          }

          const txSignature = instruction.getTransaction()?.signatures?.[0];
          if (!txSignature) {
            console.error('Transaction signature not found');
            continue;
          }

          for (const innerInstruction of trepaInnerOnly) {
            if (!innerInstruction.data) {
              continue;
            }

            let dataBuffer: Buffer;
            try {
              dataBuffer = Buffer.from(bs58.decode(innerInstruction.data));
            } catch (e) {
              console.error(
                'Failed to decode instruction data from base58:',
                e,
              );
              continue;
            }

            if (dataBuffer.length <= 8) {
              continue;
            }

            const eventDataBuffer = dataBuffer.subarray(8);
            const eventDataHex = '0x' + eventDataBuffer.toString('hex');

            processEventData(
              eventDataBuffer.subarray(0, 8),
              eventDataHex,
              timestamp,
              txSignature,
              collections,
            );
          }
        }
      }

      if (
        collections.predictedEvents.length > 0 ||
        collections.claimedEvents.length > 0
      ) {
        const allEvents = [
          ...collections.predictedEvents,
          ...collections.claimedEvents,
        ];
        await db.upsert(allEvents);
        console.log(`\nUpserted ${allEvents.length} events into database`);
      }
    } catch (error) {
      console.error('Failed to process blocks:', error);
      throw error;
    }
  });
}

startIndexer().catch((error) => {
  console.error('Indexer failed:', error);

  // If it's a parsing error for a specific transaction, we can continue
  if (error.message && error.message.includes('missing invoke message')) {
    console.log(
      'Encountered transaction parsing error - this is expected for router/executor calls',
    );
    console.log('The indexer will continue processing other transactions');
    console.log('Restarting indexer...');
    setTimeout(() => {
      startIndexer().catch((restartError) => {
        console.error('Indexer restart failed:', restartError);
        process.exit(1);
      });
    }, 1000);
  } else {
    process.exit(1);
  }
});
