import { Router } from 'express'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sanitizePrompt } from '../services/claude.js'
import { editCardImage } from '../services/replicate.js'
import { rateLimiter } from '../middleware/rateLimit.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

interface CardTemplate {
  id: string
  name: string
  description: string
  image: string
}

function loadCards(): CardTemplate[] {
  const metadataPath = path.join(__dirname, '..', '..', 'cards', 'metadata.json')
  const raw = readFileSync(metadataPath, 'utf-8')
  return JSON.parse(raw)
}

// POST /api/edit - edit a card with AI
router.post('/', rateLimiter, async (req, res) => {
  const { cardId, imageUrl, prompt } = req.body

  if (!cardId || !prompt) {
    res.status(400).json({ error: 'cardId and prompt are required' })
    return
  }

  const cards = loadCards()
  const card = cards.find((c) => c.id === cardId)
  if (!card) {
    res.status(404).json({ error: 'Card not found' })
    return
  }

  try {
    // Step 1: Sanitize the prompt with Claude
    const sanitized = await sanitizePrompt(prompt, card.name, card.description)

    if (!sanitized.approved || !sanitized.prompt) {
      res.json({
        success: false,
        editedImageUrl: null,
        sanitizedPrompt: null,
        message: sanitized.message,
      })
      return
    }

    // Step 2: Determine the source image URL
    const sourceImageUrl = imageUrl || `/api/images/cards/${card.image}`

    // For Replicate, we need an absolute URL
    const absoluteImageUrl = sourceImageUrl.startsWith('http')
      ? sourceImageUrl
      : `http://localhost:${process.env.PORT || 3000}${sourceImageUrl}`

    // Step 3: Edit the image with FLUX Kontext Pro
    const editResult = await editCardImage(absoluteImageUrl, sanitized.prompt)

    if (!editResult.success) {
      res.status(500).json({
        success: false,
        editedImageUrl: null,
        sanitizedPrompt: sanitized.prompt,
        message: `Image editing failed: ${editResult.error}`,
      })
      return
    }

    res.json({
      success: true,
      editedImageUrl: editResult.editedImageUrl,
      sanitizedPrompt: sanitized.prompt,
      message: sanitized.message,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({
      success: false,
      editedImageUrl: null,
      sanitizedPrompt: null,
      message: `Server error: ${message}`,
    })
  }
})

export { router as editRouter }
