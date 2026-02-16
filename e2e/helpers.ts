import type { Page } from '@playwright/test'

const API_URL = 'http://localhost:3001'

/** Generate a unique email for test isolation. */
export function uniqueEmail(prefix = 'e2e') {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`
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
