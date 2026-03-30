# Text Overlay Feature

## Overview
Users can now add customizable text overlays to their birth cards. The text is displayed in real-time on the frontend canvas and merged into the final image when downloaded.

## Features

### Frontend
- **Add Multiple Text Overlays**: Users can add unlimited text overlays to a card
- **Drag-and-Drop Positioning**: Click and drag text directly on the image to reposition it
- **Customize Text**:
  - Text content (multi-line support)
  - **33 Royalty-Free Google Fonts** organized by category:
    - **Serif**: Playfair Display, Merriweather, Lora, Crimson Text, EB Garamond, Libre Baskerville, Cormorant Garamond
    - **Sans-Serif**: Inter, Montserrat, Open Sans, Roboto, Poppins, Raleway, Nunito, Work Sans, Josefin Sans
    - **Script/Display**: Pacifico, Dancing Script, Great Vibes, Satisfy, Lobster, Bebas Neue, Righteous, Fredoka One, Caveat, Amatic SC
    - **Monospace**: Courier New, Roboto Mono, Source Code Pro
  - Font size (12px - 120px with slider)
  - Font weight (Light, Regular, Medium, Semi Bold, Bold)
  - Font style (Normal, Italic)
  - Color (color picker + hex input)
- **Real-time Preview**: Text overlays are rendered on a canvas overlay in real-time
- **Text Shadow**: Automatic shadow for better readability
- **Manage Overlays**: Select, edit, and delete individual text overlays
- **Visual Feedback**: Selected text is highlighted when clicked

### Backend
- **Image Composition**: Uses Node.js `canvas` library to merge text into images
- **Download Endpoint**: `/api/download` accepts image URL and text overlays, returns composed PNG
- **Font Rendering**: Supports all standard web fonts with proper styling

## Implementation Details

### New Files Created
1. **Frontend**:
   - `client/src/components/TextOverlay.vue` - UI for managing text overlays
   - Updated `client/src/components/CardEditor.vue` - Canvas rendering for text preview
   - Updated `client/src/stores/cardStore.ts` - State management for text overlays
   - Updated `client/src/views/EditorView.vue` - Integration of text overlay component
   - Updated `client/src/services/api.ts` - Download API function

2. **Backend**:
   - `server/src/services/imageComposer.ts` - Text merging service using canvas
   - `server/src/routes/download.ts` - Download endpoint with text overlay support
   - Updated `server/src/index.ts` - Registered download route

### Dependencies Added
- `canvas` (server) - For server-side image composition

## Usage

1. **Navigate to card editor** at `/editor/:cardId`
2. **Add text** by clicking the "+ Tekst" button in the sidebar
3. **Position text** by clicking and dragging it directly on the image
4. **Customize text** using the controls:
   - Enter text in the textarea
   - Select from 33 royalty-free fonts
   - Adjust font size with slider (12-120px)
   - Choose font weight and style
   - Pick color with color picker or hex input
5. **Add multiple texts** - repeat steps 2-4 for each text element
6. **Preview** all text overlays in real-time on the edited image
7. **Download** the final card with all text permanently merged into the image

## Technical Notes

### Text Positioning
- Text position is stored as percentages (0-100) for both X and Y
- This ensures text scales properly with different image sizes
- Text is center-aligned at the specified coordinates

### Canvas Rendering
- Frontend uses HTML5 canvas for real-time preview
- Backend uses Node.js canvas for final image composition
- Both use identical rendering logic for consistency

### Text Shadow
- Automatic shadow (rgba(0,0,0,0.3), 4px blur, 2px offset) for readability
- Applied to both preview and final image

### Drag-and-Drop
- Click detection uses canvas coordinate transformation to handle scaling
- Text hit detection based on measured text width and font size
- Drag offset calculated to maintain cursor position relative to text center
- Position clamped to 0-100% to keep text within image bounds
- Mouse events: mousedown (start drag), mousemove (update position), mouseup/mouseleave (end drag)

### Google Fonts
- All 33 fonts are loaded via Google Fonts CDN
- Fonts are royalty-free and open source (SIL Open Font License)
- Preconnect links optimize font loading performance
- Fonts organized by category for easy selection

## API Endpoint

### POST /api/download
**Request Body**:
```json
{
  "imageUrl": "http://localhost:3000/api/images/cards/baziel.jpg",
  "textOverlays": [
    {
      "text": "Emma",
      "x": 50,
      "y": 30,
      "fontSize": 48,
      "fontFamily": "Playfair Display",
      "fontWeight": "700",
      "fontStyle": "normal",
      "color": "#4a5e4a"
    }
  ]
}
```

**Response**: PNG image file with text merged

## Future Enhancements
- ✅ ~~Drag-and-drop text positioning~~ (Completed)
- ✅ ~~Multiple font options~~ (33 fonts added)
- Text rotation
- Text stroke/outline
- Multiple text shadow options
- Custom font uploads
- Text alignment options (left, center, right)
- Text background/box
- Undo/redo for text changes
- Copy/duplicate text overlays
- Text layer ordering (bring to front/send to back)
- Keyboard shortcuts for text manipulation
- Text presets/templates
