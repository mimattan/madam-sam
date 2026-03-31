import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('CostTracker', () => {
  beforeEach(() => {
    vi.resetModules()
    // Reset env vars
    delete process.env.MAX_DAILY_SPEND_CENTS
    delete process.env.MAX_DAILY_API_CALLS
  })

  it('allows requests within limits', async () => {
    const { costTracker } = await import('../costTracker.js')
    expect(costTracker.canProceed()).toBe(true)
  })

  it('tracks API calls', async () => {
    const { costTracker } = await import('../costTracker.js')
    costTracker.recordCall('replicate')
    costTracker.recordCall('anthropic')
    const stats = costTracker.getStats()
    expect(stats.callCount).toBe(2)
    expect(stats.totalCents).toBeCloseTo(4.1, 1) // 4 + 0.1
  })

  it('blocks when call limit reached', async () => {
    process.env.MAX_DAILY_API_CALLS = '2'
    const { costTracker } = await import('../costTracker.js')
    costTracker.recordCall('replicate')
    costTracker.recordCall('replicate')
    expect(costTracker.canProceed()).toBe(false)
  })

  it('blocks when spend limit reached', async () => {
    process.env.MAX_DAILY_SPEND_CENTS = '5'
    const { costTracker } = await import('../costTracker.js')
    costTracker.recordCall('replicate') // 4 cents
    costTracker.recordCall('replicate') // 8 cents total > 5 limit
    expect(costTracker.canProceed()).toBe(false)
  })

  it('exposes stats', async () => {
    const { costTracker } = await import('../costTracker.js')
    const stats = costTracker.getStats()
    expect(stats).toHaveProperty('totalCents')
    expect(stats).toHaveProperty('callCount')
    expect(stats).toHaveProperty('maxDailySpendCents')
    expect(stats).toHaveProperty('maxDailyApiCalls')
  })
})
