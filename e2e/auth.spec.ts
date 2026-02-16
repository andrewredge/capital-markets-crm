import { test, expect } from '@playwright/test'
import { uniqueEmail, uiRegister, uiLogin } from './helpers'

test.describe('Registration', () => {
	test('registers a new user and redirects to dashboard', async ({ page }) => {
		const email = uniqueEmail('register')

		await uiRegister(page, { name: 'Test User', email, password: 'Password123!' })

		// Should redirect to dashboard
		await expect(page).toHaveURL('/', { timeout: 10_000 })
		await expect(page.getByText('Welcome back')).toBeVisible()
	})

	test('shows error for duplicate email', async ({ page }) => {
		const email = uniqueEmail('dup')

		// Register first time
		await uiRegister(page, { name: 'First User', email, password: 'Password123!' })
		await expect(page).toHaveURL('/', { timeout: 10_000 })

		// Clear cookies and register again with same email
		await page.context().clearCookies()
		await uiRegister(page, { name: 'Second User', email, password: 'Password123!' })

		// Should show an error (stay on register page)
		await expect(page.locator('.bg-destructive\\/15')).toBeVisible({ timeout: 5_000 })
	})

	test('validates required fields', async ({ page }) => {
		await page.goto('/register')

		// Submit without filling anything
		await page.getByRole('button', { name: 'Create account' }).click()

		// Should show validation messages and stay on register page
		await expect(page).toHaveURL(/\/register/)
	})
})

test.describe('Login', () => {
	let testEmail: string
	const testPassword = 'Password123!'

	test.beforeAll(async ({ browser }) => {
		// Create a user for login tests
		testEmail = uniqueEmail('login')
		const page = await browser.newPage()
		await uiRegister(page, { name: 'Login User', email: testEmail, password: testPassword })
		await expect(page).toHaveURL('/', { timeout: 10_000 })
		await page.close()
	})

	test('logs in with valid credentials', async ({ page }) => {
		await uiLogin(page, { email: testEmail, password: testPassword })

		await expect(page).toHaveURL('/', { timeout: 10_000 })
		await expect(page.getByText('Welcome back')).toBeVisible()
	})

	test('shows error for wrong password', async ({ page }) => {
		await uiLogin(page, { email: testEmail, password: 'WrongPassword!' })

		await expect(page.locator('.bg-destructive\\/15')).toBeVisible({ timeout: 5_000 })
		await expect(page).toHaveURL(/\/login/)
	})

	test('shows error for non-existent email', async ({ page }) => {
		await uiLogin(page, { email: 'nonexistent@test.local', password: testPassword })

		await expect(page.locator('.bg-destructive\\/15')).toBeVisible({ timeout: 5_000 })
		await expect(page).toHaveURL(/\/login/)
	})
})

test.describe('Logout', () => {
	test('logs out and redirects to login', async ({ page }) => {
		const email = uniqueEmail('logout')
		await uiRegister(page, { name: 'Logout User', email, password: 'Password123!' })
		await expect(page).toHaveURL('/', { timeout: 10_000 })

		// Open user menu (avatar button in header) and click log out
		await page.locator('header').getByRole('button').last().click()
		await page.getByText('Log out').click()

		// Should redirect to login
		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
	})
})

test.describe('Route Protection', () => {
	test('redirects unauthenticated user to login', async ({ page }) => {
		await page.goto('/')
		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
	})

	test('redirects authenticated user from login to dashboard', async ({ page }) => {
		const email = uniqueEmail('protect')
		await uiRegister(page, { name: 'Protected User', email, password: 'Password123!' })
		await expect(page).toHaveURL('/', { timeout: 10_000 })

		// Try navigating to login — should redirect back to dashboard
		await page.goto('/login')
		await expect(page).toHaveURL('/', { timeout: 10_000 })
	})

	test('redirects authenticated user from register to dashboard', async ({ page }) => {
		const email = uniqueEmail('protect2')
		await uiRegister(page, { name: 'Protected User 2', email, password: 'Password123!' })
		await expect(page).toHaveURL('/', { timeout: 10_000 })

		await page.goto('/register')
		await expect(page).toHaveURL('/', { timeout: 10_000 })
	})
})
