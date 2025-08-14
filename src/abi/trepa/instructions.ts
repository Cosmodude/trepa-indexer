import {struct, u64, array, fixedArray, u8, i64, address} from '@subsquid/borsh'
import {instruction} from '../abi.support'

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
        predictor: 0,
        prediction: 1,
        pool: 2,
        predictorTokenAccount: 3,
        poolTokenAccount: 4,
        stakeTokenMint: 5,
        config: 6,
        tokenProgram: 7,
    },
    struct({
        amount: u64,
        proof: array(fixedArray(u8, 32)),
    }),
)

/**
 * Creates a new prediction pool
 */
export interface CreatePool {
    questionId: Array<number>
    predictionEndTime: bigint
}

/**
 * Creates a new prediction pool
 */
export const createPool = instruction(
    {
        d8: '0xe992d18ecf6840bc',
    },
    {
        admin: 0,
        pool: 1,
        systemProgram: 2,
        clock: 3,
    },
    struct({
        questionId: fixedArray(u8, 16),
        predictionEndTime: i64,
    }),
)

/**
 * Finalize a pool
 */
export interface FinalizePool {
    merkleRoot: Array<number>
    protocolFee: bigint
}

/**
 * Finalize a pool
 */
export const finalizePool = instruction(
    {
        d8: '0x4ab6c1655c98ca8e',
    },
    {
        admin: 0,
        pool: 1,
        /**
         * CHECKs: are done inside of the logic of the program
         */
        poolTokenAccount: 2,
        treasuryTokenAccount: 3,
        config: 4,
        stakeTokenMint: 5,
        tokenProgram: 6,
    },
    struct({
        merkleRoot: fixedArray(u8, 32),
        protocolFee: u64,
    }),
)

/**
 * Initializes the Trepa platform with configurable parameters
 */
export interface Initialize {
    minStake: bigint
    maxStake: bigint
    maxRoi: bigint
    platformFee: bigint
    treasury: string
    stakeTokenMint: string
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
    },
    struct({
        minStake: u64,
        maxStake: u64,
        maxRoi: u64,
        platformFee: u64,
        treasury: address,
        stakeTokenMint: address,
    }),
)

/**
 * Predicts the outcome of a pool
 */
export interface Predict {
    stake: bigint
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
        pool: 1,
        prediction: 2,
        predictorTokenAccount: 3,
        poolTokenAccount: 4,
        config: 5,
        stakeTokenMint: 6,
        systemProgram: 7,
        tokenProgram: 8,
        feePayer: 9,
    },
    struct({
        stake: u64,
    }),
)

/**
 * Updates the platform parameters
 */
export interface UpdateConfig {
    minStake: bigint
    maxStake: bigint
    maxRoi: bigint
    platformFee: bigint
    treasury: string
}

/**
 * Updates the platform parameters
 */
export const updateConfig = instruction(
    {
        d8: '0x1d9efcbf0a53db63',
    },
    {
        admin: 0,
        config: 1,
    },
    struct({
        minStake: u64,
        maxStake: u64,
        maxRoi: u64,
        platformFee: u64,
        treasury: address,
    }),
)
