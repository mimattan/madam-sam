import { Router } from 'express'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { composeImage, type TextOverlay, type ImageLayer } from '../services/imageComposer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

// POST /api/download - merge text overlays and download
router.post('/', async (req, res) => {
  const { imageUrl, textOverlays, imageLayers } = req.body

  if (!imageUrl) {
    res.status(400).json({ error: 'imageUrl is required' })
    return
  }

  try {
    // Determine the image path
    let imagePath: string
    if (imageUrl.startsWith('http') && !imageUrl.includes('localhost') && !imageUrl.includes('127.0.0.1')) {
      // External URL
      imagePath = imageUrl
    } else if (imageUrl.includes('/api/images/edited/')) {
      // Edited image
      const filename = imageUrl.split('/').pop()
      imagePath = path.join(__dirname, '..', '..', 'edited', filename!)
    } else if (imageUrl.includes('/api/images/cards/')) {
      // Card image
      const filename = imageUrl.split('/').pop()
      imagePath = path.join(__dirname, '..', '..', 'cards', filename!)
    } else {
      res.status(400).json({ error: 'Invalid image URL' })
      return
    }

    // Check if file exists (for local paths)
    if (!imagePath.startsWith('http') && !existsSync(imagePath)) {
      res.status(404).json({ error: 'Image file not found' })
      return
    }

    const hasTextOverlays = textOverlays && textOverlays.length > 0
    const hasImageLayers = imageLayers && imageLayers.length > 0

    // If no overlays and no layers, just return the original image
    if (!hasTextOverlays && !hasImageLayers) {
      if (imagePath.startsWith('http')) {
        // Redirect to the URL
        res.redirect(imagePath)
      } else {
        // Send the file
        const imageBuffer = readFileSync(imagePath)
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Content-Disposition', 'attachment; filename="card-with-text.png"')
        res.send(imageBuffer)
      }
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Download] Error:', message)
    res.status(500).json({
      error: 'Failed to generate download',
      message,
    })
  }
})

export { router as downloadRouter }
