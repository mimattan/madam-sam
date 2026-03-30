import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fontsDir = path.join(__dirname, '..', 'fonts')

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true })
}

// List of fonts to download (using Google Fonts API)
const fonts = [
  { name: 'Playfair Display', weights: [400, 700], variants: ['regular', 'italic'] },
  { name: 'Inter', weights: [400, 700], variants: ['regular'] },
  { name: 'Roboto', weights: [400, 700], variants: ['regular'] },
  { name: 'Montserrat', weights: [400, 700], variants: ['regular'] },
  { name: 'Open Sans', weights: [400, 700], variants: ['regular'] },
]

// Google Fonts API endpoint
const API_KEY = 'AIzaSyDummyKeyForDownload' // Not needed for direct downloads

async function downloadFont(fontName, weight, variant) {
  const fileName = `${fontName.replace(/\s+/g, '')}-${weight}${variant === 'italic' ? '-italic' : ''}.ttf`
  const filePath = path.join(fontsDir, fileName)
  
  // Skip if already exists
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${fileName} already exists`)
    return
  }

  // Construct Google Fonts CSS URL
  const fontNameEncoded = fontName.replace(/\s+/g, '+')
  const cssUrl = `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:wght@${weight}&display=swap`
  
  console.log(`Downloading ${fileName}...`)
  
  try {
    // First, get the CSS to find the font URL
    const cssResponse = await fetch(cssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    const css = await cssResponse.text()
    
    // Extract the font URL from the CSS
    const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/)
    if (!urlMatch) {
      console.error(`✗ Could not find font URL for ${fileName}`)
      return
    }
    
    const fontUrl = urlMatch[1]
    
    // Download the font file
    const fontResponse = await fetch(fontUrl)
    const buffer = await fontResponse.arrayBuffer()
    
    fs.writeFileSync(filePath, Buffer.from(buffer))
    console.log(`✓ Downloaded ${fileName}`)
  } catch (error) {
    console.error(`✗ Error downloading ${fileName}:`, error.message)
  }
}

async function main() {
  console.log('Downloading Google Fonts...\n')
  
  for (const font of fonts) {
    for (const weight of font.weights) {
      for (const variant of font.variants) {
        await downloadFont(font.name, weight, variant)
      }
    }
  }
  
  console.log('\nFont download complete!')
}

main()
