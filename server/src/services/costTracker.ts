import { logger } from '../utils/logger.js'

const COST_PER_CALL: Record<string, number> = {
  replicate: 4,    // ~$0.04 in cents
  anthropic: 0.1,  // ~$0.001 in cents
}

const MAX_DAILY_SPEND_CENTS = parseInt(process.env.MAX_DAILY_SPEND_CENTS || '2000', 10) // $20 default
const MAX_DAILY_API_CALLS = parseInt(process.env.MAX_DAILY_API_CALLS || '500', 10)

class CostTracker {
  private totalCents = 0
  private callCount = 0
  private resetAt: number

  constructor() {
    this.resetAt = this.nextMidnight()
  }

  private nextMidnight(): number {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setHours(24, 0, 0, 0)
    return tomorrow.getTime()
  }

  private checkReset() {
    if (Date.now() > this.resetAt) {
      logger.info({ totalCents: this.totalCents, callCount: this.callCount }, '[CostTracker] Daily reset')
      this.totalCents = 0
      this.callCount = 0
      this.resetAt = this.nextMidnight()
    }
  }

  canProceed(): boolean {
    this.checkReset()
    if (this.callCount >= MAX_DAILY_API_CALLS) {
      logger.warn({ callCount: this.callCount, max: MAX_DAILY_API_CALLS }, '[CostTracker] Daily call limit reached')
      return false
    }
    if (this.totalCents >= MAX_DAILY_SPEND_CENTS) {
      logger.warn({ totalCents: this.totalCents, max: MAX_DAILY_SPEND_CENTS }, '[CostTracker] Daily spend limit reached')
      return false
    }
    return true
  }

  recordCall(provider: 'replicate' | 'anthropic') {
    this.checkReset()
    this.callCount++
    this.totalCents += COST_PER_CALL[provider] || 0

    // Warn at 80% threshold
    if (this.totalCents >= MAX_DAILY_SPEND_CENTS * 0.8 && this.totalCents - (COST_PER_CALL[provider] || 0) < MAX_DAILY_SPEND_CENTS * 0.8) {
      logger.warn({ totalCents: this.totalCents, max: MAX_DAILY_SPEND_CENTS }, '[CostTracker] 80% of daily spend limit reached')
    }
  }

  getStats() {
    this.checkReset()
    return {
      totalCents: this.totalCents,
      callCount: this.callCount,
      maxDailySpendCents: MAX_DAILY_SPEND_CENTS,
      maxDailyApiCalls: MAX_DAILY_API_CALLS,
    }
  }
}

export const costTracker = new CostTracker()
