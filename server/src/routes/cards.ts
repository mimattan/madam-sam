import { Router } from 'express'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

interface CardTemplate {
  id: string
  name: string
  description: string
  image: string
  tags: string[]
  babyName: string
  colors: string[]
}

function loadCards(): CardTemplate[] {
  const metadataPath = path.join(__dirname, '..', '..', 'cards', 'metadata.json')
  const raw = readFileSync(metadataPath, 'utf-8')
  return JSON.parse(raw)
}

// GET /api/cards - list all card templates
router.get('/', (_req, res) => {
  const cards = loadCards()
  const cardList = cards.map((card) => ({
    id: card.id,
    name: card.name,
    description: card.description,
    tags: card.tags,
    babyName: card.babyName,
    colors: card.colors,
    thumbnailUrl: `/api/images/cards/${card.image}`,
  }))
  res.json(cardList)
})

// GET /api/cards/:id - get single card details
router.get('/:id', (req, res) => {
  const cards = loadCards()
  const card = cards.find((c) => c.id === req.params.id)
  if (!card) {
    res.status(404).json({ error: 'Card not found' })
    return
  }
  res.json({
    ...card,
    imageUrl: `/api/images/cards/${card.image}`,
    thumbnailUrl: `/api/images/cards/${card.image}`,
  })
})

export { router as cardsRouter }
