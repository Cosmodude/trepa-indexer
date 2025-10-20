import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/solana-objects'
import {DataSourceBuilder} from '@subsquid/solana-stream'
import * as trepa from './abi/trepa'
import { DrizzleDatabase } from './drizzle/database'

import { 
    type NewPredictedEvent,
    type NewClaimedEvent, 
    type NewPoolCreatedEvent, 
    type NewPoolFinalizedEvent 
} from "./drizzle/schema"

const START_BLOCK_HEIGHT = 399_335_925
const PORTAL_URL = 'https://portal.sqd.dev/datasets/solana-devnet'

const dataSource = new DataSourceBuilder()
    .setPortal({
        url:    PORTAL_URL,
        http: {
            retryAttempts: Infinity
        }
    })
    .setBlockRange({from: START_BLOCK_HEIGHT})
    .setFields({
        block: {
            timestamp: true
        },
        transaction: {
            signatures: true
        },
        log: {
            programId: true,
            message: true,
            kind: true
        }
    })
    .addLog({
        where: {
            programId: [trepa.programId]
        },
        include: {
            transaction: true
        }
    })
    .build()

console.log('Data source configuration:')
console.log('- Portal URL: ', PORTAL_URL)
console.log('- Program ID filter:', trepa.programId)
console.log('- Note: Processing all logs from the Trepa program via Portal API')

async function startIndexer() {
    console.log('Starting indexer with timeout...')
    
    const timeout = setTimeout(() => {
        console.log('Indexer timeout - no data received in 30 seconds')
        process.exit(0)
    }, 30_000)
    
    const db = new DrizzleDatabase()
    
    await run(dataSource, db as any, async ctx => {
        clearTimeout(timeout)
        
        try {
            let blocks = ctx.blocks.map(augmentBlock)
            
            console.log(`Processing ${blocks.length} blocks (at block height ${blocks[0]?.header.number || 'unknown'}), total logs: ${blocks.reduce((sum, b) => sum + b.logs.length, 0)}`)
            
            // Collect all events first, then insert them all at once (like the example)
            const predictedEvents: NewPredictedEvent[] = []
            const claimedEvents: NewClaimedEvent[] = []
            const createdEvents: NewPoolCreatedEvent[] = []
            const finalizedEvents: NewPoolFinalizedEvent[] = []
            
            for (let block of blocks) {
                for (let log of block.logs) {
                    if (log.programId === trepa.programId) {
                        let transaction
                        try {
                            transaction = log.getTransaction()
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                            console.log('Skipping log - no transaction found:', errorMessage)
                            continue
                        }
                        
                        const txSignature = transaction?.signatures[0] || 'unknown'
                        
                        try {
                            const logData = (log as any).message
                            
                            if (logData && (log as any).kind === 'data') {
                                const logBuffer = Buffer.from(logData, 'base64')
                                
                                if (logBuffer.length >= 8) {
                                    const discriminator = logBuffer.subarray(0, 8)
                                    const hexData = '0x' + logBuffer.toString('hex')
                                    const timestamp = new Date(block.header.timestamp * 1000)
                                    
                                    // PoolPredictedEvent
                                    const predictedDiscriminator = Buffer.from(trepa.events.PoolPredictedEvent.d8.slice(2), 'hex')
                                    if (discriminator.equals(predictedDiscriminator)) {
                                        try {
                                            const predictedEvent = trepa.events.PoolPredictedEvent.decode({msg: hexData})
                                            
                                            const predictedEventEntity: NewPredictedEvent = {
                                                id: txSignature,
                                                transactionSignature: txSignature,
                                                timestamp: timestamp,
                                                poolAccount: predictedEvent.poolAccount,
                                                predictor: predictedEvent.predictor,
                                                poolTokenAccount: predictedEvent.poolTokenAccount,
                                                predictionAccount: predictedEvent.predictionAccount,
                                                stake: predictedEvent.stake.toString(),
                                                feePayer: predictedEvent.feePayer
                                            }
                                        
                                            predictedEvents.push(predictedEventEntity)
                                        } catch (error) {
                                            console.error('Failed to decode PoolPredictedEvent:', error)
                                        }
                                    }

                                    // PoolClaimedEvent
                                    const poolClaimedDiscriminator = Buffer.from(trepa.events.PoolClaimedEvent.d8.slice(2), 'hex')
                                    if (discriminator.equals(poolClaimedDiscriminator)) {
                                        try {
                                            const claimedEvent = trepa.events.PoolClaimedEvent.decode({msg: hexData})
                                            
                                            const claimedEventEntity: NewClaimedEvent = {
                                                id: txSignature,
                                                transactionSignature: txSignature,
                                                timestamp: timestamp,
                                                poolAccount: claimedEvent.poolAccount,
                                                predictor: claimedEvent.predictor,
                                                poolTokenAccount: claimedEvent.poolTokenAccount,
                                                predictionAccount: claimedEvent.predictionAccount,
                                                amount: claimedEvent.amount.toString(),
                                                proof: JSON.stringify(claimedEvent.proof)
                                            }
                                        
                                            claimedEvents.push(claimedEventEntity)
                                        } catch (error) {
                                            console.error('Failed to decode PoolClaimedEvent:', error)
                                        }
                                    }

                                    // PoolCreatedEvent
                                    const poolCreatedDiscriminator = Buffer.from(trepa.events.PoolCreatedEvent.d8.slice(2), 'hex')
                                    if (discriminator.equals(poolCreatedDiscriminator)) {
                                        try {
                                            const createdEvent = trepa.events.PoolCreatedEvent.decode({msg: hexData})
                                            
                                            const createdEventEntity: NewPoolCreatedEvent = {
                                                id: txSignature,
                                                transactionSignature: txSignature,
                                                timestamp: timestamp,
                                                poolAccount: createdEvent.poolAccount,
                                                questionId: Buffer.from(createdEvent.questionId).toString('hex'),
                                                predictionEndTime: createdEvent.predictionEndTime.toString(),
                                                bump: createdEvent.bump.toString()
                                            }
                                        
                                            createdEvents.push(createdEventEntity)
                                        } catch (error) {
                                            console.error('Failed to decode PoolCreatedEvent:', error)
                                        }
                                    }

                                    // PoolFinalizedEvent
                                    const poolFinalizedDiscriminator = Buffer.from(trepa.events.PoolFinalizedEvent.d8.slice(2), 'hex')
                                    if (discriminator.equals(poolFinalizedDiscriminator)) {
                                        try {
                                            const finalizedEvent = trepa.events.PoolFinalizedEvent.decode({msg: hexData})
                                            
                                            const finalizedEventEntity: NewPoolFinalizedEvent = {
                                                id: txSignature,
                                                transactionSignature: txSignature,
                                                timestamp: timestamp,
                                                poolAccount: finalizedEvent.poolAccount,
                                                merkleRoot: Buffer.from(finalizedEvent.merkleRoot).toString('hex'),
                                                protocolFee: finalizedEvent.protocolFee.toString()
                                            }
                                        
                                            finalizedEvents.push(finalizedEventEntity)
                                        } catch (error) {
                                            console.error('Failed to decode PoolFinalizedEvent:', error)
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('Failed to process log:', error)
                        }
                    }
                }
            }
            
            // Insert all events at once (like the example)
            const allEvents = [...predictedEvents, ...claimedEvents, ...createdEvents, ...finalizedEvents]
            if (allEvents.length > 0) {
                await (ctx.store as any).insert(allEvents)
                console.log(`Inserted ${allEvents.length} total events`)
            }
        } catch (error) {
            console.error('Failed to process blocks:', error)
            throw error
        }
    })
}

startIndexer().catch(error => {
    console.error('Indexer failed:', error)
    
    // If it's a parsing error for a specific transaction, we can continue
    if (error.message && error.message.includes('missing invoke message')) {
        console.log('Encountered transaction parsing error - this is expected for router/executor calls')
        console.log('The indexer will continue processing other transactions')
        console.log('Restarting indexer...')
        setTimeout(() => {
            startIndexer().catch(restartError => {
                console.error('Indexer restart failed:', restartError)
                process.exit(1)
            })
        }, 1000)
    } else {
        process.exit(1)
    }
})
