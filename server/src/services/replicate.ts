import Replicate from 'replicate'
import { createCanvas, loadImage } from 'canvas'
import { config } from '../config.js'
import { writeFileSync, readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { logger } from '../utils/logger.js'
import { isStorageFull } from './fileCleanup.js'

const __dirname = join(fileURLToPath(import.meta.url), '..')

const MAX_IMAGE_DIMENSION = 4096
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20MB

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
  if (!config.replicateApiToken) {
    logger.warn('[Replicate] Running in DEMO mode - no API token configured')
    return {
      success: true,
      editedImageUrl: imagePathOrUrl,
      error: null,
    }
  }

  logger.info({ prompt }, '[Replicate] Starting image edit')

  try {
    // Validate file size for local files
    if (!imagePathOrUrl.startsWith('http')) {
      const fileSize = statSync(imagePathOrUrl).size
      if (fileSize > MAX_FILE_SIZE_BYTES) {
        throw new Error(`Image file too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB exceeds ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB limit`)
      }
    }

    // Check storage capacity
    const editedOutputDir = join(__dirname, '..', '..', 'edited')
    if (isStorageFull(editedOutputDir)) {
      throw new Error('Storage capacity reached. Please try again later.')
    }

    // Load original image to get dimensions
    const originalImage = await loadImage(imagePathOrUrl)
    const targetWidth = originalImage.width
    const targetHeight = originalImage.height

    if (targetWidth > MAX_IMAGE_DIMENSION || targetHeight > MAX_IMAGE_DIMENSION) {
      throw new Error(`Image dimensions ${targetWidth}x${targetHeight} exceed maximum ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}`)
    }

    logger.debug({ width: targetWidth, height: targetHeight }, '[Replicate] Original dimensions')

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
      logger.debug('[Replicate] Uploading local file to Replicate')
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
    logger.debug({ url: resultUrl }, '[Replicate] Downloading edited image')
    const response = await fetch(resultUrl)
    if (!response.ok) {
      throw new Error(`Failed to download edited image: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Load edited image and check dimensions
    const editedImage = await loadImage(buffer)
    logger.debug({ width: editedImage.width, height: editedImage.height }, '[Replicate] Edited image dimensions')

    let finalBuffer: Buffer

    // Resize if dimensions don't match
    if (editedImage.width !== targetWidth || editedImage.height !== targetHeight) {
      logger.debug('[Replicate] Resizing edited image to match original dimensions')
      const canvas = createCanvas(targetWidth, targetHeight)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(editedImage, 0, 0, targetWidth, targetHeight)
      finalBuffer = canvas.toBuffer('image/png')
    } else {
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
