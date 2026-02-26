import type { Context, Next } from 'hono'

interface RateLimitEntry {
	count: number
	resetAt: number
}

/**
 * Simple in-memory rate limiter middleware for Hono.
 * Uses a sliding window per IP address.
 */
export function rateLimiter(options: {
	/** Maximum requests allowed in the window */
	limit: number
	/** Window duration in milliseconds */
	windowMs: number
}) {
	const { limit, windowMs } = options
	const store = new Map<string, RateLimitEntry>()

	// Periodically clean expired entries to prevent memory leaks
	setInterval(() => {
		const now = Date.now()
		for (const [key, entry] of store) {
			if (now > entry.resetAt) {
				store.delete(key)
			}
		}
	}, windowMs * 2).unref()

	return async (c: Context, next: Next) => {
		const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
			?? c.req.header('x-real-ip')
			?? 'unknown'

		const now = Date.now()
		const entry = store.get(ip)

		if (!entry || now > entry.resetAt) {
			store.set(ip, { count: 1, resetAt: now + windowMs })
			c.header('X-RateLimit-Limit', String(limit))
			c.header('X-RateLimit-Remaining', String(limit - 1))
			return next()
		}

		entry.count++

		if (entry.count > limit) {
			const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
			c.header('Retry-After', String(retryAfter))
			c.header('X-RateLimit-Limit', String(limit))
			c.header('X-RateLimit-Remaining', '0')
			return c.json({ error: 'Too many requests' }, 429)
		}

		c.header('X-RateLimit-Limit', String(limit))
		c.header('X-RateLimit-Remaining', String(limit - entry.count))
		return next()
	}
}
