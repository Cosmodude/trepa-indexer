import * as trepa from '../abi/trepa';
import { type NewPrediction, type NewClaim } from '../drizzle/schema';

export interface EventCollections {
  predictedEvents: NewPrediction[];
  claimedEvents: NewClaim[];
}

export async function processEventData(
  discriminator: Buffer,
  hexData: string,
  timestamp: Date,
  txSignature: string,
  collections: EventCollections,
): Promise<void> {
  const { predictedEvents, claimedEvents } = collections;

  const predictedDiscriminator = Buffer.from(
    trepa.events.PredictionCreatedEvent.d8.slice(2),
    'hex',
  );

  if (discriminator.equals(predictedDiscriminator)) {
    try {
      const predictedEvent = trepa.events.PredictionCreatedEvent.decode({
        msg: hexData,
      });

      const predictedEventEntity: NewPrediction = {
        id: txSignature,
        transactionSignature: txSignature,
        timestamp: timestamp,
        poolAccount: predictedEvent.poolAccount,
        predictorAccount: predictedEvent.predictor,
        poolTokenAccount: predictedEvent.poolTokenAccount,
        predictionAccount: predictedEvent.predictionAccount,
        prediction: predictedEvent.prediction.toString(),
        stake: parseInt(predictedEvent.stake.toString()),
        isFeePayer: predictedEvent.feePayer === predictedEvent.predictor,
      };

      predictedEvents.push(predictedEventEntity);
      console.log(
        `PredictionCreatedEvent | tx: ${txSignature} | block: ${timestamp.toISOString()} | recorded: ${new Date().toISOString()}`,
      );
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

      const claimedEventEntity: NewClaim = {
        userWalletAddress: claimedEvent.predictor,
        predictionAccount: claimedEvent.predictionAccount,
        amount: parseInt(claimedEvent.amount.toString()),
        rewardId: undefined,
      };

      claimedEvents.push(claimedEventEntity);
      console.log(
        `PredictionRewardsClaimedEvent | tx: ${txSignature} | block: ${timestamp.toISOString()} | recorded: ${new Date().toISOString()}`,
      );
    } catch (error) {
      console.error('Failed to decode PredictionRewardsClaimedEvent:', error);
    }
    return;
  }
}
