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

  const predictedDiscriminator = Buffer.from(
    trepa.events.PredictionCreatedEvent.d8.slice(2),
    'hex',
  );

  if (discriminator.equals(predictedDiscriminator)) {
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
      console.log(`PredictionCreatedEvent | tx: ${txSignature}`);
    } catch (error) {
      console.error('Failed to decode PredictionCreatedEvent:', error);
    }
    return;
  }

  const poolClaimedDiscriminator = Buffer.from(
    trepa.events.PredictionRewardsClaimedEvent.d8.slice(2),
    'hex',
  );

  if (discriminator.equals(poolClaimedDiscriminator)) {
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
      console.log(`PredictionRewardsClaimedEvent | tx: ${txSignature}`);
    } catch (error) {
      console.error('Failed to decode PredictionRewardsClaimedEvent:', error);
    }
    return;
  }

  const poolCreatedDiscriminator = Buffer.from(
    trepa.events.PredictionPoolCreatedEvent.d8.slice(2),
    'hex',
  );

  if (discriminator.equals(poolCreatedDiscriminator)) {
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
      console.log(`PredictionPoolCreatedEvent | tx: ${txSignature}`);
    } catch (error) {
      console.error('Failed to decode PredictionPoolCreatedEvent:', error);
    }
    return;
  }

  const poolFinalizedDiscriminator = Buffer.from(
    trepa.events.PredictionPoolFinalizedEvent.d8.slice(2),
    'hex',
  );

  if (discriminator.equals(poolFinalizedDiscriminator)) {
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
      console.log(`PredictionPoolFinalizedEvent | tx: ${txSignature}`);
    } catch (error) {
      console.error('Failed to decode PredictionPoolFinalizedEvent:', error);
    }
  }
}
