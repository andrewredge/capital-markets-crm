import { test, expect } from '@playwright/test'
import { uniqueEmail, uiRegister, uiLogin } from './helpers'

/**
 * RLS Isolation Tests
 *
 * Verifies that tenant data is properly isolated:
 * - User A in Org A cannot see Org B's data
 * - Organization lists only show orgs the user belongs to
 */

/** Generate a unique org name for test isolation. */
function uniqueOrgName(prefix: string) {
	return `${prefix} ${Date.now().toString(36)}`
}

/** Open the org switcher dropdown in the header. */
async function openOrgSwitcher(page: import('@playwright/test').Page) {
	await page.locator('header').getByRole('button', { name: /Organization|Select/i }).click()
}

/** Open the "Create Organization" dialog. */
async function openCreateOrgDialog(page: import('@playwright/test').Page) {
	await openOrgSwitcher(page)
	await page.getByRole('menuitem', { name: 'Create Organization' }).click()
}

test.describe('RLS Isolation', () => {
	const passwordA = 'Password123!'
	const passwordB = 'Password456!'
	let emailA: string
	let emailB: string
	let orgNameA: string
	let orgNameB: string

	test.beforeAll(async ({ browser }) => {
		orgNameA = uniqueOrgName('Alpha')
		orgNameB = uniqueOrgName('Beta')

		// Create User A with Org A
		emailA = uniqueEmail('rls-a')
		const pageA = await browser.newPage()
		await uiRegister(pageA, { name: 'User A', email: emailA, password: passwordA })
		await expect(pageA).toHaveURL('/', { timeout: 10_000 })

		await openCreateOrgDialog(pageA)
		await pageA.getByLabel('Organization Name').fill(orgNameA)
		await pageA.getByRole('button', { name: 'Create Organization' }).click()
		await pageA.waitForTimeout(500)
		await pageA.reload()
		await expect(pageA.locator('header').getByText(orgNameA)).toBeVisible({ timeout: 10_000 })
		await pageA.close()

		// Create User B with Org B
		emailB = uniqueEmail('rls-b')
		const pageB = await browser.newPage()
		await uiRegister(pageB, { name: 'User B', email: emailB, password: passwordB })
		await expect(pageB).toHaveURL('/', { timeout: 10_000 })

		await openCreateOrgDialog(pageB)
		await pageB.getByLabel('Organization Name').fill(orgNameB)
		await pageB.getByRole('button', { name: 'Create Organization' }).click()
		await pageB.waitForTimeout(500)
		await pageB.reload()
		await expect(pageB.locator('header').getByText(orgNameB)).toBeVisible({ timeout: 10_000 })
		await pageB.close()
	})

	test('User A can see their org but not User B org', async ({ page }) => {
		await uiLogin(page, { email: emailA, password: passwordA })
		await expect(page).toHaveURL('/', { timeout: 10_000 })

		// Open org switcher
		await openOrgSwitcher(page)

		// Should see Org A
		await expect(page.getByText(orgNameA)).toBeVisible()

		// Should NOT see Org B
		await expect(page.getByText(orgNameB)).not.toBeVisible()
	})

	test('User B can see their org but not User A org', async ({ page }) => {
		await uiLogin(page, { email: emailB, password: passwordB })
		await expect(page).toHaveURL('/', { timeout: 10_000 })

		// Open org switcher
		await openOrgSwitcher(page)

		// Should see Org B
		await expect(page.getByText(orgNameB)).toBeVisible()

		// Should NOT see Org A
		await expect(page.getByText(orgNameA)).not.toBeVisible()
	})

	test('API rejects cross-tenant access via tRPC', async ({ page }) => {
		// Log in as User A
		await uiLogin(page, { email: emailA, password: passwordA })
		await expect(page).toHaveURL('/', { timeout: 10_000 })

		// Get session cookie
		const cookies = await page.context().cookies()
		const sessionCookie = cookies.find(
			(c) => c.name === 'better-auth.session_token' || c.name === '__Secure-better-auth.session_token',
		)
		expect(sessionCookie).toBeTruthy()

		// Call the organizations.list tRPC endpoint directly
		const res = await fetch('http://localhost:3001/api/trpc/organizations.list', {
			headers: {
				Cookie: `${sessionCookie!.name}=${sessionCookie!.value}`,
			},
		})
		expect(res.ok).toBe(true)

		const body = await res.json()
		const orgNames = (body.result?.data?.json ?? []).map((o: any) => o.name)

		// User A should only see their org
		expect(orgNames).toContain(orgNameA)
		expect(orgNames).not.toContain(orgNameB)
	})
})
