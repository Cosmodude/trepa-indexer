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
            // rateLimit: 100
        }),
        strideConcurrency: 10
    })
    .setBlockRange({from: 400107860})
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

run(dataSource, new TypeormDatabase(), async ctx => {
    let blocks = ctx.blocks.map(augmentBlock)

    for (let block of blocks) {
        for (let log of block.logs) {
            if (log.programId === trepa.programId) {
                try {
                    const logData = (log as any).data
                    if (logData) {
                        const logBuffer = Buffer.from(logData, 'base64')
                        const discriminator = logBuffer.subarray(0, 8)
                        const expectedDiscriminator = Buffer.from(trepa.events.PoolPredictedEvent.d8.slice(2), 'hex')
                        
                        if (discriminator.equals(expectedDiscriminator)) {
                            const predictedEvent = trepa.events.PoolPredictedEvent.decode({msg: logData})
                            
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
                        }
                    }
                } catch (error) {
                    console.error('Failed to decode PoolPredictedEvent:', error)
                }
            }
        }
    }
})
