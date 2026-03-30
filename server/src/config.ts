import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  replicateApiToken: process.env.REPLICATE_API_TOKEN || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  maxEditsPerHour: parseInt(process.env.MAX_EDITS_PER_HOUR || '20', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
}

// Debug: confirm which keys are loaded (show first/last 4 chars only)
const maskKey = (key: string) => key ? `${key.slice(0, 4)}...${key.slice(-4)} (${key.length} chars)` : '(empty)'
console.log(`[Config] .env path: ${join(__dirname, '..', '.env')}`)
console.log(`[Config] ANTHROPIC_API_KEY: ${maskKey(config.anthropicApiKey)}`)
console.log(`[Config] REPLICATE_API_TOKEN: ${maskKey(config.replicateApiToken)}`)
