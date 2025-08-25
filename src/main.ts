import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/solana-objects'
import {DataSourceBuilder, SolanaRpcClient} from '@subsquid/solana-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as trepa from './abi/trepa'

import { 
    PredictedEvent, 
    ClaimedEvent, 
    PoolCreatedEvent, 
    PoolFinalizedEvent 
} from "./model"
import {config} from './config'

const START_BLOCK_HEIGHT = 391_337_790

const dataSource = new DataSourceBuilder()
    //.setGateway('https://v2.archive.subsquid.io/network/solana-mainnet')
    .setRpc({
        client: new SolanaRpcClient({
            url: config.solana.rpcUrl,
            rateLimit: 25
        }),
        strideConcurrency: 8
    })
    .setBlockRange({from: START_BLOCK_HEIGHT})
    .setFields({
        block: {
            timestamp: true
        },
        transaction: {
            signatures: true,
            success: true,
            instructions: {
                programId: true
            }
        },
        log: {
            programId: true,
            data: true
        }
    })
    .addLog({
        where: {
            programId: [trepa.programId]
        },
        include: {
            transaction: true,
        }
    })
    .build()

console.log('Data source configuration:')
console.log('- RPC URL:', config.solana.rpcUrl)
console.log('- Program ID filter:', trepa.programId)
console.log('- Note: Transactions that call router/executor programs (not direct calls) will be ignored')

async function startIndexer() {
    console.log('Starting indexer with timeout...')
    
    const timeout = setTimeout(() => {
        console.log('Indexer timeout - no data received in 30 seconds')
        process.exit(0)
    }, 30_000)
    
    await run(dataSource, new TypeormDatabase(), async ctx => {
        clearTimeout(timeout)
        
        try {
            let blocks = ctx.blocks.map(augmentBlock)
            
            console.log(`Processing ${blocks.length} blocks (at block height ${blocks[0]?.header.height || 'unknown'}), total logs: ${blocks.reduce((sum, b) => sum + b.logs.length, 0)}`)
            
            for (let block of blocks) {
                for (let log of block.logs) {
                    if (log.programId === trepa.programId) {
                        // Check if transaction exists before processing
                        let transaction
                        try {
                            transaction = log.getTransaction()
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                            console.log('Skipping log - no transaction found:', errorMessage)
                            continue
                        }
                        
                        if (!transaction) {
                            console.log('Skipping log - no transaction found')
                            continue
                        }
                        
                        // Note: We're processing all logs from our program, even if called indirectly
                        // This allows us to capture events from router/executor calls
                        
                        try {
                            const logData = (log as any).data || (log as any).message
                            console.log('Processing log:', {
                                hasData: !!logData,
                                kind: (log as any).kind,
                                dataLength: logData ? logData.length : 0
                            })
                            
                            if (logData && (log as any).kind === 'data') {
                                const logBuffer = Buffer.from(logData, 'base64')
                                
                                if (logBuffer.length >= 8) {
                                    const discriminator = logBuffer.subarray(0, 8)
                                    const hexData = '0x' + logBuffer.toString('hex')
                                    const txSignature = transaction?.signatures[0] || 'unknown'
                                    const timestamp = new Date(block.header.timestamp * 1000)
                                    
                                    console.log('Log discriminator:', discriminator.toString('hex'))

                                    // PoolPredictedEvent
                                    const predictedDiscriminator = Buffer.from(trepa.events.PoolPredictedEvent.d8.slice(2), 'hex')
                                    if (discriminator.equals(predictedDiscriminator)) {
                                        try {
                                            const predictedEvent = trepa.events.PoolPredictedEvent.decode({msg: hexData})
                                            
                                            const predictedEventEntity = new PredictedEvent({
                                                id: txSignature,
                                                transactionSignature: txSignature,
                                                timestamp: timestamp,
                                                poolAccount: predictedEvent.poolAccount,
                                                predictor: predictedEvent.predictor,
                                                poolTokenAccount: predictedEvent.poolTokenAccount,
                                                predictionAccount: predictedEvent.predictionAccount,
                                                stake: predictedEvent.stake.toString(),
                                                feePayer: predictedEvent.feePayer
                                            })
                                        
                                            await ctx.store.insert(predictedEventEntity)
                                        
                                            console.log('PoolPredictedEvent saved:', {
                                                poolAccount: predictedEvent.poolAccount,
                                                predictor: predictedEvent.predictor,
                                                stake: predictedEvent.stake.toString(),
                                                timestamp: timestamp,
                                                tx: txSignature
                                            })
                                        } catch (error) {
                                            console.error('Failed to decode PoolPredictedEvent:', error)
                                        }
                                    }

                                    // PoolClaimedEvent
                                    const poolClaimedDiscriminator = Buffer.from(trepa.events.PoolClaimedEvent.d8.slice(2), 'hex')
                                    if (discriminator.equals(poolClaimedDiscriminator)) {
                                        try {
                                            const claimedEvent = trepa.events.PoolClaimedEvent.decode({msg: hexData})
                                            
                                            const claimedEventEntity = new ClaimedEvent({
                                                id: txSignature,
                                                transactionSignature: txSignature,
                                                timestamp: timestamp,
                                                poolAccount: claimedEvent.poolAccount,
                                                predictor: claimedEvent.predictor,
                                                poolTokenAccount: claimedEvent.poolTokenAccount,
                                                predictionAccount: claimedEvent.predictionAccount,
                                                amount: claimedEvent.amount.toString(),
                                                proof: JSON.stringify(claimedEvent.proof)
                                            })
                                        
                                            await ctx.store.insert(claimedEventEntity)
                                        
                                            console.log('PoolClaimedEvent saved:', {
                                                poolAccount: claimedEvent.poolAccount,
                                                predictor: claimedEvent.predictor,
                                                amount: claimedEvent.amount.toString(),
                                                timestamp: timestamp,
                                                tx: txSignature
                                            })
                                        } catch (error) {
                                            console.error('Failed to decode PoolClaimedEvent:', error)
                                        }
                                    }

                                    // PoolCreatedEvent
                                    const poolCreatedDiscriminator = Buffer.from(trepa.events.PoolCreatedEvent.d8.slice(2), 'hex')
                                    if (discriminator.equals(poolCreatedDiscriminator)) {
                                        try {
                                            const createdEvent = trepa.events.PoolCreatedEvent.decode({msg: hexData})
                                            
                                            const createdEventEntity = new PoolCreatedEvent({
                                                id: txSignature,
                                                transactionSignature: txSignature,
                                                timestamp: timestamp,
                                                poolAccount: createdEvent.poolAccount,
                                                questionId: Buffer.from(createdEvent.questionId).toString('hex'),
                                                predictionEndTime: createdEvent.predictionEndTime.toString(),
                                                bump: createdEvent.bump.toString()
                                            })
                                        
                                            await ctx.store.insert(createdEventEntity)
                                        
                                            console.log('PoolCreatedEvent saved:', {
                                                poolAccount: createdEvent.poolAccount,
                                                questionId: Buffer.from(createdEvent.questionId).toString('hex'),
                                                predictionEndTime: createdEvent.predictionEndTime.toString(),
                                                timestamp: timestamp,
                                                tx: txSignature
                                            })
                                        } catch (error) {
                                            console.error('Failed to decode PoolCreatedEvent:', error)
                                        }
                                    }

                                    // PoolFinalizedEvent
                                    const poolFinalizedDiscriminator = Buffer.from(trepa.events.PoolFinalizedEvent.d8.slice(2), 'hex')
                                    if (discriminator.equals(poolFinalizedDiscriminator)) {
                                        try {
                                            const finalizedEvent = trepa.events.PoolFinalizedEvent.decode({msg: hexData})
                                            
                                            const finalizedEventEntity = new PoolFinalizedEvent({
                                                id: txSignature,
                                                transactionSignature: txSignature,
                                                timestamp: timestamp,
                                                poolAccount: finalizedEvent.poolAccount,
                                                merkleRoot: Buffer.from(finalizedEvent.merkleRoot).toString('hex'),
                                                protocolFee: finalizedEvent.protocolFee.toString()
                                            })
                                        
                                            await ctx.store.insert(finalizedEventEntity)
                                        
                                            console.log('PoolFinalizedEvent saved:', {
                                                poolAccount: finalizedEvent.poolAccount,
                                                merkleRoot: Buffer.from(finalizedEvent.merkleRoot).toString('hex'),
                                                protocolFee: finalizedEvent.protocolFee.toString(),
                                                timestamp: timestamp,
                                                tx: txSignature
                                            })
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
