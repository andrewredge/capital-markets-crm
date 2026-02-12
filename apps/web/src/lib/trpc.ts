import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import superjson from 'superjson'
import type { AppRouter } from '@crm/api/src/trpc/router'

function getBaseUrl() {
	if (typeof window !== 'undefined') return ''
	return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
}

const links = [
	httpBatchLink({
		url: `${getBaseUrl()}/api/trpc`,
		transformer: superjson,
		headers() {
			return {
				// Phase 1: auth headers will be added here
			}
		},
	}),
]

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

// Vanilla client for use outside React components
export const trpcClient = createTRPCClient<AppRouter>({
	links,
})

// Legacy-style hooks client (for compatibility)
export const trpc = {
	Provider: TRPCProvider,
}
