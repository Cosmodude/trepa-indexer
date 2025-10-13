import {Codec, address, array, bool, fixedArray, i64, struct, u64, u8} from '@subsquid/borsh'

export interface ConfigAccount {
    admin: string
    minStake: bigint
    maxStake: bigint
    maxRoi: bigint
    platformFee: bigint
    treasury: string
    bump: number
    stakeTokenMint: string
}

export const ConfigAccount: Codec<ConfigAccount> = struct({
    admin: address,
    minStake: u64,
    maxStake: u64,
    maxRoi: u64,
    platformFee: u64,
    treasury: address,
    bump: u8,
    stakeTokenMint: address,
})

export interface ConfigUpdatedEvent {
    configAccount: string
    admin: string
    minStake: bigint
    maxStake: bigint
    maxRoi: bigint
    platformFee: bigint
    treasury: string
    stakeTokenMint: string
    bump: number
}

export const ConfigUpdatedEvent: Codec<ConfigUpdatedEvent> = struct({
    configAccount: address,
    admin: address,
    minStake: u64,
    maxStake: u64,
    maxRoi: u64,
    platformFee: u64,
    treasury: address,
    stakeTokenMint: address,
    bump: u8,
})

export interface PoolAccount {
    questionId: Array<number>
    predictionEndTime: bigint
    totalStake: bigint
    isFinalized: boolean
    root: Array<number>
    bump: number
}

export const PoolAccount: Codec<PoolAccount> = struct({
    questionId: fixedArray(u8, 16),
    predictionEndTime: i64,
    totalStake: u64,
    isFinalized: bool,
    root: fixedArray(u8, 32),
    bump: u8,
})

export interface PoolClaimedEvent {
    poolAccount: string
    predictor: string
    poolTokenAccount: string
    predictionAccount: string
    amount: bigint
    proof: Array<Array<number>>
}

export const PoolClaimedEvent: Codec<PoolClaimedEvent> = struct({
    poolAccount: address,
    predictor: address,
    poolTokenAccount: address,
    predictionAccount: address,
    amount: u64,
    proof: array(fixedArray(u8, 32)),
})

export interface PoolCreatedEvent {
    poolAccount: string
    questionId: Array<number>
    predictionEndTime: bigint
    bump: number
}

export const PoolCreatedEvent: Codec<PoolCreatedEvent> = struct({
    poolAccount: address,
    questionId: fixedArray(u8, 16),
    predictionEndTime: i64,
    bump: u8,
})

export interface PoolFinalizedEvent {
    poolAccount: string
    merkleRoot: Array<number>
    protocolFee: bigint
}

export const PoolFinalizedEvent: Codec<PoolFinalizedEvent> = struct({
    poolAccount: address,
    merkleRoot: fixedArray(u8, 32),
    protocolFee: u64,
})

export interface PoolPredictedEvent {
    poolAccount: string
    predictor: string
    poolTokenAccount: string
    predictionAccount: string
    stake: bigint
    feePayer: string
}

export const PoolPredictedEvent: Codec<PoolPredictedEvent> = struct({
    poolAccount: address,
    predictor: address,
    poolTokenAccount: address,
    predictionAccount: address,
    stake: u64,
    feePayer: address,
})

export interface PredictionAccount {
    predictor: string
    pool: string
    isClaimed: boolean
    bump: number
}

export const PredictionAccount: Codec<PredictionAccount> = struct({
    predictor: address,
    pool: address,
    isClaimed: bool,
    bump: u8,
})
