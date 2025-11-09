export interface InnerInstruction {
  programId: string;
  data?: string;
  programIdIndex?: number;
}

export function getEventInstructionIndex(
  innerInstructions: InnerInstruction[],
  programId: string,
): number {
  const index = innerInstructions.findIndex(
    (ix) => ix.programId === programId && ix.data,
  );
  if (index === -1) {
    throw new Error('Self-CPI instruction not found');
  }
  return index;
}

export function getEventInstructionIndexByProgramIdIndex(
  instructions: Array<{ programIdIndex?: number; data?: string }>,
  programIdIndex: number,
): number {
  const index = instructions.findIndex(
    (ix) => ix.programIdIndex !== programIdIndex,
  );
  if (index === undefined || index === -1) {
    throw new Error('Self-CPI instruction not found');
  }
  return index;
}

export function extractEventFromInnerInstruction(
  innerInstruction: InnerInstruction,
  programId: string,
): { discriminator: Buffer; hexData: string } | null {
  if (innerInstruction.programId !== programId) {
    return null;
  }

  if (!innerInstruction.data) {
    return null;
  }

  const ixData = Buffer.from(innerInstruction.data, 'base64');
  if (ixData.length <= 8) {
    return null;
  }

  const eventDataBuffer = ixData.subarray(8);
  const discriminator = eventDataBuffer.subarray(0, 8);
  const hexData = '0x' + eventDataBuffer.toString('hex');

  return { discriminator, hexData };
}
