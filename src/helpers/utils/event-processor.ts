import * as trepa from '../../abi/trepa';
import { type NewPrediction, type NewClaim } from '../../drizzle/db.types';

export interface EventCollections {
  predictedEvents: NewPrediction[];
  claimedEvents: NewClaim[];
  updatedPredictionValues: Partial<NewPrediction>[];
  updatedPredictionStakes: Partial<NewPrediction>[];
}

export function processEventData(
  discriminator: Buffer,
  hexData: string,
  timestamp: Date,
  txSignature: string,
  collections: EventCollections,
): void {
  const {
    predictedEvents,
    claimedEvents,
    updatedPredictionValues,
    updatedPredictionStakes,
  } = collections;

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
        stake: BigInt(predictedEvent.stake.toString()),
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
        amount: BigInt(claimedEvent.amount.toString()),
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

  const predictionValueUpdatedDiscriminator = Buffer.from(
    trepa.events.PredictionValueUpdatedEvent.d8.slice(2),
    'hex',
  );

  if (discriminator.equals(predictionValueUpdatedDiscriminator)) {
    try {
      const valueUpdatedEvent = trepa.events.PredictionValueUpdatedEvent.decode(
        {
          msg: hexData,
        },
      );

      const updatedPredictionEntity: Partial<NewPrediction> = {
        predictionAccount: valueUpdatedEvent.predictionAccount,
        prediction: valueUpdatedEvent.prediction.toString(),
        updated_at: timestamp,
      };

      updatedPredictionValues.push(updatedPredictionEntity);
      console.log(
        `PredictionValueUpdatedEvent | tx: ${txSignature} | block: ${timestamp.toISOString()} | recorded: ${new Date().toISOString()}`,
      );
    } catch (error) {
      console.error('Failed to decode PredictionValueUpdatedEvent:', error);
    }
    return;
  }

  const predictionStakeIncreasedDiscriminator = Buffer.from(
    trepa.events.PredictionStakeIncreasedEvent.d8.slice(2),
    'hex',
  );

  if (discriminator.equals(predictionStakeIncreasedDiscriminator)) {
    try {
      const stakeIncreasedEvent =
        trepa.events.PredictionStakeIncreasedEvent.decode({
          msg: hexData,
        });

      const updatedStakeEntity: Partial<NewPrediction> = {
        predictionAccount: stakeIncreasedEvent.predictionAccount,
        stake: BigInt(stakeIncreasedEvent.stake.toString()),
        updated_at: timestamp,
      };

      updatedPredictionStakes.push(updatedStakeEntity);
      console.log(
        `PredictionStakeIncreasedEvent | tx: ${txSignature} | block: ${timestamp.toISOString()} | recorded: ${new Date().toISOString()}`,
      );
    } catch (error) {
      console.error('Failed to decode PredictionStakeIncreasedEvent:', error);
    }
    return;
  }

  console.log(`Detected event: ${discriminator.toString('hex')}`);
}
