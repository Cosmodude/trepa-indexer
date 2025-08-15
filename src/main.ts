import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/solana-objects'
import {DataSourceBuilder, SolanaRpcClient} from '@subsquid/solana-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as trepa from './abi/trepa'

import { TrepaEvent } from "./model"
import {config} from './config'

const dataSource = new DataSourceBuilder()
    //.setGateway('https://v2.archive.subsquid.io/network/solana-mainnet')
    .setRpc({
        client: new SolanaRpcClient({
            url: config.solana.rpcUrl,
            rateLimit: 25
        }),
        strideConcurrency: 2
    })
    .setBlockRange({from: 389_273_353, to: 389_273_360}) // Focus on specific block range
    .setFields({
        block: {
            timestamp: true
        },
        transaction: {
            signatures: true
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
            transaction: true
        }
    }).build()

console.log('Data source configuration:')
console.log('- RPC URL:', config.solana.rpcUrl)
console.log('- Program ID filter:', trepa.programId)

async function startIndexer() {
    console.log('Starting indexer with timeout...')
    
    const timeout = setTimeout(() => {
        console.log('Indexer timeout - no data received in 30 seconds')
        process.exit(0)
    }, 30_000)
    
    await run(dataSource, new TypeormDatabase(), async ctx => {
        clearTimeout(timeout)
        console.log('Indexer started, processing batch...')
        let blocks = ctx.blocks.map(augmentBlock)
        
        console.log(`Processing ${blocks.length} blocks, total logs: ${blocks.reduce((sum, b) => sum + b.logs.length, 0)}`)
        
        for (let block of blocks) {
            console.log(`Block ${block.header.height}: ${block.logs.length} logs`)
            if (block.logs.length > 0) {
                console.log('Log program IDs:', block.logs.map(l => l.programId))
                console.log('Looking for Trepa program:', trepa.programId)
            }
            
            for (let log of block.logs) {
                if (log.programId === trepa.programId) {
                    console.log(`Log ${log.id}: programId: ${log.programId} checked`)
                    console.log(`Log object keys: ${Object.keys(log)}`)
                    console.log(`Log object:`, JSON.stringify(log, null, 2))
                    try {
                        const logData = (log as any).data || (log as any).message
                        console.log(`Log data exists: ${!!logData}`)
                        console.log(`Log kind: ${(log as any).kind}`)
                        if (logData && (log as any).kind === 'data') {
                                console.log(`Processing data log with length: ${logData.length}`)
                                const logBuffer = Buffer.from(logData, 'base64')
                                console.log(`Buffer length: ${logBuffer.length}`)
                                console.log(`Buffer (first 32 bytes): ${logBuffer.subarray(0, 32).toString('hex')}`)
                                
                                if (logBuffer.length >= 8) {
                                const discriminator = logBuffer.subarray(0, 8)
                                console.log(`Discriminator: ${discriminator.toString('hex')}`)
                                
                                // Check all possible event discriminators
                                const eventDiscriminators = {
                                    'PoolPredictedEvent': Buffer.from(trepa.events.PoolPredictedEvent.d8.slice(2), 'hex'),
                                    'PoolCreatedEvent': Buffer.from(trepa.events.PoolCreatedEvent.d8.slice(2), 'hex'),
                                    'PoolFinalizedEvent': Buffer.from(trepa.events.PoolFinalizedEvent.d8.slice(2), 'hex'),
                                    'PoolClaimedEvent': Buffer.from(trepa.events.PoolClaimedEvent.d8.slice(2), 'hex'),
                                    'ConfigUpdatedEvent': Buffer.from(trepa.events.ConfigUpdatedEvent.d8.slice(2), 'hex')
                                }
                                
                                console.log('Checking discriminators:')
                                for (const [eventName, expectedDisc] of Object.entries(eventDiscriminators)) {
                                    console.log(`  ${eventName}: ${expectedDisc.toString('hex')} - ${discriminator.equals(expectedDisc) ? 'MATCH!' : 'no match'}`)
                                }
                                
                                if (discriminator.equals(eventDiscriminators.PoolPredictedEvent)) {
                                    console.log('PoolPredictedEvent found')
                                    console.log(`Trying to decode with buffer length: ${logBuffer.length}`)
                                    // Try with original data first
                                    try {
                                        // Convert base64 to hex format
                                        const hexData = '0x' + logBuffer.toString('hex')
                                        console.log(`Converting to hex: ${hexData.substring(0, 50)}...`)
                                        const predictedEvent = trepa.events.PoolPredictedEvent.decode({msg: hexData})
                                        console.log('Successfully decoded with hex data')
                                        
                                        const trepaEvent = new TrepaEvent({
                                            id: log.getTransaction()?.signatures[0] || 'unknown',
                                            transactionSignature: log.getTransaction()?.signatures[0] || 'unknown',
                                            timestamp: new Date(block.header.timestamp * 1000),
                                            poolAccount: predictedEvent.poolAccount,
                                            predictor: predictedEvent.predictor,
                                            poolTokenAccount: predictedEvent.poolTokenAccount,
                                            predictionAccount: predictedEvent.predictionAccount,
                                            stake: predictedEvent.stake.toString(),
                                            feePayer: predictedEvent.feePayer
                                        })
                                    
                                        await ctx.store.insert(trepaEvent)
                                    
                                        console.log('PoolPredictedEvent saved:', {
                                            poolAccount: predictedEvent.poolAccount,
                                            predictor: predictedEvent.predictor,
                                            stake: predictedEvent.stake.toString(),
                                            timestamp: new Date(block.header.timestamp * 1000),
                                            tx: log.getTransaction()?.signatures[0] || 'unknown'
                                        })
                                    } catch (error) {
                                        console.error('Failed to decode PoolPredictedEvent:', error)
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Failed to decode PoolPredictedEvent:', error)
                    }
                }
            }
        }
    })
}

startIndexer().catch(error => {
    console.error('Indexer failed:', error)
    process.exit(1)
})
