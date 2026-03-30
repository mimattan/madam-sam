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

  const cards = loadCards()
  const card = cards.find((c) => c.id === cardId)
  if (!card) {
    res.status(404).json({ error: 'Card not found' })
    return
  }

  try {
    // Step 1: Sanitize the prompt with Claude (pass color data and allowed operations)
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
    let imagePath: string
    if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('localhost') && !imageUrl.includes('127.0.0.1')) {
      // If it's an external URL (not localhost), use it directly
      imagePath = imageUrl
    } else if (imageUrl && (imageUrl.startsWith('/api/images/edited/') || imageUrl.includes('/api/images/edited/'))) {
      // If it's a previously edited image, get the file path
      const filename = imageUrl.split('/').pop()
      imagePath = path.join(__dirname, '..', '..', 'edited', filename!)
    } else if (imageUrl && (imageUrl.startsWith('/api/images/cards/') || imageUrl.includes('/api/images/cards/'))) {
      // If it's a card image URL (including localhost URLs), get the file path
      const filename = imageUrl.split('/').pop()
      imagePath = path.join(__dirname, '..', '..', 'cards', filename!)
    } else {
      // Otherwise, use the original card image file path
      imagePath = path.join(__dirname, '..', '..', 'cards', card.image)
    }

    // Step 3: Edit the image with FLUX Kontext Pro
    const editResult = await editCardImage(imagePath, sanitized.prompt)

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
