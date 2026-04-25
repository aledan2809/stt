import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string    // Custom error message
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (reset on app restart)
// For production, consider using Redis or a database
const rateLimitStore = new Map<string, RateLimitEntry>()

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests, please try again later.',
      ...config
    }
  }

  /**
   * Check if request should be rate limited
   */
  checkLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()

    // Clean up old entries
    this.cleanup()

    const entry = rateLimitStore.get(identifier)

    if (!entry || entry.resetTime <= now) {
      // First request or window expired, create new entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs
      }
      rateLimitStore.set(identifier, newEntry)

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime
      }
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    // Increment count
    entry.count++
    rateLimitStore.set(identifier, entry)

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  /**
   * Middleware function to apply rate limiting
   */
  middleware() {
    return (request: NextRequest): NextResponse | null => {
      const identifier = this.getIdentifier(request)
      const result = this.checkLimit(identifier)

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: this.config.message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        )
      }

      // Add rate limit headers to successful requests
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString())

      return null // Continue to next middleware/handler
    }
  }

  /**
   * Get identifier for rate limiting (IP address or user ID)
   */
  private getIdentifier(request: NextRequest): string {
    // Try to get real IP from headers (for reverse proxy setups)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0].trim() || realIp || request.ip || 'unknown'

    // For single-user app, we can use a fixed identifier
    // or combine IP with user agent for better uniqueness
    const userAgent = request.headers.get('user-agent') || 'unknown'
    return `${ip}:${userAgent.slice(0, 50)}`
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of Array.from(rateLimitStore.entries())) {
      if (entry.resetTime <= now) {
        rateLimitStore.delete(key)
      }
    }
  }

  /**
   * Reset rate limit for specific identifier
   */
  reset(identifier?: string): void {
    if (identifier) {
      rateLimitStore.delete(identifier)
    } else {
      rateLimitStore.clear()
    }
  }

  /**
   * Get current stats
   */
  getStats(): { totalEntries: number; entries: Array<{ identifier: string; count: number; resetTime: number }> } {
    return {
      totalEntries: rateLimitStore.size,
      entries: Array.from(rateLimitStore.entries()).map(([identifier, entry]) => ({
        identifier,
        count: entry.count,
        resetTime: entry.resetTime
      }))
    }
  }
}

// Predefined rate limiters for different endpoints
export const rateLimiters = {
  // Transcription API - more restrictive due to processing cost
  transcription: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,       // 5 transcriptions per minute
    message: 'Prea multe cereri de transcripție. Încearc din nou în 1 minut.'
  }),

  // General API - less restrictive
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,     // 100 requests per minute
    message: 'Prea multe cereri API. Încearc din nou în câteva secunde.'
  }),

  // Authentication - very restrictive
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 attempts per 15 minutes
    message: 'Prea multe încercări de autentificare. Încearc din nou în 15 minute.'
  })
}

/**
 * Helper function to apply rate limiting to API routes
 */
export function withRateLimit(
  rateLimiter: RateLimiter,
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Apply rate limiting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const limiter = rateLimiter as any
    const identifier = limiter.getIdentifier(request)
    const result = rateLimiter.checkLimit(identifier)

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: limiter.config.message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limiter.config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Continue to handler
    const response = await handler(request)

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', limiter.config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString())

    return response
  }
}