import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import { cardsRouter } from './routes/cards.js'
import { editRouter } from './routes/edit.js'
import { downloadRouter } from './routes/download.js'
import { generateLayerRouter } from './routes/generateLayer.js'
import fontsRouter from './routes/fonts.js'
import { orderImageRouter } from './routes/orderImage.js'
import { shopifyWebhookRouter } from './routes/shopifyWebhook.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(cors({ origin: config.corsOrigin }))

// Shopify webhook needs raw body for HMAC verification — must come before express.json()
app.use('/api/webhooks/shopify', express.raw({ type: 'application/json' }), shopifyWebhookRouter)

app.use(express.json({ limit: '10mb' }))

// Serve card template images
app.use('/api/images/cards', express.static(path.join(__dirname, '..', 'cards')))

// Serve edited images
app.use('/api/images/edited', express.static(path.join(__dirname, '..', 'edited')))

// Serve generated layer images
app.use('/api/images/layers', express.static(path.join(__dirname, '..', 'layers')))

// Serve order images (permanent storage for customized cards linked to orders)
app.use('/api/images/order-images', express.static(path.join(__dirname, '..', 'order-images')))

// API routes
app.use('/api/cards', cardsRouter)
app.use('/api/edit', editRouter)
app.use('/api/download', downloadRouter)
app.use('/api/generate-layer', generateLayerRouter)
app.use('/api/fonts', fontsRouter)
app.use('/api/order-image', orderImageRouter)

app.listen(config.port, () => {
  console.log(`Madam Sam server running on http://localhost:${config.port}`)
})
