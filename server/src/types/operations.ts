/**
 * Operation types that can be performed on birth cards
 * Based on FLUX Kontext Pro capabilities
 */
export enum OperationType {
  // Color operations
  COLOR_CHANGE = 'color_change',           // Change specific element colors
  PALETTE_SHIFT = 'palette_shift',         // Change overall color palette/mood
  
  // Atmosphere operations
  ATMOSPHERE = 'atmosphere',               // Change lighting, mood, time of day
  WEATHER = 'weather',                     // Add weather effects (fog, rain, snow, sunshine)
  
  // Style operations
  STYLE_TRANSFER = 'style_transfer',       // Change artistic style (watercolor, oil painting, etc.)
  TEXTURE = 'texture',                     // Modify texture and material appearance
  
  // Element operations (future)
  SEASONAL = 'seasonal',                   // Change season (spring, summer, autumn, winter)
  DETAIL_ENHANCE = 'detail_enhance',       // Enhance or soften details
}

/**
 * Operation suggestion for a specific card
 */
export interface OperationSuggestion {
  type: OperationType
  label: string                            // Dutch label for UI
  prompt: string                           // Example prompt in Dutch
  description?: string                     // Optional description
}

/**
 * Card metadata structure
 */
export interface CardMetadata {
  id: string
  name: string                             // Card name
  description: string                      // Description (Dutch)
  image: string                            // Image filename
  tags: string[]                           // Tags (Dutch)
  colors: string[]                         // Colors (Dutch)
  allowedOperations: OperationType[]       // Allowed operation types
  suggestions: OperationSuggestion[]       // Personalized suggestions
}
