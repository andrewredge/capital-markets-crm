import { test, expect } from '@playwright/test'
import { uniqueEmail, uiRegister } from './helpers'

/** Generate a unique org name for test isolation. */
function uniqueOrgName(prefix: string) {
	return `${prefix} ${Date.now().toString(36)}`
}

/** Open the org switcher dropdown in the header. */
async function openOrgSwitcher(page: import('@playwright/test').Page) {
	await page.locator('header').getByRole('button', { name: /Organization|Select/i }).click()
}

/** Open the "Create Organization" dialog via the org switcher dropdown. */
async function openCreateOrgDialog(page: import('@playwright/test').Page) {
	await openOrgSwitcher(page)
	await page.getByRole('menuitem', { name: 'Create Organization' }).click()
}

/** Create an org via the dialog and wait for it to appear in the header. */
async function createOrg(page: import('@playwright/test').Page, name: string) {
	await openCreateOrgDialog(page)
	await page.getByLabel('Organization Name').fill(name)
	await page.getByRole('button', { name: 'Create Organization' }).click()
	// Wait for dialog to close and org name to appear
	await page.waitForTimeout(500)
	await page.reload()
	await expect(page.locator('header').getByText(name)).toBeVisible({ timeout: 10_000 })
}

test.describe('Organization Creation', () => {
	test('creates an organization via the dialog', async ({ page }) => {
		const email = uniqueEmail('org-create')
		const orgName = uniqueOrgName('TestOrg')
		await uiRegister(page, { name: 'Org Creator', email, password: 'Password123!' })
		await expect(page).toHaveURL('/', { timeout: 10_000 })

		await openCreateOrgDialog(page)

		// Fill the form
		await page.getByLabel('Organization Name').fill(orgName)
		// Slug should auto-generate (lowercase, hyphened)
		const expectedSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
		await expect(page.getByLabel('Slug')).toHaveValue(expectedSlug)

		// Submit via the dialog's button
		await page.getByRole('button', { name: 'Create Organization' }).click()

		// Wait for creation, then reload to get fresh session data
		await page.waitForTimeout(500)
		await page.reload()

		// Org should appear in the header switcher
		await expect(page.locator('header').getByText(orgName)).toBeVisible({ timeout: 10_000 })
	})

	test('auto-generates slug from name', async ({ page }) => {
		const email = uniqueEmail('org-slug')
		await uiRegister(page, { name: 'Slug Tester', email, password: 'Password123!' })
		await expect(page).toHaveURL('/', { timeout: 10_000 })

		await openCreateOrgDialog(page)

		await page.getByLabel('Organization Name').fill('My Cool Company LLC')
		await expect(page.getByLabel('Slug')).toHaveValue('my-cool-company-llc')
	})
})

test.describe('Organization Switching', () => {
	test('switches between organizations', async ({ page }) => {
		const email = uniqueEmail('org-switch')
		const orgOneName = uniqueOrgName('OrgOne')
		const orgTwoName = uniqueOrgName('OrgTwo')
		await uiRegister(page, { name: 'Org Switcher', email, password: 'Password123!' })
		await expect(page).toHaveURL('/', { timeout: 10_000 })

		// Create first org
		await createOrg(page, orgOneName)

		// Create second org
		await createOrg(page, orgTwoName)

		// Switch back to Org One
		await openOrgSwitcher(page)
		await page.getByRole('menuitem', { name: orgOneName }).click()

		// Reload to see the change
		await page.waitForTimeout(500)
		await page.reload()

		// Verify Org One is now active in the switcher
		await expect(page.locator('header').getByText(orgOneName)).toBeVisible({ timeout: 10_000 })
	})
})
