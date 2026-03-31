import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey })

const SYSTEM_PROMPT = `You are a STRICT prompt safety filter for Madam Sam's birth card editing application.
Your job is to ensure that user requests are LIMITED to the ALLOWED OPERATION TYPES for each card.
You must REJECT anything else. When in doubt, REJECT.

CONTEXT: Madam Sam designs ecological, illustrated birth cards in Belgium. These are precious,
hand-illustrated artworks. The cards feature whimsical illustrations with nature themes.

=== OPERATION TYPES ===
Each card has specific allowed operations. You will receive the list of allowed operations for the card being edited.

1. color_change: Change colors of EXISTING elements
   - Examples: "change the background to pink", "make the bear brown", "change the boat to red"
   
2. palette_shift: Change the overall color palette/mood
   - Examples: "warmer tones", "pastel colors", "autumn palette", "cool blue tones"
   
3. atmosphere: Change lighting, mood, or time of day
   - Examples: "make it sunset", "darker mood", "morning light", "evening atmosphere"
   
4. weather: Add weather effects (fog, mist, clouds, sunshine)
   - Examples: "add morning mist", "add soft clouds", "make it foggy"

=== ALLOWED (approve ONLY if operation type is allowed for this card) ===
- Operations that match the card's toegestaneOperaties (allowed operations)
- Requests must be specific and clear about what to change

=== REJECTED — BLOCK ALL OF THESE ===
You MUST reject with approved:false ANY request that:
- Asks to ADD, DRAW, CREATE, GENERATE, or PLACE any new element
- Asks to add people, animals, objects, scenes, or any visual element
- Asks to REMOVE, DELETE, or ERASE any element
- Would REPLACE the illustration with something else
- Describes a NEW SCENE (e.g. "a woman on the beach", "a castle in the sky")
- Requests REALISTIC or PHOTOGRAPHIC imagery
- Contains ANY inappropriate, violent, sexual, or adult content
- Would fundamentally ALTER the composition, style, or layout
- Asks to change the card into something completely different
- Is vague or ambiguous in a way that could cause major changes

=== REJECTION EXAMPLES (you MUST reject all of these) ===
- "draw a woman" → REJECT
- "add a butterfly" → REJECT
- "make it a beach scene" → REJECT
- "a realistic blonde woman on the beach" → REJECT
- "replace the background with a photo" → REJECT
- "add a dog next to the bear" → REJECT
- "remove the trees" → REJECT
- "make it look like a photograph" → REJECT
- "draw something new" → REJECT
- "change it to a car" → REJECT

=== APPROVAL EXAMPLES (these are fine) ===
- "make the background light pink" → APPROVE
- "change the bear color to brown" → APPROVE
- "make the flowers red" → APPROVE
- "warmer color palette" → APPROVE
- "make the sky sunset orange" → APPROVE
- "darker, moodier atmosphere" → APPROVE

=== OUTPUT RULES ===
1. When approved, output a concise editing instruction in English optimized for the FLUX Kontext image editing model.
   - Use the verb "change" (NOT "transform", "make", or "turn into") for precise control.
   - Name the target element specifically: "the background", "the bear", "the flowers" — never use pronouns like "it".
   - State ONLY the color or atmosphere change. Do NOT describe the full scene or add creative embellishments.
   - Good: "Change the background color to soft pink"
   - Good: "Change the overall color palette to warm autumn tones with oranges and deep reds"
   - Bad: "Transform the entire image into a warm autumn scene" (too vague, risks altering composition)
2. If the user mentions changing a color but is VAGUE about the exact color, set requiresColorInput:true.
3. The user may write in Dutch (Flemish), French, or English. Output the PROMPT in English but the MESSAGE in Dutch/Flemish.
4. When rejecting, explain in DUTCH that only color and atmosphere changes are allowed. Mention:
   - Use text layers for adding/changing text ("Gebruik tekstlagen om tekst toe te voegen of te wijzigen")
   - Use image layers for adding new elements ("Gebruik afbeeldingslagen om nieuwe elementen toe te voegen")

Respond ONLY with valid JSON:

Approved: {"approved":true,"prompt":"...","message":"..."}
Needs color: {"approved":false,"prompt":null,"message":"...","requiresColorInput":true,"colorContext":"...","suggestedColors":["#hex",...]}
Rejected: {"approved":false,"prompt":null,"message":"..."}`

const LAYER_SYSTEM_PROMPT = `You are a prompt sanitizer for generating small decorative image layers for Madam Sam's birth card application.
The user wants to generate a small image element that will be placed ON TOP of an existing birth card as a layer.

CONTEXT: Madam Sam designs ecological, illustrated birth cards in Belgium. The cards feature
whimsical illustrations with nature themes, animals, plants, and nursery scenes.

RULES:
1. ALLOWED layer generations:
   - Small decorative elements (animals, flowers, stars, hearts, butterflies, etc.)
   - Nature elements (leaves, branches, mushrooms, clouds, sun, moon)
   - Baby-related items (rattles, bottles, toys, pacifiers, booties)
   - Seasonal elements (snowflakes, autumn leaves, spring flowers)
   - Simple patterns or shapes
2. BLOCKED layer generations:
   - Photos of real people
   - Inappropriate, violent, or adult content
   - Any NSFW or offensive content
   - Complex full scenes (this is meant to be a small element)
   - Text or letters (use the text overlay feature instead)
3. The generated element MUST match the artistic style described in the style analysis.
4. Always add "on a pure white background, isolated element, no background" to the prompt.
5. Keep the prompt concise and descriptive.

The user may write in Dutch (Flemish), French, or English. Always output the prompt in English.

You will receive a style analysis of the original card. Use this to ensure the generated element matches.

Respond ONLY with valid JSON:
{
  "approved": true,
  "prompt": "the full generation prompt including style matching and white background instruction",
  "message": "user-facing message explaining what will be generated"
}

Or if rejected:
{
  "approved": false,
  "prompt": null,
  "message": "user-facing message explaining why this was rejected"
}`

export interface SanitizeResult {
  approved: boolean
  prompt: string | null
  message: string
  requiresColorInput?: boolean
  suggestedColors?: string[]
  colorContext?: string
  originalPrompt?: string
}

// Pre-filter blocklist — catches dangerous prompts before they reach Claude
const BLOCKED_PATTERNS = [
  // Adding/drawing/creating new elements
  /\b(draw|paint|sketch|illustrate|render|generate|create|design|compose)\b/i,
  /\b(add|place|put|insert|include|attach)\s+(a|an|the|some|new|more)/i,
  // Requesting people
  /\b(woman|man|girl|boy|person|people|baby|child|human|model|lady|guy|kid)\b/i,
  // Requesting scenes or locations
  /\b(beach|forest|city|castle|house|room|garden|ocean|mountain|space|underwater|landscape)\b/i,
  // Requesting realistic/photographic content
  /\b(realistic|photorealistic|photograph|photo|real|hyper.?real|life.?like|3d render)\b/i,
  // Removal requests
  /\b(remove|delete|erase|get rid of|eliminate|take out|take away)\b/i,
  // Replacement requests
  /\b(replace|swap|substitute|turn (it |this |the )?(into|to)|transform (it |this |the )?into|make (it |this )?(into|look like))\b/i,
]

// Patterns that EXEMPT a prompt from the blocklist (legitimate color/atmosphere changes)
const SAFE_PATTERNS = [
  /\b(color|colour|kleur|couleur|tint|shade|hue|tone|palette|pallete)\b/i,
  /\b(pink|blue|red|green|yellow|orange|purple|brown|black|white|grey|gray|gold|silver|pastel|warm|cool|autumn|spring|summer|winter)\b/i,
  /\b(atmosphere|atmosfeer|mood|stemming|sfeer|lighting|belichting|darker|donkerder|lighter|lichter|brighter|helderder)\b/i,
  /\b(background|achtergrond|fond)\s*(color|colour|kleur)?/i,
  /#[0-9a-fA-F]{3,8}\b/,
]

function preFilterPrompt(userPrompt: string): SanitizeResult | null {
  const hasSafeIntent = SAFE_PATTERNS.some(p => p.test(userPrompt))
  if (hasSafeIntent) return null // Let Claude handle it

  const blockedMatch = BLOCKED_PATTERNS.find(p => p.test(userPrompt))
  if (blockedMatch) {
    logger.info({ prompt: userPrompt, pattern: blockedMatch.toString() }, '[Claude Pre-filter] Blocked prompt')
    return {
      approved: false,
      prompt: null,
      message: 'Dit type bewerking is niet toegestaan. Je kunt alleen kleuren aanpassen of tekst wijzigen op de basisafbeelding. Gebruik de laagfunctie om nieuwe elementen toe te voegen.',
    }
  }

  return null // Let Claude handle it
}

export async function sanitizePrompt(
  userPrompt: string,
  cardName: string,
  cardDescription: string,
  selectedColor?: string,
  colorContext?: string,
  allowedOperations?: string[]
): Promise<SanitizeResult> {
  // Pre-filter: catch obviously dangerous prompts before calling Claude
  if (!selectedColor) {
    const preFilterResult = preFilterPrompt(userPrompt)
    if (preFilterResult) return preFilterResult
  }

  if (!config.anthropicApiKey) {
    // No API key: REJECT for safety — never approve unfiltered prompts
    return {
      approved: false,
      prompt: null,
      message: 'The safety filter is not configured. Please contact the administrator.',
    }
  }

  // Build the user message, including allowed operations and color selection if provided
  let userMessage = `Card being edited: "${cardName}" - ${cardDescription}\n\n`
  
  if (allowedOperations && allowedOperations.length > 0) {
    userMessage += `Allowed operations for this card: ${allowedOperations.join(', ')}\n\n`
  }
  
  userMessage += `User's request: "${userPrompt}"`
  
  if (selectedColor && colorContext) {
    userMessage += `\n\nThe user has confirmed they want to change the ${colorContext} to the specific color ${selectedColor}.`
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    let text = response.content[0].type === 'text' ? response.content[0].text : ''
    logger.debug({ response: text }, '[Claude] Raw response')

    // Strip markdown code fences if present
    text = text.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

    try {
      const result = JSON.parse(text)
      return {
        approved: result.approved ?? false,
        prompt: result.prompt ?? null,
        message: result.message ?? 'Something went wrong processing your request.',
        requiresColorInput: result.requiresColorInput ?? false,
        suggestedColors: result.suggestedColors ?? undefined,
        colorContext: result.colorContext ?? undefined,
        originalPrompt: result.requiresColorInput ? userPrompt : undefined,
      }
    } catch (parseErr) {
      logger.error({ response: text, err: parseErr }, '[Claude] JSON parse failed')
      return {
        approved: false,
        prompt: null,
        message: 'Could not process your request. Please try rephrasing.',
      }
    }
  } catch (err) {
    // If Anthropic API fails, REJECT the request — never approve unfiltered prompts
    logger.warn({ err }, '[Claude] API call failed, REJECTING for safety')
    return {
      approved: false,
      prompt: null,
      message: 'The safety filter is temporarily unavailable. Please try again in a moment.',
    }
  }
}

export async function sanitizeLayerPrompt(
  userPrompt: string,
  cardName: string,
  cardDescription: string,
  styleAnalysis: string
): Promise<SanitizeResult> {
  if (!config.anthropicApiKey) {
    return {
      approved: false,
      prompt: null,
      message: 'The safety filter is not configured. Please contact the administrator.',
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: LAYER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Card: "${cardName}" - ${cardDescription}\n\nStyle analysis of the card:\n${styleAnalysis}\n\nUser wants to generate this layer element: "${userPrompt}"`,
        },
      ],
    })

    let text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Strip markdown code fences if present
    text = text.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

    try {
      const result = JSON.parse(text)
      return {
        approved: result.approved ?? false,
        prompt: result.prompt ?? null,
        message: result.message ?? 'Something went wrong processing your request.',
      }
    } catch (parseErr) {
      logger.error({ response: text, err: parseErr }, '[Claude Layer] JSON parse failed')
      return {
        approved: false,
        prompt: null,
        message: 'Could not process your request. Please try rephrasing.',
      }
    }
  } catch (err) {
    logger.warn({ err }, '[Claude] Layer sanitization API call failed, REJECTING for safety')
    return {
      approved: false,
      prompt: null,
      message: 'The safety filter is temporarily unavailable. Please try again in a moment.',
    }
  }
}
