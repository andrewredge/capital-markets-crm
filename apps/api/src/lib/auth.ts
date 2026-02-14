import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db.js'
import * as schema from '@crm/db/schema'

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
	basePath: '/api/auth',
	secret: process.env.BETTER_AUTH_SECRET!,
	trustedOrigins: [process.env.WEB_URL || 'http://localhost:3000'],

	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
			organization: schema.organizations,
			member: schema.members,
			invitation: schema.invitations,
		},
	}),

	emailAndPassword: {
		enabled: true,
	},

	plugins: [
		organization({
			allowUserToCreateOrganization: true,
			creatorRole: 'owner',
		}),
	],
})

export type Auth = typeof auth
