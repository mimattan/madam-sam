import Replicate from 'replicate'
import dotenv from 'dotenv'
import { writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

const config = {
  replicateApiToken: process.env.REPLICATE_API_TOKEN || '',
}

const replicate = new Replicate({ auth: config.replicateApiToken })

async function removeTextFromImage(imagePath, outputPath) {
  console.log(`[Text Removal] Processing: ${imagePath}`)
  
  try {
    // Read the image file
    const imageBuffer = readFileSync(imagePath)
    
    // Use FLUX Kontext Pro to remove the text
    // The prompt instructs the model to remove text while preserving the rest
    const prompt = "Remove all text from this image. Keep the landscape and illustration exactly as it is, just remove any visible text or words."
    
    console.log('[Text Removal] Sending to FLUX Kontext Pro model')
    const output = await replicate.run('black-forest-labs/flux-kontext-pro', {
      input: {
        prompt,
        input_image: imageBuffer,
        aspect_ratio: 'match_input_image',
        safety_tolerance: 2,
      },
    })
    
    // Output is a FileOutput (URL-like object)
    const resultUrl = typeof output === 'string' ? output : String(output)
    
    console.log('[Text Removal] Downloading result from:', resultUrl)
    const response = await fetch(resultUrl)
    if (!response.ok) {
      throw new Error(`Failed to download edited image: ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    writeFileSync(outputPath, buffer)
    
    console.log(`[Text Removal] Successfully saved to: ${outputPath}`)
    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Text Removal] Error: ${message}`)
    return false
  }
}

// Main execution
const imagePath = '/Users/michael.mattan/Development/workspaces/personal/madam-sam/server/cards/tille.jpg'
const outputPath = imagePath // Overwrite the original

removeTextFromImage(imagePath, outputPath).then(success => {
  if (success) {
    console.log('[Text Removal] Complete!')
    process.exit(0)
  } else {
    console.log('[Text Removal] Failed!')
    process.exit(1)
  }
})
