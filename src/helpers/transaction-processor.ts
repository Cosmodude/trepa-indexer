import type { EventCollections } from './event-processor';
import { processEventData } from './event-processor';
import {
  extractEventFromInnerInstruction,
  getEventInstructionIndex,
  getEventInstructionIndexByProgramIdIndex,
} from './instruction-processor';
import * as trepa from '../abi/trepa';

export async function processTransaction(
  instruction: any,
  transaction: any,
  blockTimestamp: number,
  collections: EventCollections,
): Promise<void> {
  const txSignature = transaction?.signatures[0] || 'unknown';
  console.log(`\n=== Processing instruction from tx: ${txSignature} ===`);

  console.log('\n--- FULL TRANSACTION DUMP ---');
  console.log('Transaction type:', typeof transaction);
  console.log('Transaction keys:', Object.keys(transaction || {}));
  console.log(
    'Transaction prototype methods:',
    Object.getOwnPropertyNames(Object.getPrototypeOf(transaction || {})),
  );
  console.log('Full transaction JSON (first 2000 chars):');
  try {
    const txJson = JSON.stringify(transaction, null, 2);
    console.log(txJson.substring(0, 2000));
    if (txJson.length > 2000) {
      console.log('... (truncated)');
    }
  } catch (e) {
    console.log('Could not stringify transaction:', e);
  }

  if (transaction && typeof transaction.getInnerInstructions === 'function') {
    console.log('  Transaction has getInnerInstructions() method');
    try {
      const innerIxs = transaction.getInnerInstructions();
      console.log('  transaction.getInnerInstructions() result:', innerIxs);
    } catch (e) {
      console.log('  transaction.getInnerInstructions() error:', e);
    }
  }

  console.log('\n--- FULL INSTRUCTION DUMP ---');
  console.log('Instruction type:', typeof instruction);
  console.log('Instruction keys:', Object.keys(instruction || {}));
  console.log(
    'Instruction prototype methods:',
    Object.getOwnPropertyNames(Object.getPrototypeOf(instruction || {})),
  );
  console.log('Full instruction JSON (first 2000 chars):');
  try {
    const ixJson = JSON.stringify(instruction, null, 2);
    console.log(ixJson.substring(0, 2000));
    if (ixJson.length > 2000) {
      console.log('... (truncated)');
    }
  } catch (e) {
    console.log('Could not stringify instruction:', e);
  }

  if (instruction && typeof instruction.getInnerInstructions === 'function') {
    console.log('  Instruction has getInnerInstructions() method');
    try {
      const innerIxs = instruction.getInnerInstructions();
      console.log('  getInnerInstructions() result:', innerIxs);
    } catch (e) {
      console.log('  getInnerInstructions() error:', e);
    }
  }

  console.log('\n--- INNER INSTRUCTIONS CHECK ---');
  console.log('  Transaction object keys:', Object.keys(transaction || {}));
  console.log(
    '  Transaction.meta exists:',
    transaction?.meta !== undefined,
    transaction?.meta !== null,
  );
  if (transaction?.meta) {
    console.log('  Transaction.meta keys:', Object.keys(transaction.meta));
    console.log(
      '  Transaction.meta.innerInstructions:',
      transaction.meta.innerInstructions,
    );
    if (transaction.meta.innerInstructions) {
      console.log(
        '  Transaction.meta.innerInstructions type:',
        Array.isArray(transaction.meta.innerInstructions)
          ? 'array'
          : typeof transaction.meta.innerInstructions,
      );
      if (Array.isArray(transaction.meta.innerInstructions)) {
        console.log(
          '  Transaction.meta.innerInstructions length:',
          transaction.meta.innerInstructions.length,
        );
        if (transaction.meta.innerInstructions.length > 0) {
          console.log(
            '  First inner instruction group:',
            JSON.stringify(transaction.meta.innerInstructions[0], null, 2),
          );
        }
      }
    }
  }
  console.log(
    '  Transaction.transaction exists:',
    transaction?.transaction !== undefined,
  );
  if (transaction?.transaction) {
    console.log(
      '  Transaction.transaction keys:',
      Object.keys(transaction.transaction),
    );
    if (transaction.transaction.meta) {
      console.log(
        '  Transaction.transaction.meta.innerInstructions:',
        transaction.transaction.meta.innerInstructions,
      );
      if (transaction.transaction.meta.innerInstructions) {
        console.log(
          '  Transaction.transaction.meta.innerInstructions type:',
          Array.isArray(transaction.transaction.meta.innerInstructions)
            ? 'array'
            : typeof transaction.transaction.meta.innerInstructions,
        );
        if (Array.isArray(transaction.transaction.meta.innerInstructions)) {
          console.log(
            '  Transaction.transaction.meta.innerInstructions length:',
            transaction.transaction.meta.innerInstructions.length,
          );
          if (transaction.transaction.meta.innerInstructions.length > 0) {
            console.log(
              '  First inner instruction group:',
              JSON.stringify(
                transaction.transaction.meta.innerInstructions[0],
                null,
                2,
              ),
            );
          }
        }
      }
    }
  }

  const txInstructions = transaction?.instructions || [];
  console.log(`  Transaction has ${txInstructions.length} instructions`);

  let innerInstructions: any[] = [];

  const instructionInnerInstructions =
    (instruction as any)?.innerInstructions || [];
  console.log(
    `  Instruction.innerInstructions: ${instructionInnerInstructions.length}`,
  );
  if (instructionInnerInstructions.length > 0) {
    console.log(
      '  Instruction.innerInstructions structure:',
      JSON.stringify(instructionInnerInstructions, null, 2),
    );
  } else {
    console.log('  Instruction.innerInstructions is empty or undefined');
    console.log(
      '  Instruction.innerInstructions value:',
      instructionInnerInstructions,
    );
  }

  if (instructionInnerInstructions.length > 0) {
    innerInstructions = instructionInnerInstructions;
    console.log(`  Using inner instructions from instruction object`);
  } else {
    const metaInnerInstructions = transaction?.meta?.innerInstructions || [];
    console.log(
      `  Transaction.meta.innerInstructions: ${metaInnerInstructions.length} groups`,
    );

    if (metaInnerInstructions.length === 0) {
      const nestedMetaInnerInstructions =
        transaction?.transaction?.meta?.innerInstructions || [];
      console.log(
        `  Transaction.transaction.meta.innerInstructions: ${nestedMetaInnerInstructions.length} groups`,
      );
      if (nestedMetaInnerInstructions.length > 0) {
        innerInstructions = nestedMetaInnerInstructions[0]?.instructions || [];
        console.log(`  Using inner instructions from nested transaction.meta`);
      } else {
        console.log('  No inner instructions found anywhere, skipping');
        return;
      }
    } else {
      innerInstructions = metaInnerInstructions[0]?.instructions || [];
    }
  }

  console.log(`  Found ${innerInstructions.length} inner instructions`);

  if (innerInstructions.length === 0) {
    console.log('  No inner instructions found, skipping');
    return;
  }

  const accountKeys =
    transaction?.transaction?.message?.accountKeys ||
    transaction?.message?.accountKeys ||
    [];

  const programIdIndex = accountKeys.findIndex(
    (key: any) =>
      (typeof key === 'string' ? key : key.toString()) === trepa.programId,
  );

  if (programIdIndex === -1) {
    console.log('  Program ID not found in account keys');
    return;
  }

  let index: number;
  try {
    if (innerInstructions[0]?.programIdIndex !== undefined) {
      index = getEventInstructionIndexByProgramIdIndex(
        innerInstructions,
        programIdIndex,
      );
    } else {
      index = getEventInstructionIndex(innerInstructions, trepa.programId);
    }
    console.log(`  Found self-CPI instruction at index ${index}`);
  } catch (error) {
    console.log('  No self-CPI instruction found');
    return;
  }

  const innerInstruction = innerInstructions[index];
  if (!innerInstruction) {
    console.log('  Inner instruction not found at index');
    return;
  }

  if (innerInstruction.programIdIndex !== undefined) {
    if (innerInstruction.programIdIndex !== programIdIndex) {
      console.log('  Inner instruction is not a Self-CPI instruction');
      return;
    }
  }

  let eventData;
  if (innerInstruction.programIdIndex !== undefined) {
    if (!innerInstruction.data) {
      console.log('  Inner instruction has no data');
      return;
    }
    let ixData: Buffer;
    if (typeof innerInstruction.data === 'string') {
      ixData = Buffer.from(innerInstruction.data, 'base64');
    } else {
      ixData = Buffer.from(innerInstruction.data);
    }
    if (ixData.length <= 8) {
      console.log('  Instruction data too short');
      return;
    }
    const eventDataBuffer = ixData.subarray(8);
    const discriminator = eventDataBuffer.subarray(0, 8);
    const hexData = '0x' + eventDataBuffer.toString('hex');
    eventData = { discriminator, hexData };
  } else {
    eventData = extractEventFromInnerInstruction(
      innerInstruction,
      trepa.programId,
    );
  }

  if (!eventData) {
    console.log('  Failed to extract event from inner instruction');
    return;
  }

  try {
    const timestamp = new Date(blockTimestamp * 1000);
    await processEventData(
      eventData.discriminator,
      eventData.hexData,
      timestamp,
      txSignature,
      collections,
    );
  } catch (error) {
    console.error('Failed to decode event from instruction:', error);
  }
}
