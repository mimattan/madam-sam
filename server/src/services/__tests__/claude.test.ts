import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the config before importing claude
vi.mock('../../config.js', () => ({
  config: {
    anthropicApiKey: '',
    replicateApiToken: '',
    nodeEnv: 'test',
  },
}))

// Mock the logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Anthropic SDK as a class
const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate }
    },
  }
})

describe('Claude prompt sanitization', () => {
  describe('preFilterPrompt (regex pre-filter)', () => {
    it('blocks prompts requesting to draw people', async () => {
      const { sanitizePrompt } = await import('../claude.js')
      const result = await sanitizePrompt('draw a woman on the beach', 'Test Card', 'A test card')
      expect(result.approved).toBe(false)
    })

    it('blocks prompts requesting to add elements', async () => {
      const { sanitizePrompt } = await import('../claude.js')
      const result = await sanitizePrompt('add a butterfly to the card', 'Test Card', 'A test card')
      expect(result.approved).toBe(false)
    })

    it('blocks prompts requesting removal', async () => {
      const { sanitizePrompt } = await import('../claude.js')
      const result = await sanitizePrompt('remove the trees from the image', 'Test Card', 'A test card')
      expect(result.approved).toBe(false)
    })

    it('blocks prompts requesting realistic imagery', async () => {
      const { sanitizePrompt } = await import('../claude.js')
      const result = await sanitizePrompt('make it photorealistic', 'Test Card', 'A test card')
      expect(result.approved).toBe(false)
    })

    it('blocks scene replacement requests', async () => {
      const { sanitizePrompt } = await import('../claude.js')
      const result = await sanitizePrompt('replace with a beach scene', 'Test Card', 'A test card')
      expect(result.approved).toBe(false)
    })

    it('rejects all prompts when no API key (fail-secure)', async () => {
      const { sanitizePrompt } = await import('../claude.js')
      // Color change prompt passes pre-filter, but rejected because no API key
      const result = await sanitizePrompt('change the background to pink', 'Test Card', 'A test card')
      expect(result.approved).toBe(false)
      expect(result.message).toContain('safety filter is not configured')
    })
  })

  describe('sanitizeLayerPrompt', () => {
    it('rejects when no API key is set (fail-secure)', async () => {
      const { sanitizeLayerPrompt } = await import('../claude.js')
      const result = await sanitizeLayerPrompt(
        'a cute butterfly',
        'Test Card',
        'A test card',
        '{"artisticStyle": "watercolor"}'
      )
      expect(result.approved).toBe(false)
      expect(result.message).toContain('safety filter is not configured')
    })
  })
})
