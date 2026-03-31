import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const anthropic = new Anthropic({ apiKey: config.anthropicApiKey })

export interface StyleAnalysis {
  colorPalette: string[]
  artisticStyle: string
  illustrationTechnique: string
  themes: string[]
  mood: string
  stylePromptFragment: string
}

const STYLE_ANALYSIS_PROMPT = `Analyze this birth card illustration and extract its visual style characteristics.
Return ONLY valid JSON with these fields:

{
  "colorPalette": ["#hex1", "#hex2", ...],  // 5-8 dominant hex colors
  "artisticStyle": "description",            // e.g., "watercolor illustration", "digital hand-drawn"
  "illustrationTechnique": "description",    // e.g., "soft brushstrokes with visible texture"
  "themes": ["theme1", "theme2"],            // e.g., ["nature", "nursery", "animals"]
  "mood": "description",                     // e.g., "warm, cozy, whimsical"
  "stylePromptFragment": "a complete phrase" // e.g., "in a warm watercolor illustration style with soft brushstrokes, muted earthy tones, and whimsical hand-drawn character"
}

The stylePromptFragment should be a complete, self-contained description that can be appended to any image generation prompt to reproduce this exact artistic style. Be specific about colors, technique, and mood.`

function getCachePath(cardId: string): string {
  return path.join(__dirname, '..', '..', 'cards', `${cardId}.style.json`)
}

export function getCachedStyleAnalysis(cardId: string): StyleAnalysis | null {
  const cachePath = getCachePath(cardId)
  if (existsSync(cachePath)) {
    try {
      const raw = readFileSync(cachePath, 'utf-8')
      return JSON.parse(raw) as StyleAnalysis
    } catch {
      return null
    }
  }
  return null
}

function cacheStyleAnalysis(cardId: string, analysis: StyleAnalysis): void {
  const cachePath = getCachePath(cardId)
  writeFileSync(cachePath, JSON.stringify(analysis, null, 2), 'utf-8')
  logger.debug({ cardId }, '[StyleAnalyzer] Cached style analysis')
}

export async function analyzeCardStyle(
  cardId: string,
  imagePathOrUrl: string
): Promise<StyleAnalysis> {
  // Check cache first
  const cached = getCachedStyleAnalysis(cardId)
  if (cached) {
    logger.debug({ cardId }, '[StyleAnalyzer] Using cached style analysis')
    return cached
  }

  logger.info({ cardId }, '[StyleAnalyzer] Analyzing card style')

  if (!config.anthropicApiKey) {
    // Fallback when no API key
    const fallback: StyleAnalysis = {
      colorPalette: ['#8B9E6B', '#D4A574', '#F5F0E8', '#6B7B5E', '#C9B896'],
      artisticStyle: 'hand-illustrated watercolor',
      illustrationTechnique: 'soft brushstrokes with warm tones',
      themes: ['nature', 'nursery'],
      mood: 'warm, cozy, whimsical',
      stylePromptFragment: 'in a warm hand-illustrated watercolor style with soft brushstrokes, earthy muted tones, and whimsical charm',
    }
    cacheStyleAnalysis(cardId, fallback)
    return fallback
  }

  // Load the image as base64
  let imageData: string
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

  if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
    const response = await fetch(imagePathOrUrl)
    const buffer = Buffer.from(await response.arrayBuffer())
    imageData = buffer.toString('base64')
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    mediaType = contentType as typeof mediaType
  } else {
    if (!existsSync(imagePathOrUrl)) {
      throw new Error(`Image file not found: ${imagePathOrUrl}`)
    }
    const buffer = readFileSync(imagePathOrUrl)
    imageData = buffer.toString('base64')
    const ext = path.extname(imagePathOrUrl).toLowerCase()
    mediaType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: 'text',
              text: STYLE_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    try {
      const analysis = JSON.parse(text) as StyleAnalysis
      cacheStyleAnalysis(cardId, analysis)
      logger.info({ cardId }, '[StyleAnalyzer] Successfully analyzed card')
      return analysis
    } catch {
      logger.error({ response: text }, '[StyleAnalyzer] Failed to parse analysis JSON')
      throw new Error('Failed to parse style analysis response')
    }
  } catch (err) {
    logger.error({ err }, '[StyleAnalyzer] API call failed')
    // Return a generic fallback
    const fallback: StyleAnalysis = {
      colorPalette: ['#8B9E6B', '#D4A574', '#F5F0E8', '#6B7B5E', '#C9B896'],
      artisticStyle: 'hand-illustrated watercolor',
      illustrationTechnique: 'soft brushstrokes with warm tones',
      themes: ['nature', 'nursery'],
      mood: 'warm, cozy, whimsical',
      stylePromptFragment: 'in a warm hand-illustrated watercolor style with soft brushstrokes, earthy muted tones, and whimsical charm',
    }
    cacheStyleAnalysis(cardId, fallback)
    return fallback
  }
}
