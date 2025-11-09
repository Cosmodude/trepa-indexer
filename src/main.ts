import { run } from '@subsquid/batch-processor';
import { augmentBlock } from '@subsquid/solana-objects';
import { config as dotenvConfig } from 'dotenv';

import * as trepa from './abi/trepa';
import { dataSource, PORTAL_URL } from './config';
import { DrizzleDatabase } from './drizzle/database';

dotenvConfig();

console.log('Data source configuration:');
console.log('- Portal URL: ', PORTAL_URL);
console.log('- Trepa Program ID: ', trepa.programId);
console.log('- Tracking Trepa program instructions and inner instructions');

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
        createdEvents: [],
        finalizedEvents: [],
      };

      console.log(
        `Processing ${blocks.length} blocks (at block height ${blocks[0]?.header.number || 'unknown'})`,
      );

      let trepaInnerInstructions = 0;
      const processedEvents = 0;

      for (const block of blocks) {
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

          console.log(
            'Trepa inner instructions:',
            JSON.stringify(trepaInnerOnly, null, 2),
          );
          trepaInnerInstructions += trepaInnerOnly.length;
        }
      }

      if (
        collections.predictedEvents.length > 0 ||
        collections.claimedEvents.length > 0 ||
        collections.createdEvents.length > 0 ||
        collections.finalizedEvents.length > 0
      ) {
        const allEvents = [
          ...collections.predictedEvents,
          ...collections.claimedEvents,
          ...collections.createdEvents,
          ...collections.finalizedEvents,
        ];
        await db.insert(allEvents);
        console.log(`\nInserted ${allEvents.length} events into database`);
      }

      console.log('\n=== SUMMARY ===');
      console.log(`Trepa inner instructions: ${trepaInnerInstructions}`);
      console.log(`Processed events: ${processedEvents}`);
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
