import Replicate from 'replicate'
import { config } from '../config.js'
import { writeFileSync } from 'fs'
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
  imageUrl: string,
  prompt: string
): Promise<EditResult> {
  if (!config.replicateApiToken) {
    // Demo mode: return the original image with a note
    return {
      success: true,
      editedImageUrl: imageUrl,
      error: null,
    }
  }

  try {
    const output = await replicate.run('black-forest-labs/flux-kontext-pro', {
      input: {
        prompt,
        input_image: imageUrl,
        aspect_ratio: 'match_input',
        safety_tolerance: 2,
      },
    })

    // Output is a FileOutput (URL-like object)
    const resultUrl = typeof output === 'string' ? output : String(output)

    // Download and save the image locally
    const response = await fetch(resultUrl)
    if (!response.ok) {
      throw new Error(`Failed to download edited image: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const filename = `${uuid()}.png`
    const editedDir = join(__dirname, '..', '..', 'edited')
    writeFileSync(join(editedDir, filename), buffer)

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
