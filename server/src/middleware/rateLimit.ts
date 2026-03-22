import rateLimit from 'express-rate-limit'
import { config } from '../config.js'

export const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.maxEditsPerHour,
  message: {
    error: 'Too many edit requests. Please try again later.',
    retryAfterMinutes: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
})
