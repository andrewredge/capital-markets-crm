import type { auth } from '../lib/auth.js'

type Auth = typeof auth

/**
 * List all organizations the authenticated user belongs to.
 * Uses Better Auth's server API (bypasses RLS — organizations are not tenant-scoped).
 */
export async function listByUser(authInstance: Auth, headers: Headers) {
	return authInstance.api.listOrganizations({ headers })
}

/**
 * Get full organization details by ID.
 * Requires the user to be a member of the organization.
 */
export async function getById(authInstance: Auth, headers: Headers, organizationId: string) {
	return authInstance.api.getFullOrganization({
		headers,
		query: { organizationId },
	})
}

/**
 * Set the user's active organization in their session.
 */
export async function setActive(authInstance: Auth, headers: Headers, organizationId: string) {
	return authInstance.api.setActiveOrganization({
		headers,
		body: { organizationId },
	})
}
