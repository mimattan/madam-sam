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

// Startup validation
const warnings: string[] = []
if (!config.replicateApiToken) warnings.push('REPLICATE_API_TOKEN is not set - image editing will run in demo mode')
if (!config.anthropicApiKey) warnings.push('ANTHROPIC_API_KEY is not set - prompt sanitization will reject all requests')

if (warnings.length > 0) {
  console.warn('[Config] Warnings:')
  warnings.forEach(w => console.warn(`  - ${w}`))
}
