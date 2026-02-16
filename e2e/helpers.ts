import { expect, type Page } from '@playwright/test'

const API_URL = 'http://localhost:3001'

/** Generate a unique email for test isolation. */
export function uniqueEmail(prefix = 'e2e') {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`
}

/** Generate a unique org name for test isolation. */
export function uniqueOrgName(prefix = 'Org') {
	return `${prefix} ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
}

/** Register a user via the API directly (faster than going through the UI). */
export async function apiRegister(data: { name: string; email: string; password: string }) {
	const res = await fetch(`${API_URL}/api/auth/sign-up/email`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!res.ok) {
		throw new Error(`API register failed: ${res.status} ${await res.text()}`)
	}
	return res.json()
}

/** Register a user through the UI. */
export async function uiRegister(page: Page, data: { name: string; email: string; password: string }) {
	await page.goto('/register')
	await page.getByLabel('Name').fill(data.name)
	await page.getByLabel('Email').fill(data.email)
	await page.getByLabel('Password').fill(data.password)
	await page.getByRole('button', { name: 'Create account' }).click()
}

/** Log in through the UI. */
export async function uiLogin(page: Page, data: { email: string; password: string }) {
	await page.goto('/login')
	await page.getByLabel('Email').fill(data.email)
	await page.getByLabel('Password').fill(data.password)
	await page.getByRole('button', { name: 'Sign in' }).click()
}

/** Create an organization via the API directly. Returns the org object. */
export async function apiCreateOrg(
	page: Page,
	data: { name: string; slug: string },
) {
	// Use the page's cookies to authenticate the API call
	const cookies = await page.context().cookies()
	const sessionCookie = cookies.find(
		(c) => c.name === 'better-auth.session_token' || c.name === '__Secure-better-auth.session_token',
	)
	if (!sessionCookie) {
		throw new Error('No session cookie found — user must be logged in first')
	}

	const res = await fetch(`${API_URL}/api/auth/organization/create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
		},
		body: JSON.stringify(data),
	})
	if (!res.ok) {
		throw new Error(`API create org failed: ${res.status} ${await res.text()}`)
	}
	return res.json()
}

/** Set the active organization via the API. */
export async function apiSetActiveOrg(page: Page, organizationId: string) {
	const cookies = await page.context().cookies()
	const sessionCookie = cookies.find(
		(c) => c.name === 'better-auth.session_token' || c.name === '__Secure-better-auth.session_token',
	)
	if (!sessionCookie) {
		throw new Error('No session cookie found')
	}

	const res = await fetch(`${API_URL}/api/auth/organization/set-active`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
		},
		body: JSON.stringify({ organizationId }),
	})
	if (!res.ok) {
		throw new Error(`API set active org failed: ${res.status} ${await res.text()}`)
	}
	return res.json()
}

/** Create an organization via the dialog and wait for it to appear. */
export async function uiCreateOrg(page: Page, name: string) {
	await page.locator('header').getByRole('button', { name: /Organization|Select/i }).click()
	await page.getByRole('menuitem', { name: 'Create Organization' }).click()
	await page.getByLabel('Organization Name').fill(name)
	await page.getByRole('button', { name: 'Create Organization' }).click()

	// Wait for dialog to disappear
	await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 })

	// Ensure it appears in header (might need a moment for session refresh)
	await expect(page.locator('header').getByText(name)).toBeVisible({ timeout: 10_000 })

	// Close any open dropdown overlays that might block navigation
	await page.keyboard.press('Escape')
	await page.waitForTimeout(200)
}

/** Select the first available organization via the org switcher dropdown. */
export async function uiSelectOrg(page: Page, orgName: string) {
	// Wait for the dashboard to load
	await expect(page.locator('header')).toBeVisible({ timeout: 10_000 })
	// Click the org switcher button
	await page.locator('header').getByRole('button', { name: /Organization|Select/i }).click()
	// Click the org by name
	await page.getByRole('menuitem', { name: orgName }).click()
	// Wait for org name to appear in header (indicates active org was set)
	await expect(page.locator('header').getByText(orgName)).toBeVisible({ timeout: 10_000 })
}

/** Navigate to contacts list via sidebar. */
export async function navigateToContacts(page: Page) {
	await page.getByRole('link', { name: 'Contacts' }).click()
	await expect(page).toHaveURL(/\/contacts/, { timeout: 10_000 })
}

/** Navigate to companies list via sidebar. */
export async function navigateToCompanies(page: Page) {
	await page.getByRole('link', { name: 'Companies' }).click()
	await expect(page).toHaveURL(/\/companies/, { timeout: 10_000 })
}

/** Navigate to deals list via sidebar. */
export async function navigateToDeals(page: Page) {
	await page.getByRole('link', { name: 'Deals' }).click()
	await expect(page).toHaveURL(/\/deals/, { timeout: 10_000 })
}

/** Navigate to pipeline settings. */
export async function navigateToPipelineSettings(page: Page) {
	await page.getByRole('link', { name: 'Settings' }).click()
	await expect(page).toHaveURL(/\/settings/, { timeout: 10_000 })
	await page.getByRole('link').filter({ hasText: 'Pipelines' }).first().click()
	await expect(page).toHaveURL(/\/settings\/pipelines/, { timeout: 10_000 })
}
