import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  replicateApiToken: process.env.REPLICATE_API_TOKEN || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  maxEditsPerHour: parseInt(process.env.MAX_EDITS_PER_HOUR || '20', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
}
