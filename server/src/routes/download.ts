import { Router } from 'express'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { composeImage, type TextOverlay, type ImageLayer } from '../services/imageComposer.js'
import { safeResolveFromUrl } from '../utils/pathValidation.js'
import { downloadRateLimiter } from '../middleware/rateLimit.js'
import { logger } from '../utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

const EDITED_DIR = path.join(__dirname, '..', '..', 'edited')
const CARDS_DIR = path.join(__dirname, '..', '..', 'cards')

// POST /api/download - merge text overlays and download
router.post('/', downloadRateLimiter, async (req, res) => {
  const { imageUrl, textOverlays, imageLayers } = req.body

  if (!imageUrl) {
    res.status(400).json({ error: 'imageUrl is required' })
    return
  }

  try {
    // Determine the image path - only allow local images (no external URLs / SSRF)
    let imagePath: string | null = null

    if (imageUrl.includes('/api/images/edited/')) {
      imagePath = safeResolveFromUrl(imageUrl, EDITED_DIR)
    } else if (imageUrl.includes('/api/images/cards/')) {
      imagePath = safeResolveFromUrl(imageUrl, CARDS_DIR)
    }

    if (!imagePath) {
      res.status(400).json({ error: 'Invalid image URL' })
      return
    }

    if (!existsSync(imagePath)) {
      res.status(404).json({ error: 'Image file not found' })
      return
    }

    const hasTextOverlays = textOverlays && textOverlays.length > 0
    const hasImageLayers = imageLayers && imageLayers.length > 0

    // If no overlays and no layers, just return the original image
    if (!hasTextOverlays && !hasImageLayers) {
      const imageBuffer = readFileSync(imagePath)
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Disposition', 'attachment; filename="card-with-text.png"')
      res.send(imageBuffer)
      return
    }

    // Compose image with text overlays and image layers
    const composedImageBuffer = await composeImage(
      imagePath,
      (textOverlays || []) as TextOverlay[],
      (imageLayers || []) as ImageLayer[]
    )

    // Send the composed image
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Disposition', 'attachment; filename="card-with-text.png"')
    res.send(composedImageBuffer)
  } catch (err) {
    logger.error({ err }, '[Download] Error processing download')
    res.status(500).json({
      error: 'Failed to generate download. Please try again.',
    })
  }
})

export { router as downloadRouter }
