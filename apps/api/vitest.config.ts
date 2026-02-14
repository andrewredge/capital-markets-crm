import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
	},
	resolve: {
		alias: {
			'@crm/db/schema': '../../packages/db/src/schema/index.ts',
			'@crm/db': '../../packages/db/src/index.ts',
			'@crm/shared': '../../packages/shared/src/index.ts',
		},
	},
})
