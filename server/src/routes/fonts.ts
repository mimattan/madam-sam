import { Router } from 'express'
import { getRegisteredFontFamilies } from '../services/fontRegistry'

const router = Router()

// Get list of available fonts
router.get('/', (req, res) => {
  try {
    const registeredFonts = getRegisteredFontFamilies()
    
    // Create font list with labels matching frontend format
    const fontList = registeredFonts.map(fontFamily => {
      // Map font families to user-friendly labels
      const labelMap: Record<string, string> = {
        'Roboto': 'Roboto (Clean Sans)',
        'Pacifico': 'Pacifico (Script)',
        'Lobster': 'Lobster (Bold Script)',
        'Luckiest Guy': 'Luckiest Guy (Display)',
        'Edu AU VIC WA NT Guides': 'Edu AU VIC WA NT Guides (Educational)',
        'Playfair Display': 'Playfair Display (Elegant Serif)',
        'Inter': 'Inter (Modern Sans)',
        'Montserrat': 'Montserrat (Urban Sans)',
        'Open Sans': 'Open Sans (Friendly)',
        'Poppins': 'Poppins (Geometric Sans)',
        'Raleway': 'Raleway (Elegant Sans)',
        'Nunito': 'Nunito (Rounded Sans)',
        'Work Sans': 'Work Sans (Professional)',
        'Josefin Sans': 'Josefin Sans (Vintage Sans)',
        'Merriweather': 'Merriweather (Classic Serif)',
        'Lora': 'Lora (Beautiful Serif)',
        'Crimson Text': 'Crimson Text (Book Serif)',
        'EB Garamond': 'EB Garamond (Traditional)',
        'Libre Baskerville': 'Libre Baskerville (Refined)',
        'Cormorant Garamond': 'Cormorant Garamond (Graceful)',
        'Dancing Script': 'Dancing Script (Handwriting)',
        'Great Vibes': 'Great Vibes (Elegant Script)',
        'Satisfy': 'Satisfy (Casual Script)',
        'Bebas Neue': 'Bebas Neue (Bold Display)',
        'Righteous': 'Righteous (Retro Display)',
        'Fredoka One': 'Fredoka One (Playful)',
        'Caveat': 'Caveat (Handwritten)',
        'Amatic SC': 'Amatic SC (Hand-drawn)',
        'Courier New': 'Courier New (Typewriter)',
        'Roboto Mono': 'Roboto Mono (Modern Mono)',
        'Source Code Pro': 'Source Code Pro (Code)',
      }
      
      return {
        value: fontFamily,
        label: labelMap[fontFamily] || fontFamily
      }
    })
    
    // Also include system fonts as fallbacks for completeness
    const systemFonts = [
      { value: 'Georgia', label: 'Georgia (System Serif)' },
      { value: 'Helvetica', label: 'Helvetica (System Sans)' },
      { value: 'Arial', label: 'Arial (System Sans)' },
      { value: 'Verdana', label: 'Verdana (System Display)' },
      { value: 'Impact', label: 'Impact (System Display)' },
    ]
    
    // Combine registered fonts with system fonts
    const allFonts = [...fontList, ...systemFonts]
    
    res.json({ fonts: allFonts })
  } catch (error) {
    console.error('[Fonts API] Error getting font list:', error)
    res.status(500).json({ error: 'Failed to get font list' })
  }
})

export default router
