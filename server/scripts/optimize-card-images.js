import sharp from 'sharp'
import { readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cardsDir = join(__dirname, '..', 'cards')

// Round to nearest multiple of 64
function roundToMultiple64(value) {
  return Math.round(value / 64) * 64
}

async function optimizeImages() {
  console.log('[Image Optimizer] Starting optimization of card images...')
  
  try {
    const files = await readdir(cardsDir)
    const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    
    console.log(`[Image Optimizer] Found ${imageFiles.length} images to process`)
    
    for (const filename of imageFiles) {
      const imagePath = join(cardsDir, filename)
      
      try {
        // Get current dimensions
        const metadata = await sharp(imagePath).metadata()
        const originalWidth = metadata.width
        const originalHeight = metadata.height
        
        // Calculate optimal dimensions (multiples of 64)
        const optimalWidth = roundToMultiple64(originalWidth)
        const optimalHeight = roundToMultiple64(originalHeight)
        
        // Check if resize is needed
        if (originalWidth === optimalWidth && originalHeight === optimalHeight) {
          console.log(`[Image Optimizer] ✓ ${filename}: Already optimal (${originalWidth}x${originalHeight})`)
          continue
        }
        
        console.log(`[Image Optimizer] Resizing ${filename}:`)
        console.log(`  Original: ${originalWidth}x${originalHeight}`)
        console.log(`  Optimal:  ${optimalWidth}x${optimalHeight}`)
        
        // Resize image to optimal dimensions
        await sharp(imagePath)
          .resize(optimalWidth, optimalHeight, {
            fit: 'fill',
            kernel: 'lanczos3'
          })
          .jpeg({ quality: 95 })
          .toFile(imagePath + '.tmp')
        
        // Replace original with optimized version
        await sharp(imagePath + '.tmp')
          .toFile(imagePath)
        
        // Clean up temp file
        const { unlink } = await import('fs/promises')
        await unlink(imagePath + '.tmp')
        
        console.log(`[Image Optimizer] ✓ ${filename}: Optimized successfully`)
        
      } catch (err) {
        console.error(`[Image Optimizer] ✗ ${filename}: Error - ${err.message}`)
      }
    }
    
    console.log('[Image Optimizer] Optimization complete!')
    
  } catch (err) {
    console.error('[Image Optimizer] Fatal error:', err.message)
    process.exit(1)
  }
}

optimizeImages()
