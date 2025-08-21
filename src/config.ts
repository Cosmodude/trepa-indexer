import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

export const config = {
  database: {
    url: process.env.DB_URL,
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=53c70481-6c85-4803-8b66-ba1c134cb6d8',
  },
  environment: process.env.NODE_ENV || 'development',
}
 console.log('DB URL:', config.database.url)
 console.log('RPC URL:', config.solana.rpcUrl)
