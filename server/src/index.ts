import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import { cardsRouter } from './routes/cards.js'
import { editRouter } from './routes/edit.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json({ limit: '10mb' }))

// Serve card template images
app.use('/api/images/cards', express.static(path.join(__dirname, '..', 'cards')))

// Serve edited images
app.use('/api/images/edited', express.static(path.join(__dirname, '..', 'edited')))

// API routes
app.use('/api/cards', cardsRouter)
app.use('/api/edit', editRouter)

app.listen(config.port, () => {
  console.log(`Madam Sam server running on http://localhost:${config.port}`)
})
