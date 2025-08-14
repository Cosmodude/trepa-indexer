import 'dotenv/config'

export const config = {
  database: {
    url: process.env.DB_URL || 'postgresql://postgres:password@localhost:5433/postgres',
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=53c70481-6c85-4803-8b66-ba1c134cb6d8',
  },
  environment: process.env.NODE_ENV || 'development',
}
