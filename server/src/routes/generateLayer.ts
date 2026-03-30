import { Router } from 'express'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sanitizeLayerPrompt } from '../services/claude.js'
import { generateLayerImage } from '../services/layerImageGenerator.js'
import { analyzeCardStyle } from '../services/styleAnalyzer.js'
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

// POST /api/generate-layer - generate a small image layer
router.post('/', rateLimiter, async (req, res) => {
  const { cardId, prompt, imageUrl } = req.body

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
    // Step 1: Determine the source image path
    let imagePath: string
    if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('localhost') && !imageUrl.includes('127.0.0.1')) {
      imagePath = imageUrl
    } else if (imageUrl && imageUrl.includes('/api/images/edited/')) {
      const filename = imageUrl.split('/').pop()
      imagePath = path.join(__dirname, '..', '..', 'edited', filename!)
    } else if (imageUrl && imageUrl.includes('/api/images/cards/')) {
      const filename = imageUrl.split('/').pop()
      imagePath = path.join(__dirname, '..', '..', 'cards', filename!)
    } else {
      imagePath = path.join(__dirname, '..', '..', 'cards', card.image)
    }

    // Step 2: Get style analysis (cached)
    const style = await analyzeCardStyle(cardId, imagePath)
    const styleJson = JSON.stringify(style, null, 2)

    // Step 3: Sanitize the prompt with the layer-specific system prompt
    const sanitized = await sanitizeLayerPrompt(prompt, card.name, card.description, styleJson)

    if (!sanitized.approved || !sanitized.prompt) {
      res.json({
        success: false,
        layerImageUrl: null,
        prompt: null,
        message: sanitized.message,
      })
      return
    }

    // Step 4: Generate the layer image
    const result = await generateLayerImage(cardId, imagePath, sanitized.prompt)

    if (!result.success) {
      res.status(500).json({
        success: false,
        layerImageUrl: null,
        prompt: sanitized.prompt,
        message: `Layer generation failed: ${result.error}`,
      })
      return
    }

    res.json({
      success: true,
      layerImageUrl: result.layerImageUrl,
      prompt: sanitized.prompt,
      message: sanitized.message,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({
      success: false,
      layerImageUrl: null,
      prompt: null,
      message: `Server error: ${message}`,
    })
  }
})

export { router as generateLayerRouter }
