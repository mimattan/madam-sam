import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, statSync } from 'fs'
import { config } from './config.js'
import { logger } from './utils/logger.js'
import { cardsRouter } from './routes/cards.js'
import { editRouter } from './routes/edit.js'
import { downloadRouter } from './routes/download.js'
import { generateLayerRouter } from './routes/generateLayer.js'
import fontsRouter from './routes/fonts.js'
import { startFileCleanup } from './services/fileCleanup.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow loading cross-origin fonts/images
}))

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json({ limit: '10mb' }))

// Request logging
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
    }, `${req.method} ${req.url} ${res.statusCode}`)
  })
  next()
})

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const getDirSize = (dir: string): { files: number; bytes: number } => {
    try {
      const files = readdirSync(dir)
      let bytes = 0
      for (const f of files) {
        try { bytes += statSync(path.join(dir, f)).size } catch { /* skip */ }
      }
      return { files: files.length, bytes }
    } catch {
      return { files: 0, bytes: 0 }
    }
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    storage: {
      edited: getDirSize(path.join(__dirname, '..', 'edited')),
      layers: getDirSize(path.join(__dirname, '..', 'layers')),
    },
  })
})

// Serve card template images
app.use('/api/images/cards', express.static(path.join(__dirname, '..', 'cards')))

// Serve edited images
app.use('/api/images/edited', express.static(path.join(__dirname, '..', 'edited')))

// Serve generated layer images
app.use('/api/images/layers', express.static(path.join(__dirname, '..', 'layers')))

// API routes
app.use('/api/cards', cardsRouter)
app.use('/api/edit', editRouter)
app.use('/api/download', downloadRouter)
app.use('/api/generate-layer', generateLayerRouter)
app.use('/api/fonts', fontsRouter)

// Start file cleanup scheduler
startFileCleanup()

const server = app.listen(config.port, () => {
  logger.info(`Madam Sam server running on http://localhost:${config.port}`)
})

// Graceful shutdown
function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`)
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10_000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
