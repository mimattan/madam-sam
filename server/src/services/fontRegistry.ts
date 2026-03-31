import { registerFont } from 'canvas'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fontsDir = path.join(__dirname, '..', '..', 'fonts')

// Font registration configuration
const fontConfigs = [
  // Roboto (already registered)
  {
    file: 'Roboto-VariableFont_wdth,wght.ttf',
    family: 'Roboto',
    weight: '400',
    style: 'normal'
  },
  {
    file: 'Roboto-Italic-VariableFont_wdth,wght.ttf',
    family: 'Roboto',
    weight: '400', 
    style: 'italic'
  },
  
  // Pacifico (script font)
  {
    file: 'Pacifico-Regular.ttf',
    family: 'Pacifico',
    weight: '400',
    style: 'normal'
  },
  
  // Lobster Two (bold script font with variants)
  {
    file: 'LobsterTwo-Regular.ttf',
    family: 'Lobster',
    weight: '400',
    style: 'normal'
  },
  {
    file: 'LobsterTwo-Bold.ttf',
    family: 'Lobster',
    weight: '700',
    style: 'normal'
  },
  {
    file: 'LobsterTwo-Italic.ttf',
    family: 'Lobster',
    weight: '400',
    style: 'italic'
  },
  {
    file: 'LobsterTwo-BoldItalic.ttf',
    family: 'Lobster',
    weight: '700',
    style: 'italic'
  },
  
  // Luckiest Guy (display font)
  {
    file: 'LuckiestGuy-Regular.ttf',
    family: 'Luckiest Guy',
    weight: '400',
    style: 'normal'
  },
  
  // Edu AU VIC WA NT Guides (educational font)
  {
    file: 'EduAUVICWANTGuides-VariableFont_wght.ttf',
    family: 'Edu AU VIC WA NT Guides',
    weight: '400',
    style: 'normal'
  },
  
  // Add more fonts here as you download them:
  // Serif fonts
  // {
  //   file: 'PlayfairDisplay-Regular.ttf',
  //   family: 'Playfair Display',
  //   weight: '400',
  //   style: 'normal'
  // },
  // {
  //   file: 'PlayfairDisplay-Bold.ttf',
  //   family: 'Playfair Display',
  //   weight: '700',
  //   style: 'normal'
  // },
  
  // Sans-serif fonts
  // {
  //   file: 'Inter-Regular.ttf',
  //   family: 'Inter',
  //   weight: '400',
  //   style: 'normal'
  // },
  // {
  //   file: 'Inter-Bold.ttf',
  //   family: 'Inter',
  //   weight: '700',
  //   style: 'normal'
  // },
]

// Register all fonts
export function registerGoogleFonts() {
  logger.info('[FontRegistry] Registering Google Fonts...')
  
  const registeredFonts: string[] = []
  
  fontConfigs.forEach(config => {
    const fontPath = path.join(fontsDir, config.file)
    
    if (existsSync(fontPath)) {
      try {
        registerFont(fontPath, {
          family: config.family,
          weight: config.weight,
          style: config.style
        })
        
        const weightStyle = config.weight !== '400' ? ` ${config.weight}` : ''
        const styleStr = config.style !== 'normal' ? ` ${config.style}` : ''
        logger.debug(`[FontRegistry] Registered ${config.family}${weightStyle}${styleStr}`)
        
        if (!registeredFonts.includes(config.family)) {
          registeredFonts.push(config.family)
        }
      } catch (error) {
        logger.error({ file: config.file, err: error }, '[FontRegistry] Error registering font')
      }
    } else {
      logger.debug(`[FontRegistry] ${config.file} not found (skipped)`)
    }
  })
  
  logger.info({ count: registeredFonts.length, fonts: registeredFonts }, '[FontRegistry] Font families registered')
  return registeredFonts
}

// Get list of registered font families
export function getRegisteredFontFamilies(): string[] {
  return fontConfigs
    .filter(config => existsSync(path.join(fontsDir, config.file)))
    .map(config => config.family)
    .filter((family, index, arr) => arr.indexOf(family) === index) // Remove duplicates
}
