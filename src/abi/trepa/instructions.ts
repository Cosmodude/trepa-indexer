import {address, array, fixedArray, i64, option, struct, u16, u32, u64, u8, unit} from '@subsquid/borsh'
import {instruction} from '../abi.support'

/**
 * Creator accept the access
 */
export type AcceptCreatorRole = undefined

/**
 * Creator accept the access
 */
export const acceptCreatorRole = instruction(
    {
        d8: '0x16a1e3fd40f56138',
    },
    {
        creator: 0,
        config: 1,
        eventAuthority: 2,
        program: 3,
    },
    unit,
)

/**
 * Resolver accept the access
 */
export type AcceptResolverRole = undefined

/**
 * Resolver accept the access
 */
export const acceptResolverRole = instruction(
    {
        d8: '0x92da6b743dfb4852',
    },
    {
        resolver: 0,
        config: 1,
        eventAuthority: 2,
        program: 3,
    },
    unit,
)

/**
 * Claim the rewards for a prediction
 */
export interface ClaimRewards {
    amount: bigint
    proof: Array<Array<number>>
}

/**
 * Claim the rewards for a prediction
 */
export const claimRewards = instruction(
    {
        d8: '0x0490844774179750',
    },
    {
        /**
         * Either user or platform (creator) depending on the claim window
         */
        signer: 0,
        feePayer: 1,
        predictor: 2,
        closeAuthority: 3,
        prediction: 4,
        pool: 5,
        predictorTokenAccount: 6,
        poolTokenAccount: 7,
        stakeTokenMint: 8,
        config: 9,
        tokenProgram: 10,
        eventAuthority: 11,
        program: 12,
    },
    struct({
        amount: u64,
        proof: array(fixedArray(u8, 32)),
    }),
)

export interface ClaimStreakRewards {
    amount: bigint
}

export const claimStreakRewards = instruction(
    {
        d8: '0xf8940d8f12a8a11b',
    },
    {
        resolver: 0,
        user: 1,
        streakAccumulator: 2,
        streakTokenAccount: 3,
        userTokenAccount: 4,
        config: 5,
        mint: 6,
        tokenProgram: 7,
        systemProgram: 8,
        eventAuthority: 9,
        program: 10,
    },
    struct({
        amount: u64,
    }),
)

/**
 * Close a prediction account and refund rent to the appropriate party
 */
export type ClosePredictionAccount = undefined

/**
 * Close a prediction account and refund rent to the appropriate party
 */
export const closePredictionAccount = instruction(
    {
        d8: '0x5090d3bbcc34a15f',
    },
    {
        /**
         * Only pays for the transaction fees
         */
        feePayer: 0,
        /**
         * CHECKs: the prediction account is derived using this key
         */
        predictor: 1,
        /**
         * CHECKs: are done using the config account
         */
        closeAuthority: 2,
        prediction: 3,
        pool: 4,
        config: 5,
        eventAuthority: 6,
        program: 7,
    },
    unit,
)

/**
 * Creates a new prediction pool
 */
export interface CreatePool {
    referenceId: Array<number>
    predictionEndTime: bigint
    minStake: bigint
    maxStake: bigint
    maxRoi: bigint
    minOutcome: bigint
    maxOutcome: bigint
    precision: number
    timeSeriesId?: Array<number> | undefined
}

/**
 * Creates a new prediction pool
 */
export const createPool = instruction(
    {
        d8: '0xe992d18ecf6840bc',
    },
    {
        creator: 0,
        pool: 1,
        config: 2,
        stakeTokenMint: 3,
        systemProgram: 4,
        eventAuthority: 5,
        program: 6,
    },
    struct({
        referenceId: fixedArray(u8, 16),
        predictionEndTime: i64,
        minStake: u64,
        maxStake: u64,
        maxRoi: u64,
        minOutcome: i64,
        maxOutcome: i64,
        precision: u8,
        timeSeriesId: option(fixedArray(u8, 16)),
    }),
)

/**
 * Finalize a pool
 */
export interface FinalizePool {
    merkleRoot: Array<number>
    protocolFee: bigint
    claims: number
}

/**
 * Finalize a pool
 */
export const finalizePool = instruction(
    {
        d8: '0x4ab6c1655c98ca8e',
    },
    {
        resolver: 0,
        pool: 1,
        poolTokenAccount: 2,
        treasuryTokenAccount: 3,
        config: 4,
        stakeTokenMint: 5,
        tokenProgram: 6,
        eventAuthority: 7,
        program: 8,
    },
    struct({
        merkleRoot: fixedArray(u8, 32),
        protocolFee: u64,
        claims: u32,
    }),
)

/**
 * Initializes the Trepa platform with configurable parameters
 */
export interface Initialize {
    platformFee: bigint
    treasury: string
    creator: string
    resolver: string
    selfClaimWindow: bigint
}

/**
 * Initializes the Trepa platform with configurable parameters
 */
export const initialize = instruction(
    {
        d8: '0xafaf6d1f0d989bed',
    },
    {
        admin: 0,
        config: 1,
        systemProgram: 2,
        eventAuthority: 3,
        program: 4,
    },
    struct({
        platformFee: u64,
        treasury: address,
        creator: address,
        resolver: address,
        selfClaimWindow: u64,
    }),
)

/**
 * Predicts the outcome of a pool
 */
export interface Predict {
    stake: bigint
    prediction: bigint
}

/**
 * Predicts the outcome of a pool
 */
export const predict = instruction(
    {
        d8: '0xfe7270f425312080',
    },
    {
        predictor: 0,
        feePayer: 1,
        pool: 2,
        prediction: 3,
        predictorTokenAccount: 4,
        poolTokenAccount: 5,
        config: 6,
        stakeTokenMint: 7,
        tokenProgram: 8,
        systemProgram: 9,
        eventAuthority: 10,
        program: 11,
    },
    struct({
        stake: u64,
        prediction: i64,
    }),
)

/**
 * Updates the creator and/or resolver
 */
export interface ProposeUpdateAccess {
    creator?: string | undefined
    resolver?: string | undefined
}

/**
 * Updates the creator and/or resolver
 */
export const proposeUpdateAccess = instruction(
    {
        d8: '0x498f49fad4888b28',
    },
    {
        admin: 0,
        config: 1,
        eventAuthority: 2,
        program: 3,
    },
    struct({
        creator: option(address),
        resolver: option(address),
    }),
)

/**
 * Streak Accumulator Functions for Time Series
 */
export interface RegisterStreak {
    timeSeriesId: Array<number>
    feePercentage: number
}

/**
 * Streak Accumulator Functions for Time Series
 */
export const registerStreak = instruction(
    {
        d8: '0xceb68d3e00ad7e5c',
    },
    {
        creator: 0,
        streakAccumulator: 1,
        config: 2,
        systemProgram: 3,
        eventAuthority: 4,
        program: 5,
    },
    struct({
        timeSeriesId: fixedArray(u8, 16),
        feePercentage: u16,
    }),
)

/**
 * Toggle freeze/unfreeze the entire program
 */
export type ToggleFreezeProgram = undefined

/**
 * Toggle freeze/unfreeze the entire program
 */
export const toggleFreezeProgram = instruction(
    {
        d8: '0x1c4b196e1c9a5580',
    },
    {
        admin: 0,
        config: 1,
        eventAuthority: 2,
        program: 3,
    },
    unit,
)

/**
 * Updates the platform parameters like self claim window and treasury
 */
export interface UpdateConfig {
    selfClaimWindow?: bigint | undefined
    treasury?: string | undefined
}

/**
 * Updates the platform parameters like self claim window and treasury
 */
export const updateConfig = instruction(
    {
        d8: '0x1d9efcbf0a53db63',
    },
    {
        admin: 0,
        config: 1,
        eventAuthority: 2,
        program: 3,
    },
    struct({
        selfClaimWindow: option(u64),
        treasury: option(address),
    }),
)

/**
 * Updates the pool status
 */
export interface UpdatePoolStatus {
    status: number
}

/**
 * Updates the pool status
 */
export const updatePoolStatus = instruction(
    {
        d8: '0x82576c062ee0757b',
    },
    {
        admin: 0,
        pool: 1,
        config: 2,
        eventAuthority: 3,
        program: 4,
    },
    struct({
        status: u8,
    }),
)

/**
 * Updates the prediction for a pool
 */
export interface UpdatePrediction {
    prediction: bigint
}

/**
 * Updates the prediction for a pool
 */
export const updatePrediction = instruction(
    {
        d8: '0x16557aee532d591a',
    },
    {
        predictor: 0,
        feePayer: 1,
        pool: 2,
        prediction: 3,
        config: 4,
        eventAuthority: 5,
        program: 6,
    },
    struct({
        prediction: i64,
    }),
)

/**
 * Updates the stake for a prediction
 */
export interface UpdateStake {
    newStake: bigint
}

/**
 * Updates the stake for a prediction
 */
export const updateStake = instruction(
    {
        d8: '0xf870c55fe9896913',
    },
    {
        predictor: 0,
        feePayer: 1,
        pool: 2,
        prediction: 3,
        predictorTokenAccount: 4,
        poolTokenAccount: 5,
        config: 6,
        stakeTokenMint: 7,
        tokenProgram: 8,
        eventAuthority: 9,
        program: 10,
    },
    struct({
        newStake: u64,
    }),
)
