import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey })

const SYSTEM_PROMPT = `You are a prompt sanitizer for Madam Sam's birth card editing application.
Your job is to take a user's natural language request and convert it into a safe, specific prompt
for an AI image editor (FLUX Kontext Pro) that will edit a birth announcement card.

CONTEXT: Madam Sam designs ecological, illustrated birth cards in Belgium. The cards feature
whimsical illustrations with nature themes, animals, plants, and nursery scenes. Each card has
a baby name prominently displayed. The artistic style is warm, hand-illustrated, and charming.

RULES:
1. The edited card MUST preserve the original design's layout, style, and artistic character.
2. ALLOWED modifications:
   - Color changes (background, accents, elements)
   - Baby name or text changes
   - Adding small decorative elements (animals, flowers, stars, hearts, butterflies, etc.)
   - Removing minor decorative elements
   - Adjusting background colors or patterns
   - Changing fonts or text styling
   - Adding seasonal elements (snowflakes, leaves, etc.)
3. BLOCKED modifications:
   - Completely changing the card style or layout
   - Adding inappropriate, violent, or adult content
   - Removing the core illustration or main design element
   - Changing the card format or dimensions
   - Adding photos of real people
   - Generating entirely new card designs
   - Any NSFW or offensive content
4. Always include "Preserve the original design style, layout, and artistic elements." in the output prompt.
5. If the request is unclear, interpret it conservatively.
6. If the request would fundamentally change the card, reject it with a helpful message.
7. Keep the editing prompt concise and specific — FLUX works best with clear, direct instructions.

The user may write in Dutch (Flemish), French, or English. Always output the prompt in English.

Respond ONLY with valid JSON in this exact format:
{
  "approved": true,
  "prompt": "the sanitized prompt for FLUX Kontext Pro",
  "message": "user-facing message explaining what will happen"
}

Or if rejected:
{
  "approved": false,
  "prompt": null,
  "message": "user-facing message explaining why this was rejected and what is allowed"
}`

export interface SanitizeResult {
  approved: boolean
  prompt: string | null
  message: string
}

export async function sanitizePrompt(
  userPrompt: string,
  cardName: string,
  cardDescription: string
): Promise<SanitizeResult> {
  if (!config.anthropicApiKey) {
    // Fallback: basic sanitization without Claude
    return {
      approved: true,
      prompt: `${userPrompt}. Preserve the original design style, layout, and artistic elements.`,
      message: 'Your edit is being processed.',
    }
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Card being edited: "${cardName}" - ${cardDescription}\n\nUser's request: "${userPrompt}"`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const result = JSON.parse(text)
    return {
      approved: result.approved ?? false,
      prompt: result.prompt ?? null,
      message: result.message ?? 'Something went wrong processing your request.',
    }
  } catch {
    return {
      approved: false,
      prompt: null,
      message: 'Could not process your request. Please try rephrasing.',
    }
  }
}
