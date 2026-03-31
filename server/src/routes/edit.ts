import { Router } from 'express'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sanitizePrompt } from '../services/claude.js'
import { editCardImage } from '../services/replicate.js'
import { rateLimiter } from '../middleware/rateLimit.js'
import { safeResolveFromUrl } from '../utils/pathValidation.js'
import { logger } from '../utils/logger.js'
import { costTracker } from '../services/costTracker.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const EDITED_DIR = path.join(__dirname, '..', '..', 'edited')
const CARDS_DIR = path.join(__dirname, '..', '..', 'cards')

const router = Router()

interface CardTemplate {
  id: string
  name: string
  description: string
  image: string
  tags: string[]
  colors: string[]
  allowedOperations: string[]
  suggestions: Array<{
    type: string
    label: string
    prompt: string
  }>
}

function loadCards(): CardTemplate[] {
  const metadataPath = path.join(__dirname, '..', '..', 'cards', 'metadata.json')
  const raw = readFileSync(metadataPath, 'utf-8')
  return JSON.parse(raw)
}

// POST /api/edit - edit a card with AI
router.post('/', rateLimiter, async (req, res) => {
  const { cardId, imageUrl, prompt, selectedColor, colorContext } = req.body

  if (!cardId || !prompt) {
    res.status(400).json({ error: 'cardId and prompt are required' })
    return
  }

  // Check daily spending cap
  if (!costTracker.canProceed()) {
    logger.warn('[Edit] Daily spending cap reached')
    res.status(503).json({ error: 'Service temporarily unavailable due to usage limits. Please try again tomorrow.' })
    return
  }

  const cards = loadCards()
  const card = cards.find((c) => c.id === cardId)
  if (!card) {
    res.status(404).json({ error: 'Card not found' })
    return
  }

  try {
    // Step 1: Sanitize the prompt with Claude (pass color data and allowed operations)
    costTracker.recordCall('anthropic')
    const sanitized = await sanitizePrompt(
      prompt,
      card.name,
      card.description,
      selectedColor,
      colorContext,
      card.allowedOperations
    )

    if (!sanitized.approved || !sanitized.prompt) {
      res.json({
        success: false,
        editedImageUrl: null,
        sanitizedPrompt: null,
        message: sanitized.message,
        requiresColorInput: sanitized.requiresColorInput || false,
        suggestedColors: sanitized.suggestedColors || undefined,
        colorContext: sanitized.colorContext || undefined,
        originalPrompt: sanitized.originalPrompt || undefined,
      })
      return
    }

    // Step 2: Determine the source image path or URL
    let imagePath: string | null = null
    if (imageUrl && (imageUrl.startsWith('/api/images/edited/') || imageUrl.includes('/api/images/edited/'))) {
      imagePath = safeResolveFromUrl(imageUrl, EDITED_DIR)
    } else if (imageUrl && (imageUrl.startsWith('/api/images/cards/') || imageUrl.includes('/api/images/cards/'))) {
      imagePath = safeResolveFromUrl(imageUrl, CARDS_DIR)
    }

    // Fall back to original card image if no valid URL provided
    if (!imagePath) {
      imagePath = path.join(CARDS_DIR, card.image)
    }

    // Step 3: Edit the image with FLUX Kontext Pro
    costTracker.recordCall('replicate')
    const editResult = await editCardImage(imagePath, sanitized.prompt)

    if (!editResult.success) {
      res.status(500).json({
        success: false,
        editedImageUrl: null,
        sanitizedPrompt: sanitized.prompt,
        message: 'Image editing failed. Please try again.',
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
    logger.error({ err }, '[Edit] Error processing edit request')
    res.status(500).json({
      success: false,
      editedImageUrl: null,
      sanitizedPrompt: null,
      message: 'An error occurred. Please try again.',
    })
  }
})

export { router as editRouter }
