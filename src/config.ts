import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

const DEBUG_MODE = process.env.NODE_ENV === 'development'

function maskUrl(url: string | undefined): string {
  if (!url) return 'undefined'
  
  try {
    const urlObj = new URL(url)
    const maskedHost = urlObj.hostname.replace(/(.{2}).*(.{2})/, '$1***$2')
    return `${urlObj.protocol}//${maskedHost}${urlObj.pathname}${urlObj.search ? '?***' : ''}`
  } catch {
    return '***masked***'
  }
}

export const config = {
  database: {
    url: process.env.DB_URL,
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=53c70481-6c85-4803-8b66-ba1c134cb6d8',
  },
  environment: process.env.NODE_ENV || 'development',
}

if (DEBUG_MODE) {
  console.log('DB URL:', maskUrl(config.database.url))
  console.log('RPC URL:', maskUrl(config.solana.rpcUrl))
}
