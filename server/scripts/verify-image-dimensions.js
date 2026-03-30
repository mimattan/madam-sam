import sharp from 'sharp'
import { readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cardsDir = join(__dirname, '..', 'cards')

async function verifyImages() {
  console.log('[Image Verifier] Checking all card images...\n')
  
  try {
    const files = await readdir(cardsDir)
    const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    
    let allOptimal = true
    
    for (const filename of imageFiles) {
      const imagePath = join(cardsDir, filename)
      
      try {
        const metadata = await sharp(imagePath).metadata()
        const width = metadata.width
        const height = metadata.height
        
        const widthOptimal = width % 64 === 0
        const heightOptimal = height % 64 === 0
        const isOptimal = widthOptimal && heightOptimal
        
        const status = isOptimal ? '✓' : '✗'
        const widthCheck = widthOptimal ? '✓' : '✗'
        const heightCheck = heightOptimal ? '✓' : '✗'
        
        console.log(`${status} ${filename.padEnd(20)} ${width}x${height} (W:${widthCheck} H:${heightCheck})`)
        
        if (!isOptimal) {
          allOptimal = false
        }
        
      } catch (err) {
        console.error(`✗ ${filename}: Error - ${err.message}`)
        allOptimal = false
      }
    }
    
    console.log('\n' + '='.repeat(60))
    if (allOptimal) {
      console.log('✓ All images are optimized for diffusion models!')
      console.log('  (All dimensions are multiples of 64)')
    } else {
      console.log('✗ Some images need optimization')
    }
    console.log('='.repeat(60))
    
  } catch (err) {
    console.error('[Image Verifier] Fatal error:', err.message)
    process.exit(1)
  }
}

verifyImages()
