import {Codec, address, array, bool, fixedArray, i64, option, struct, sum, u16, u32, u64, u8, unit} from '@subsquid/borsh'

export type ConfigStatus_Active = undefined

export const ConfigStatus_Active = unit

export type ConfigStatus_Frozen = undefined

export const ConfigStatus_Frozen = unit

export type ConfigStatus = 
    | {
        kind: 'Active'
        value?: ConfigStatus_Active
      }
    | {
        kind: 'Frozen'
        value?: ConfigStatus_Frozen
      }

export const ConfigStatus: Codec<ConfigStatus> = sum(1, {
    Active: {
        discriminator: 0,
        value: ConfigStatus_Active,
    },
    Frozen: {
        discriminator: 1,
        value: ConfigStatus_Frozen,
    },
})

export interface ConfigAccount {
    admin: string
    platformFee: bigint
    treasury: string
    creator: string
    resolver: string
    pendingCreator: string
    pendingResolver: string
    selfClaimWindow: bigint
    bump: number
    status: ConfigStatus
    reserved: Array<number>
}

export const ConfigAccount: Codec<ConfigAccount> = struct({
    admin: address,
    platformFee: u64,
    treasury: address,
    creator: address,
    resolver: address,
    pendingCreator: address,
    pendingResolver: address,
    selfClaimWindow: u64,
    bump: u8,
    status: ConfigStatus,
    reserved: fixedArray(u8, 710),
})

export interface CreatorRoleAcceptedEvent {
    configAccount: string
    oldCreator: string
    newCreator: string
}

export const CreatorRoleAcceptedEvent: Codec<CreatorRoleAcceptedEvent> = struct({
    configAccount: address,
    oldCreator: address,
    newCreator: address,
})

export interface PlatformConfigUpdatedEvent {
    configAccount: string
    admin: string
    selfClaimWindow?: bigint | undefined
    treasury?: string | undefined
}

export const PlatformConfigUpdatedEvent: Codec<PlatformConfigUpdatedEvent> = struct({
    configAccount: address,
    admin: address,
    selfClaimWindow: option(u64),
    treasury: option(address),
})

export type PoolStatus_Active = undefined

export const PoolStatus_Active = unit

export type PoolStatus_PredictionsFrozen = undefined

export const PoolStatus_PredictionsFrozen = unit

export type PoolStatus_ClaimsFrozen = undefined

export const PoolStatus_ClaimsFrozen = unit

export type PoolStatus_Frozen = undefined

export const PoolStatus_Frozen = unit

export type PoolStatus = 
    | {
        kind: 'Active'
        value?: PoolStatus_Active
      }
    | {
        kind: 'PredictionsFrozen'
        value?: PoolStatus_PredictionsFrozen
      }
    | {
        kind: 'ClaimsFrozen'
        value?: PoolStatus_ClaimsFrozen
      }
    | {
        kind: 'Frozen'
        value?: PoolStatus_Frozen
      }

export const PoolStatus: Codec<PoolStatus> = sum(1, {
    Active: {
        discriminator: 0,
        value: PoolStatus_Active,
    },
    PredictionsFrozen: {
        discriminator: 1,
        value: PoolStatus_PredictionsFrozen,
    },
    ClaimsFrozen: {
        discriminator: 2,
        value: PoolStatus_ClaimsFrozen,
    },
    Frozen: {
        discriminator: 3,
        value: PoolStatus_Frozen,
    },
})

export interface PoolAccount {
    referenceId: Array<number>
    minStake: bigint
    maxStake: bigint
    maxRoi: bigint
    stakeTokenMint: string
    minOutcome: bigint
    maxOutcome: bigint
    precision: number
    predictionEndTime: bigint
    streakAccumulator: string
    finalizedTimestamp: bigint
    root: Array<number>
    claimsLeft: number
    bump: number
    status: PoolStatus
    reserved: Array<number>
}

export const PoolAccount: Codec<PoolAccount> = struct({
    referenceId: fixedArray(u8, 16),
    minStake: u64,
    maxStake: u64,
    maxRoi: u64,
    stakeTokenMint: address,
    minOutcome: i64,
    maxOutcome: i64,
    precision: u8,
    predictionEndTime: i64,
    streakAccumulator: address,
    finalizedTimestamp: i64,
    root: fixedArray(u8, 32),
    claimsLeft: u32,
    bump: u8,
    status: PoolStatus,
    reserved: fixedArray(u8, 80),
})

export interface PoolStatusUpdatedEvent {
    poolAccount: string
    admin: string
    previousStatus: PoolStatus
    newStatus: PoolStatus
}

export const PoolStatusUpdatedEvent: Codec<PoolStatusUpdatedEvent> = struct({
    poolAccount: address,
    admin: address,
    previousStatus: PoolStatus,
    newStatus: PoolStatus,
})

export interface PredictionAccount {
    isFeePayer: boolean
    stake: bigint
    isClaimed: boolean
    bump: number
}

export const PredictionAccount: Codec<PredictionAccount> = struct({
    isFeePayer: bool,
    stake: u64,
    isClaimed: bool,
    bump: u8,
})

export interface PredictionAccountClosedEvent {
    poolAccount: string
    predictor: string
    predictionAccount: string
    isWinner: boolean
}

export const PredictionAccountClosedEvent: Codec<PredictionAccountClosedEvent> = struct({
    poolAccount: address,
    predictor: address,
    predictionAccount: address,
    isWinner: bool,
})

export interface PredictionCreatedEvent {
    poolAccount: string
    predictor: string
    poolTokenAccount: string
    predictionAccount: string
    stake: bigint
    prediction: bigint
    feePayer: string
    timestamp: bigint
}

export const PredictionCreatedEvent: Codec<PredictionCreatedEvent> = struct({
    poolAccount: address,
    predictor: address,
    poolTokenAccount: address,
    predictionAccount: address,
    stake: u64,
    prediction: i64,
    feePayer: address,
    timestamp: i64,
})

export interface PredictionPoolCreatedEvent {
    poolAccount: string
    referenceId: Array<number>
    predictionEndTime: bigint
    streakAccumulator: string
    stakeTokenMint: string
    minStake: bigint
    maxStake: bigint
    maxRoi: bigint
    minOutcome: bigint
    maxOutcome: bigint
    precision: number
    bump: number
}

export const PredictionPoolCreatedEvent: Codec<PredictionPoolCreatedEvent> = struct({
    poolAccount: address,
    referenceId: fixedArray(u8, 16),
    predictionEndTime: i64,
    streakAccumulator: address,
    stakeTokenMint: address,
    minStake: u64,
    maxStake: u64,
    maxRoi: u64,
    minOutcome: i64,
    maxOutcome: i64,
    precision: u8,
    bump: u8,
})

export interface PredictionPoolFinalizedEvent {
    poolAccount: string
    merkleRoot: Array<number>
    protocolFee: bigint
    streakFee?: bigint | undefined
}

export const PredictionPoolFinalizedEvent: Codec<PredictionPoolFinalizedEvent> = struct({
    poolAccount: address,
    merkleRoot: fixedArray(u8, 32),
    protocolFee: u64,
    streakFee: option(u64),
})

export interface PredictionRewardsClaimedEvent {
    poolAccount: string
    predictor: string
    poolTokenAccount: string
    predictionAccount: string
    amount: bigint
    proof: Array<Array<number>>
}

export const PredictionRewardsClaimedEvent: Codec<PredictionRewardsClaimedEvent> = struct({
    poolAccount: address,
    predictor: address,
    poolTokenAccount: address,
    predictionAccount: address,
    amount: u64,
    proof: array(fixedArray(u8, 32)),
})

export interface PredictionStakeIncreasedEvent {
    poolAccount: string
    predictor: string
    predictionAccount: string
    stake: bigint
    feePayer: string
    timestamp: bigint
}

export const PredictionStakeIncreasedEvent: Codec<PredictionStakeIncreasedEvent> = struct({
    poolAccount: address,
    predictor: address,
    predictionAccount: address,
    stake: u64,
    feePayer: address,
    timestamp: i64,
})

export interface PredictionValueUpdatedEvent {
    poolAccount: string
    predictor: string
    predictionAccount: string
    prediction: bigint
    feePayer: string
    timestamp: bigint
}

export const PredictionValueUpdatedEvent: Codec<PredictionValueUpdatedEvent> = struct({
    poolAccount: address,
    predictor: address,
    predictionAccount: address,
    prediction: i64,
    feePayer: address,
    timestamp: i64,
})

export interface ProgramStatusToggledEvent {
    configAccount: string
    admin: string
    previousStatus: ConfigStatus
    newStatus: ConfigStatus
}

export const ProgramStatusToggledEvent: Codec<ProgramStatusToggledEvent> = struct({
    configAccount: address,
    admin: address,
    previousStatus: ConfigStatus,
    newStatus: ConfigStatus,
})

export interface ProposeUpdateAccessEvent {
    configAccount: string
    admin: string
    pendingCreator?: string | undefined
    pendingResolver?: string | undefined
}

export const ProposeUpdateAccessEvent: Codec<ProposeUpdateAccessEvent> = struct({
    configAccount: address,
    admin: address,
    pendingCreator: option(address),
    pendingResolver: option(address),
})

export interface ResolverRoleAcceptedEvent {
    configAccount: string
    oldResolver: string
    newResolver: string
}

export const ResolverRoleAcceptedEvent: Codec<ResolverRoleAcceptedEvent> = struct({
    configAccount: address,
    oldResolver: address,
    newResolver: address,
})

export interface StreakAccumulatorAccount {
    timeSeriesId: Array<number>
    feePercentage: number
    bump: number
    reserved: Array<number>
}

export const StreakAccumulatorAccount: Codec<StreakAccumulatorAccount> = struct({
    timeSeriesId: fixedArray(u8, 16),
    feePercentage: u16,
    bump: u8,
    reserved: fixedArray(u8, 200),
})

export interface StreakRegisteredEvent {
    streakAccumulatorAccount: string
    timeSeriesId: Array<number>
    feePercentage: number
    bump: number
}

export const StreakRegisteredEvent: Codec<StreakRegisteredEvent> = struct({
    streakAccumulatorAccount: address,
    timeSeriesId: fixedArray(u8, 16),
    feePercentage: u16,
    bump: u8,
})

export interface StreakRewardsClaimedEvent {
    streakTimeSeriesId: Array<number>
    streakAccumulatorAccount: string
    streakTokenAccount: string
    user: string
    userTokenAccount: string
    amount: bigint
}

export const StreakRewardsClaimedEvent: Codec<StreakRewardsClaimedEvent> = struct({
    streakTimeSeriesId: fixedArray(u8, 16),
    streakAccumulatorAccount: address,
    streakTokenAccount: address,
    user: address,
    userTokenAccount: address,
    amount: u64,
})
