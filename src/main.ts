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
        let blocks = ctx.blocks.map(augmentBlock)
        
        console.log(`Processing ${blocks.length} blocks, total logs: ${blocks.reduce((sum, b) => sum + b.logs.length, 0)}`)
        
        for (let block of blocks) {
            for (let log of block.logs) {
                if (log.programId === trepa.programId) {
                    try {
                        const logData = (log as any).data || (log as any).message
                        if (logData && (log as any).kind === 'data') {
                            const logBuffer = Buffer.from(logData, 'base64')
                            
                            if (logBuffer.length >= 8) {
                                const discriminator = logBuffer.subarray(0, 8)
                                const expectedDiscriminator = Buffer.from(trepa.events.PoolPredictedEvent.d8.slice(2), 'hex')
                                
                                if (discriminator.equals(expectedDiscriminator)) {
                                    try {
                                        const hexData = '0x' + logBuffer.toString('hex')
                                        const predictedEvent = trepa.events.PoolPredictedEvent.decode({msg: hexData})
                                        
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
                        console.error('Failed to process log:', error)
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
