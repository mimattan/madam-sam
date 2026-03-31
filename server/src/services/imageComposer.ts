import { createCanvas, loadImage } from 'canvas'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerGoogleFonts, getRegisteredFontFamilies } from './fontRegistry'
import { safeResolveFromUrl } from '../utils/pathValidation.js'
import { logger } from '../utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LAYERS_DIR = path.join(__dirname, '..', '..', 'layers')
const EDITED_DIR = path.join(__dirname, '..', '..', 'edited')
const CARDS_DIR = path.join(__dirname, '..', '..', 'cards')

const MAX_IMAGE_DIMENSION = 4096

// Register all Google Fonts on module load
const registeredFonts = registerGoogleFonts()

// Font mapping - use registered Google Fonts when available, fallback to system fonts
function getFontFamily(fontFamily: string): string {
  if (registeredFonts.includes(fontFamily)) {
    return fontFamily
  }
  
  // Fallback to system fonts for fonts we haven't downloaded yet
  const fontMap: Record<string, string> = {
    // Serif fonts -> Georgia (until you download them)
    'Playfair Display': 'Georgia',
    'Merriweather': 'Georgia',
    'Lora': 'Georgia',
    'Crimson Text': 'Georgia',
    'EB Garamond': 'Georgia',
    'Libre Baskerville': 'Georgia',
    'Cormorant Garamond': 'Georgia',
    
    // Sans-serif fonts -> Helvetica/Arial (until you download them)
    'Inter': 'Helvetica',
    'Montserrat': 'Helvetica',
    'Open Sans': 'Helvetica',
    // 'Roboto': 'Roboto' // Now using actual Roboto font!
    'Poppins': 'Helvetica',
    'Raleway': 'Helvetica',
    'Nunito': 'Arial',
    'Work Sans': 'Helvetica',
    'Josefin Sans': 'Helvetica',
    
    // Script/Display fonts -> Now using actual Google Fonts!
    'Pacifico': 'Pacifico', // ✅ Now using actual Pacifico font
    'Dancing Script': 'Verdana',
    'Great Vibes': 'Verdana',
    'Satisfy': 'Verdana',
    'Lobster': 'Lobster', // ✅ Now using actual Lobster font
    'Bebas Neue': 'Impact',
    'Righteous': 'Impact',
    'Fredoka One': 'Verdana',
    'Caveat': 'Verdana',
    'Amatic SC': 'Verdana',
    'Luckiest Guy': 'Luckiest Guy', // ✅ Now using actual Luckiest Guy font
    
    // Monospace fonts -> Courier New
    'Courier New': 'Courier New',
    'Roboto Mono': 'Courier New',
    'Source Code Pro': 'Courier New',
  }
  
  return fontMap[fontFamily] || 'Helvetica'
}

export interface TextOverlay {
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fontWeight: string
  fontStyle: string
  color: string
  rotation?: number
}

export interface ImageLayer {
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

async function loadImageFromPathOrUrl(imagePathOrUrl: string) {
  if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
    return await loadImage(imagePathOrUrl)
  } else {
    if (!existsSync(imagePathOrUrl)) {
      throw new Error(`Image file not found: ${imagePathOrUrl}`)
    }
    const imageBuffer = readFileSync(imagePathOrUrl)
    return await loadImage(imageBuffer)
  }
}

function resolveLayerPath(imageUrl: string): string | null {
  if (imageUrl.includes('/api/images/layers/')) {
    return safeResolveFromUrl(imageUrl, LAYERS_DIR)
  } else if (imageUrl.includes('/api/images/edited/')) {
    return safeResolveFromUrl(imageUrl, EDITED_DIR)
  } else if (imageUrl.includes('/api/images/cards/')) {
    return safeResolveFromUrl(imageUrl, CARDS_DIR)
  }
  return null
}

export async function composeImage(
  imagePathOrUrl: string,
  textOverlays: TextOverlay[],
  imageLayers: ImageLayer[] = []
): Promise<Buffer> {
  logger.debug({ path: imagePathOrUrl }, '[ImageComposer] Loading base image')
  const image = await loadImageFromPathOrUrl(imagePathOrUrl)

  if (image.width > MAX_IMAGE_DIMENSION || image.height > MAX_IMAGE_DIMENSION) {
    throw new Error(`Image dimensions ${image.width}x${image.height} exceed maximum ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}`)
  }

  logger.debug({ width: image.width, height: image.height }, '[ImageComposer] Loaded base image')

  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')

  // Draw the base image
  ctx.drawImage(image, 0, 0)

  // Draw image layers (below text overlays)
  for (let i = 0; i < imageLayers.length; i++) {
    const layer = imageLayers[i]
    logger.debug({ layer: i + 1, url: layer.imageUrl }, '[ImageComposer] Drawing image layer')

    try {
      const layerPath = resolveLayerPath(layer.imageUrl)
      if (!layerPath) {
        logger.warn({ url: layer.imageUrl }, '[ImageComposer] Invalid layer image URL, skipping')
        continue
      }
      const layerImg = await loadImageFromPathOrUrl(layerPath)

      const x = (layer.x / 100) * canvas.width
      const y = (layer.y / 100) * canvas.height
      const w = (layer.width / 100) * canvas.width
      const h = (layer.height / 100) * canvas.height
      const rotation = (layer.rotation || 0) * Math.PI / 180

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.drawImage(layerImg, -w / 2, -h / 2, w, h)
      ctx.restore()

      logger.debug({ layer: i + 1, x: x.toFixed(1), y: y.toFixed(1), w: w.toFixed(1), h: h.toFixed(1), rotation: layer.rotation || 0 }, '[ImageComposer] Layer drawn')
    } catch (err) {
      logger.error({ err, layer: i + 1 }, '[ImageComposer] Failed to draw layer')
    }
  }

  // Draw text overlays (on top of image layers)
  textOverlays.forEach((overlay, index) => {
    const x = (overlay.x / 100) * canvas.width
    const y = (overlay.y / 100) * canvas.height
    const rotation = (overlay.rotation || 0) * Math.PI / 180

    logger.debug({ text: overlay.text, x: x.toFixed(1), y: y.toFixed(1), rotation: overlay.rotation || 0 }, '[ImageComposer] Drawing text overlay')

    const fontFamily = getFontFamily(overlay.fontFamily)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    const fontString = `${overlay.fontStyle} ${overlay.fontWeight} ${overlay.fontSize}px ${fontFamily}`
    ctx.font = fontString
    ctx.fillStyle = overlay.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    ctx.fillText(overlay.text, 0, 0)
    ctx.restore()
  })

  const buffer = canvas.toBuffer('image/png')
  logger.debug({ bytes: buffer.length }, '[ImageComposer] Composed image')
  return buffer
}

// Backward-compatible wrapper
export async function mergeTextOverlays(
  imagePathOrUrl: string,
  textOverlays: TextOverlay[]
): Promise<Buffer> {
  return composeImage(imagePathOrUrl, textOverlays, [])
}
