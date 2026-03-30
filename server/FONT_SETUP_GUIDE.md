# Adding Google Fonts to Madam Sam

## Quick Setup Guide

You've already got Roboto working! Here's how to add more fonts:

### 1. Download Fonts
1. Go to https://fonts.google.com
2. Search for the font (e.g., "Playfair Display")
3. Click "Download family"
4. Extract the ZIP file

### 2. Add Font Files
Copy the TTF files to `server/fonts/` with this naming convention:
- `PlayfairDisplay-Regular.ttf`
- `PlayfairDisplay-Bold.ttf`
- `PlayfairDisplay-Italic.ttf` (if available)
- `PlayfairDisplay-BoldItalic.ttf` (if available)

### 3. Register the Font
Edit `server/src/services/fontRegistry.ts` and add your font config:

```typescript
// Add to the fontConfigs array:
{
  file: 'PlayfairDisplay-Regular.ttf',
  family: 'Playfair Display',
  weight: '400',
  style: 'normal'
},
{
  file: 'PlayfairDisplay-Bold.ttf',
  family: 'Playfair Display',
  weight: '700',
  style: 'normal'
},
{
  file: 'PlayfairDisplay-Italic.ttf',
  family: 'Playfair Display',
  weight: '400',
  style: 'italic'
},
```

### 4. Restart Server
```bash
pkill -9 node
npm run dev:server
```

### 5. Test It
The font will now be used in downloaded images!

## Font Priority List

Add these fonts in order of importance:

### High Priority (Most Used)
1. ✅ **Roboto** (already done)
2. **Playfair Display** - Elegant serif for headings
3. **Inter** - Modern sans-serif
4. **Montserrat** - Popular sans-serif
5. **Open Sans** - Friendly sans-serif

### Medium Priority
6. **Poppins** - Geometric sans-serif
7. **Lora** - Beautiful serif
8. **Pacifico** - Script font
9. **Dancing Script** - Handwriting font
10. **Raleway** - Elegant sans-serif

### Low Priority (Specialty)
11. **Merriweather** - Reading serif
12. **Crimson Text** - Book serif
13. **Lobster** - Bold script
14. **Bebas Neue** - Display font
15. **Courier New** - Monospace (system font)
16. **Roboto Mono** - Modern monospace
17. **Source Code Pro** - Code font

## File Naming Examples

| Google Font | TTF File Names |
|-------------|----------------|
| Playfair Display | PlayfairDisplay-Regular.ttf, PlayfairDisplay-Bold.ttf |
| Inter | Inter-Regular.ttf, Inter-Bold.ttf |
| Montserrat | Montserrat-Regular.ttf, Montserrat-Bold.ttf |
| Pacifico | Pacifico-Regular.ttf |
| Dancing Script | DancingScript-Regular.ttf, DancingScript-Bold.ttf |

## Tips

- **Variable fonts** (like Roboto) work great - they support multiple weights in one file
- **Regular (400) and Bold (700)** are the most important weights
- **Italic** variants are nice to have if available
- **Check file names** in the extracted ZIP - they might be slightly different
- **Test each font** after adding by downloading an image

## Current Status

✅ **Roboto** - Registered and working  
⏳ **Next font** - Add Playfair Display for elegant serif text

The system automatically falls back to system fonts for any fonts you haven't downloaded yet, so you can add them gradually!
