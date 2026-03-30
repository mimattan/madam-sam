import Replicate from 'replicate'
import { createCanvas, loadImage } from 'canvas'
import { config } from '../config.js'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

const __dirname = join(fileURLToPath(import.meta.url), '..')

const replicate = new Replicate({ auth: config.replicateApiToken })

export interface EditResult {
  success: boolean
  editedImageUrl: string | null
  error: string | null
}

export async function editCardImage(
  imagePathOrUrl: string,
  prompt: string
): Promise<EditResult> {
  console.log('[Replicate] API Token present:', !!config.replicateApiToken)
  console.log('[Replicate] Token length:', config.replicateApiToken?.length || 0)
  
  if (!config.replicateApiToken) {
    console.log('[Replicate] Running in DEMO mode - no API token configured')
    // Demo mode: return the original image with a note
    return {
      success: true,
      editedImageUrl: imagePathOrUrl,
      error: null,
    }
  }
  
  console.log('[Replicate] Starting image edit with FLUX Kontext Pro')
  console.log('[Replicate] Image path/URL:', imagePathOrUrl)
  console.log('[Replicate] Prompt:', prompt)

  try {
    // Load original image to get dimensions
    console.log('[Replicate] Loading original image to get dimensions')
    const originalImage = await loadImage(imagePathOrUrl)
    const targetWidth = originalImage.width
    const targetHeight = originalImage.height
    console.log('[Replicate] Original dimensions:', `${targetWidth}x${targetHeight}`)

    // Determine if input is a file path or URL
    let inputImage: string | Buffer
    if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
      // It's a URL, use it directly
      inputImage = imagePathOrUrl
    } else {
      // It's a file path, read the file and upload it
      if (!existsSync(imagePathOrUrl)) {
        throw new Error(`Image file not found: ${imagePathOrUrl}`)
      }
      inputImage = readFileSync(imagePathOrUrl)
      console.log('[Replicate] Uploading local file to Replicate')
    }

    // Wrap prompt with explicit preservation instructions for Kontext
    const preservedPrompt = `${prompt}. Maintain the exact same illustration, composition, layout, line work, and artistic style. Only modify the specified colors or atmosphere, keeping everything else identical.`

    const output = await replicate.run('black-forest-labs/flux-kontext-pro', {
      input: {
        prompt: preservedPrompt,
        input_image: inputImage,
        aspect_ratio: 'match_input_image',
        output_format: 'png',
        safety_tolerance: 2,
        guidance_scale: 3.5,
        num_inference_steps: 28,
      },
    })

    // Output is a FileOutput (URL-like object)
    const resultUrl = typeof output === 'string' ? output : String(output)

    // Download the edited image
    console.log('[Replicate] Downloading edited image from:', resultUrl)
    const response = await fetch(resultUrl)
    if (!response.ok) {
      throw new Error(`Failed to download edited image: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Load edited image and check dimensions
    const editedImage = await loadImage(buffer)
    console.log('[Replicate] Edited image dimensions:', `${editedImage.width}x${editedImage.height}`)

    let finalBuffer: Buffer

    // Resize if dimensions don't match
    if (editedImage.width !== targetWidth || editedImage.height !== targetHeight) {
      console.log('[Replicate] Resizing edited image to match original dimensions')
      const canvas = createCanvas(targetWidth, targetHeight)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(editedImage, 0, 0, targetWidth, targetHeight)
      finalBuffer = canvas.toBuffer('image/png')
      console.log('[Replicate] Image resized to:', `${targetWidth}x${targetHeight}`)
    } else {
      console.log('[Replicate] Dimensions match, no resize needed')
      finalBuffer = buffer
    }

    const filename = `${uuid()}.png`
    const editedDir = join(__dirname, '..', '..', 'edited')
    writeFileSync(join(editedDir, filename), finalBuffer)

    return {
      success: true,
      editedImageUrl: `/api/images/edited/${filename}`,
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during image editing'
    return {
      success: false,
      editedImageUrl: null,
      error: message,
    }
  }
}
