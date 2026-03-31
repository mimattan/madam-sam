import { Router } from 'express'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sanitizeLayerPrompt } from '../services/claude.js'
import { generateLayerImage } from '../services/layerImageGenerator.js'
import { analyzeCardStyle } from '../services/styleAnalyzer.js'
import { rateLimiter } from '../middleware/rateLimit.js'
import { safeResolveFromUrl } from '../utils/pathValidation.js'
import { logger } from '../utils/logger.js'
import { costTracker } from '../services/costTracker.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const EDITED_DIR = path.join(__dirname, '..', '..', 'edited')
const CARDS_DIR = path.join(__dirname, '..', '..', 'cards')

const MAX_LAYERS_PER_SESSION = 10

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

// Track layer generation count per IP within the rate limit window
const layerCountByIp = new Map<string, { count: number; resetAt: number }>()

function checkLayerLimit(ip: string): boolean {
  const now = Date.now()
  const entry = layerCountByIp.get(ip)

  if (!entry || now > entry.resetAt) {
    layerCountByIp.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }

  if (entry.count >= MAX_LAYERS_PER_SESSION) {
    return false
  }

  entry.count++
  return true
}

// POST /api/generate-layer - generate a small image layer
router.post('/', rateLimiter, async (req, res) => {
  const { cardId, prompt, imageUrl } = req.body

  if (!cardId || !prompt) {
    res.status(400).json({ error: 'cardId and prompt are required' })
    return
  }

  // Check daily spending cap
  if (!costTracker.canProceed()) {
    logger.warn('[GenerateLayer] Daily spending cap reached')
    res.status(503).json({ error: 'Service temporarily unavailable due to usage limits. Please try again tomorrow.' })
    return
  }

  // Check per-IP layer generation limit
  const clientIp = req.ip || 'unknown'
  if (!checkLayerLimit(clientIp)) {
    res.status(429).json({
      error: `Maximum of ${MAX_LAYERS_PER_SESSION} layer generations per hour. Please try again later.`,
    })
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
    let imagePath: string | null = null
    if (imageUrl && imageUrl.includes('/api/images/edited/')) {
      imagePath = safeResolveFromUrl(imageUrl, EDITED_DIR)
    } else if (imageUrl && imageUrl.includes('/api/images/cards/')) {
      imagePath = safeResolveFromUrl(imageUrl, CARDS_DIR)
    }

    // Fall back to original card image
    if (!imagePath) {
      imagePath = path.join(CARDS_DIR, card.image)
    }

    // Step 2: Get style analysis (cached)
    costTracker.recordCall('anthropic')
    const style = await analyzeCardStyle(cardId, imagePath)
    const styleJson = JSON.stringify(style, null, 2)

    // Step 3: Sanitize the prompt with the layer-specific system prompt
    costTracker.recordCall('anthropic')
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
    costTracker.recordCall('replicate')
    const result = await generateLayerImage(cardId, imagePath, sanitized.prompt)

    if (!result.success) {
      res.status(500).json({
        success: false,
        layerImageUrl: null,
        prompt: sanitized.prompt,
        message: 'Layer generation failed. Please try again.',
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
    logger.error({ err }, '[GenerateLayer] Error processing layer generation')
    res.status(500).json({
      success: false,
      layerImageUrl: null,
      prompt: null,
      message: 'An error occurred. Please try again.',
    })
  }
})

export { router as generateLayerRouter }
