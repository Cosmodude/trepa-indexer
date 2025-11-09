import * as trepa from '../abi/trepa';
import {
  type NewPredictedEvent,
  type NewClaimedEvent,
  type NewPoolCreatedEvent,
  type NewPoolFinalizedEvent,
} from '../drizzle/schema';

export interface EventCollections {
  predictedEvents: NewPredictedEvent[];
  claimedEvents: NewClaimedEvent[];
  createdEvents: NewPoolCreatedEvent[];
  finalizedEvents: NewPoolFinalizedEvent[];
}

export async function processEventData(
  discriminator: Buffer,
  hexData: string,
  timestamp: Date,
  txSignature: string,
  collections: EventCollections,
): Promise<void> {
  const { predictedEvents, claimedEvents, createdEvents, finalizedEvents } =
    collections;

  const discriminatorHex = '0x' + discriminator.toString('hex');
  console.log(
    `processEventData called with discriminator: ${discriminatorHex}`,
  );
  let matched = false;

  const predictedDiscriminator = Buffer.from(
    trepa.events.PredictionCreatedEvent.d8.slice(2),
    'hex',
  );
  const predictedDiscriminatorHex =
    '0x' + predictedDiscriminator.toString('hex');
  console.log(
    `Checking PredictionCreatedEvent discriminator: ${predictedDiscriminatorHex}`,
  );
  if (discriminator.equals(predictedDiscriminator)) {
    console.log('Matched PredictionCreatedEvent!');
    matched = true;
    try {
      const predictedEvent = trepa.events.PredictionCreatedEvent.decode({
        msg: hexData,
      });

      const predictedEventEntity: NewPredictedEvent = {
        id: txSignature,
        transactionSignature: txSignature,
        timestamp: timestamp,
        poolAccount: predictedEvent.poolAccount,
        predictor: predictedEvent.predictor,
        poolTokenAccount: predictedEvent.poolTokenAccount,
        predictionAccount: predictedEvent.predictionAccount,
        stake: predictedEvent.stake.toString(),
        feePayer: predictedEvent.feePayer,
      };

      predictedEvents.push(predictedEventEntity);
    } catch (error) {
      console.error('Failed to decode PoolPredictedEvent:', error);
    }
  }

  const poolClaimedDiscriminator = Buffer.from(
    trepa.events.PredictionRewardsClaimedEvent.d8.slice(2),
    'hex',
  );
  const poolClaimedDiscriminatorHex =
    '0x' + poolClaimedDiscriminator.toString('hex');
  console.log(
    `Checking PredictionRewardsClaimedEvent discriminator: ${poolClaimedDiscriminatorHex}`,
  );
  if (discriminator.equals(poolClaimedDiscriminator)) {
    console.log('Matched PredictionRewardsClaimedEvent!');
    matched = true;
    try {
      const claimedEvent = trepa.events.PredictionRewardsClaimedEvent.decode({
        msg: hexData,
      });

      const claimedEventEntity: NewClaimedEvent = {
        id: txSignature,
        transactionSignature: txSignature,
        timestamp: timestamp,
        poolAccount: claimedEvent.poolAccount,
        predictor: claimedEvent.predictor,
        poolTokenAccount: claimedEvent.poolTokenAccount,
        predictionAccount: claimedEvent.predictionAccount,
        amount: claimedEvent.amount.toString(),
        proof: JSON.stringify(claimedEvent.proof),
      };

      claimedEvents.push(claimedEventEntity);
    } catch (error) {
      console.error('Failed to decode PoolClaimedEvent:', error);
    }
  }

  const poolCreatedDiscriminator = Buffer.from(
    trepa.events.PredictionPoolCreatedEvent.d8.slice(2),
    'hex',
  );
  const poolCreatedDiscriminatorHex =
    '0x' + poolCreatedDiscriminator.toString('hex');
  console.log(
    `Checking PredictionPoolCreatedEvent discriminator: ${poolCreatedDiscriminatorHex}`,
  );
  if (discriminator.equals(poolCreatedDiscriminator)) {
    console.log('Matched PredictionPoolCreatedEvent!');
    matched = true;
    try {
      const createdEvent = trepa.events.PredictionPoolCreatedEvent.decode({
        msg: hexData,
      });

      const createdEventEntity: NewPoolCreatedEvent = {
        id: txSignature,
        transactionSignature: txSignature,
        timestamp: timestamp,
        poolAccount: createdEvent.poolAccount,
        questionId: Buffer.from(createdEvent.referenceId).toString('hex'),
        predictionEndTime: createdEvent.predictionEndTime.toString(),
        bump: createdEvent.bump.toString(),
      };

      createdEvents.push(createdEventEntity);
    } catch (error) {
      console.error('Failed to decode PoolCreatedEvent:', error);
    }
  }

  const poolFinalizedDiscriminator = Buffer.from(
    trepa.events.PredictionPoolFinalizedEvent.d8.slice(2),
    'hex',
  );
  const poolFinalizedDiscriminatorHex =
    '0x' + poolFinalizedDiscriminator.toString('hex');
  console.log(
    `Checking PredictionPoolFinalizedEvent discriminator: ${poolFinalizedDiscriminatorHex}`,
  );
  if (discriminator.equals(poolFinalizedDiscriminator)) {
    console.log('Matched PredictionPoolFinalizedEvent!');
    matched = true;
    try {
      const finalizedEvent = trepa.events.PredictionPoolFinalizedEvent.decode({
        msg: hexData,
      });

      const finalizedEventEntity: NewPoolFinalizedEvent = {
        id: txSignature,
        transactionSignature: txSignature,
        timestamp: timestamp,
        poolAccount: finalizedEvent.poolAccount,
        merkleRoot: Buffer.from(finalizedEvent.merkleRoot).toString('hex'),
        protocolFee: finalizedEvent.protocolFee.toString(),
      };

      finalizedEvents.push(finalizedEventEntity);
    } catch (error) {
      console.error('Failed to decode PoolFinalizedEvent:', error);
    }
  }

  if (!matched) {
    console.log(
      `processEventData completed - no match found for discriminator: ${discriminatorHex}`,
    );
  }
}
