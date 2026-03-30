import { createCanvas, loadImage } from 'canvas'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerGoogleFonts, getRegisteredFontFamilies } from './fontRegistry'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

function resolveLayerPath(imageUrl: string): string {
  const __dir = path.dirname(fileURLToPath(import.meta.url))
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  } else if (imageUrl.includes('/api/images/layers/')) {
    const filename = imageUrl.split('/').pop()
    return path.join(__dir, '..', '..', 'layers', filename!)
  } else if (imageUrl.includes('/api/images/edited/')) {
    const filename = imageUrl.split('/').pop()
    return path.join(__dir, '..', '..', 'edited', filename!)
  } else if (imageUrl.includes('/api/images/cards/')) {
    const filename = imageUrl.split('/').pop()
    return path.join(__dir, '..', '..', 'cards', filename!)
  }
  return imageUrl
}

export async function composeImage(
  imagePathOrUrl: string,
  textOverlays: TextOverlay[],
  imageLayers: ImageLayer[] = []
): Promise<Buffer> {
  console.log(`[ImageComposer] Loading base image from: ${imagePathOrUrl}`)
  const image = await loadImageFromPathOrUrl(imagePathOrUrl)
  console.log(`[ImageComposer] Loaded base image: ${image.width}x${image.height}`)

  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')

  // Draw the base image
  ctx.drawImage(image, 0, 0)
  console.log(`[ImageComposer] Base image drawn`)

  // Draw image layers (below text overlays)
  for (let i = 0; i < imageLayers.length; i++) {
    const layer = imageLayers[i]
    console.log(`[ImageComposer] Drawing image layer ${i + 1}: ${layer.imageUrl}`)

    try {
      const layerPath = resolveLayerPath(layer.imageUrl)
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

      console.log(`[ImageComposer] Layer ${i + 1} drawn at (${x.toFixed(1)}, ${y.toFixed(1)}) size ${w.toFixed(1)}x${h.toFixed(1)} rotated ${layer.rotation || 0}°`)
    } catch (err) {
      console.error(`[ImageComposer] Failed to draw layer ${i + 1}:`, err instanceof Error ? err.message : String(err))
    }
  }

  // Draw text overlays (on top of image layers)
  textOverlays.forEach((overlay, index) => {
    const x = (overlay.x / 100) * canvas.width
    const y = (overlay.y / 100) * canvas.height
    const rotation = (overlay.rotation || 0) * Math.PI / 180

    console.log(`[ImageComposer] Text ${index + 1}: "${overlay.text}" at (${x.toFixed(1)}, ${y.toFixed(1)}) rotated ${overlay.rotation || 0}°`)

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
  console.log(`[ImageComposer] Composed image buffer: ${buffer.length} bytes`)
  return buffer
}

// Backward-compatible wrapper
export async function mergeTextOverlays(
  imagePathOrUrl: string,
  textOverlays: TextOverlay[]
): Promise<Buffer> {
  return composeImage(imagePathOrUrl, textOverlays, [])
}
