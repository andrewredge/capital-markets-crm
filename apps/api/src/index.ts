import { serve } from '@hono/node-server'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { appRouter } from './trpc/router.js'
import { createContext } from './trpc/trpc.js'

const app = new Hono()

// Middleware
app.use(logger())
app.use(
	'/api/*',
	cors({
		origin: process.env.WEB_URL || 'http://localhost:3000',
		credentials: true,
	}),
)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// tRPC handler
app.use(
	'/api/trpc/*',
	trpcServer({
		endpoint: '/api/trpc',
		router: appRouter,
		createContext,
	}),
)

const port = Number(process.env.PORT) || 3001
console.log(`API server starting on port ${port}`)

serve({
	fetch: app.fetch,
	port,
})
