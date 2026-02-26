import { serve } from '@hono/node-server'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env.js'
import { auth } from './lib/auth.js'
import { rateLimiter } from './lib/rate-limit.js'
import { appRouter } from './trpc/router.js'
import { createContext } from './trpc/trpc.js'

const app = new Hono()

// Middleware
app.use(logger())
app.use(
	'/api/*',
	cors({
		origin: env.WEB_URL,
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['POST', 'GET', 'OPTIONS'],
		credentials: true,
	}),
)

// Rate limiting — 200 requests per minute per IP for general API
app.use('/api/*', rateLimiter({ limit: 200, windowMs: 60_000 }))

// Stricter rate limit for auth endpoints — 20 per minute
app.use('/api/auth/*', rateLimiter({ limit: 20, windowMs: 60_000 }))

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Better Auth handler
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
	return auth.handler(c.req.raw)
})

// tRPC handler
app.use(
	'/api/trpc/*',
	trpcServer({
		endpoint: '/api/trpc',
		router: appRouter,
		createContext,
	}),
)

const port = env.PORT
console.log(`API server starting on port ${port}`)

serve({
	fetch: app.fetch,
	port,
})
