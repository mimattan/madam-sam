import Replicate from 'replicate'
import { createCanvas, loadImage } from 'canvas'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { config } from '../config.js'
import { analyzeCardStyle, type StyleAnalysis } from './styleAnalyzer.js'

const __dirname = join(fileURLToPath(import.meta.url), '..')
const replicate = new Replicate({ auth: config.replicateApiToken })

const LAYERS_DIR = join(__dirname, '..', '..', 'layers')

// Ensure layers directory exists
if (!existsSync(LAYERS_DIR)) {
  mkdirSync(LAYERS_DIR, { recursive: true })
}

export interface LayerGenerationResult {
  success: boolean
  layerImageUrl: string | null
  userPrompt: string | null  // Original user prompt (without AI additions)
  error: string | null
}

function buildLayerPrompt(userPrompt: string, style: StyleAnalysis): string {
  return `${userPrompt}, ${style.stylePromptFragment}, on a pure white background, isolated element, no background, single object, clean edges`
}

async function removeWhiteBackground(imageBuffer: Buffer): Promise<Buffer> {
  const image = await loadImage(imageBuffer)
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')

  ctx.drawImage(image, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Convert near-white pixels to transparent
  const threshold = 240
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0 // Set alpha to 0 (transparent)
    } else if (r >= 220 && g >= 220 && b >= 220) {
      // Semi-transparent for near-white pixels (smooth edges)
      const brightness = (r + g + b) / 3
      const alpha = Math.round(255 * (1 - (brightness - 220) / (255 - 220)))
      data[i + 3] = Math.min(data[i + 3], alpha)
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toBuffer('image/png')
}

export async function generateLayerImage(
  cardId: string,
  cardImagePath: string,
  sanitizedPrompt: string
): Promise<LayerGenerationResult> {
  if (!config.replicateApiToken) {
    console.log('[LayerGenerator] Running in DEMO mode - no API token configured')
    return {
      success: false,
      layerImageUrl: null,
      userPrompt: sanitizedPrompt,
      error: 'Replicate API token not configured. Layer generation requires an API token.',
    }
  }

  console.log('[LayerGenerator] Starting layer generation')
  console.log('[LayerGenerator] Card ID:', cardId)
  console.log('[LayerGenerator] Prompt:', sanitizedPrompt)

  try {
    // Get style analysis for the card
    const style = await analyzeCardStyle(cardId, cardImagePath)
    console.log('[LayerGenerator] Style analysis:', style.artisticStyle)

    // Build the full prompt with style matching
    const fullPrompt = buildLayerPrompt(sanitizedPrompt, style)
    console.log('[LayerGenerator] Full prompt:', fullPrompt)

    // Generate the image using FLUX Kontext Pro with the card as reference
    let inputImage: string | Buffer
    if (cardImagePath.startsWith('http://') || cardImagePath.startsWith('https://')) {
      inputImage = cardImagePath
    } else {
      const { readFileSync } = await import('fs')
      inputImage = readFileSync(cardImagePath)
    }

    const output = await replicate.run('black-forest-labs/flux-kontext-pro', {
      input: {
        prompt: fullPrompt,
        input_image: inputImage,
        aspect_ratio: '1:1',
        safety_tolerance: 2,
      },
    })

    const resultUrl = typeof output === 'string' ? output : String(output)

    // Download the generated image
    const response = await fetch(resultUrl)
    if (!response.ok) {
      throw new Error(`Failed to download generated layer: ${response.statusText}`)
    }

    const rawBuffer = Buffer.from(await response.arrayBuffer())

    // Remove white background
    console.log('[LayerGenerator] Removing white background...')
    const transparentBuffer = await removeWhiteBackground(rawBuffer)

    // Note: For layers, we generate at 1:1 aspect ratio (square) and let the client resize
    // The client controls the final display size via width/height percentages
    // No dimension enforcement needed here since layers are decorative elements

    // Save to layers directory
    const filename = `${uuid()}.png`
    writeFileSync(join(LAYERS_DIR, filename), transparentBuffer)
    console.log('[LayerGenerator] Layer saved as:', filename)

    return {
      success: true,
      layerImageUrl: `/api/images/layers/${filename}`,
      userPrompt: sanitizedPrompt,
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during layer generation'
    console.error('[LayerGenerator] Error:', message)
    return {
      success: false,
      layerImageUrl: null,
      userPrompt: sanitizedPrompt,
      error: message,
    }
  }
}
