import { test, expect } from '@playwright/test'
import { uniqueEmail, uniqueOrgName, uiRegister, uiLogin, uiCreateOrg, navigateToContacts } from './helpers'

test.describe('Contacts CRUD', () => {
	let testEmail: string
	const testPassword = 'Password123!'
	let orgName: string

	test.beforeAll(async ({ browser }) => {
		testEmail = uniqueEmail('contacts')
		orgName = uniqueOrgName('ContactsOrg')
		const page = await browser.newPage()
		await uiRegister(page, { name: 'Contacts User', email: testEmail, password: testPassword })
		await uiCreateOrg(page, orgName)
		await page.close()
	})

	test.beforeEach(async ({ page }) => {
		await uiLogin(page, { email: testEmail, password: testPassword })
		await navigateToContacts(page)
	})

	test('displays empty contacts list', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible()
		await expect(page.getByText('No contacts found.')).toBeVisible()
	})

	test('creates a contact via dialog', async ({ page }) => {
		await page.getByRole('button', { name: 'New Contact' }).click()
		
		await page.getByLabel('First Name').fill('Alice')
		await page.getByLabel('Last Name').fill('Smith')
		await page.getByLabel('Email').fill('alice@test.com')
		
		await page.getByRole('button', { name: 'Save Contact' }).click()
		
		await expect(page.getByText('Contact created successfully')).toBeVisible()
		await expect(page.getByRole('row').filter({ hasText: 'Alice' })).toBeVisible()
		await expect(page.getByRole('row').filter({ hasText: 'Smith' })).toBeVisible()
	})

	test('navigates to contact detail', async ({ page }) => {
		// Alice Smith should exist from previous test
		await page.getByRole('row').filter({ hasText: 'Alice' }).click()
		
		await expect(page).toHaveURL(/\/contacts\/[a-zA-Z0-9_-]+/)
		await expect(page.getByRole('heading', { name: 'Alice Smith' })).toBeVisible()
	})

	test('edits a contact', async ({ page }) => {
		await page.getByRole('row').filter({ hasText: 'Alice' }).click()
		
		await page.getByRole('button', { name: 'Edit' }).click()
		await page.getByLabel('First Name').fill('Alicia')
		await page.getByRole('button', { name: 'Save Contact' }).click()
		
		await expect(page.getByText('Contact updated successfully')).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Alicia Smith' })).toBeVisible()
	})

	test('searches contacts', async ({ page }) => {
		// Create another contact
		await page.getByRole('button', { name: 'New Contact' }).click()
		await page.getByLabel('First Name').fill('Bob')
		await page.getByLabel('Last Name').fill('Jones')
		await page.getByLabel('Email').fill('bob@test.com')
		await page.getByRole('button', { name: 'Save Contact' }).click()
		await expect(page.getByText('Contact created successfully')).toBeVisible()

		// Create third contact
		await page.getByRole('button', { name: 'New Contact' }).click()
		await page.getByLabel('First Name').fill('Charlie')
		await page.getByLabel('Last Name').fill('Brown')
		await page.getByLabel('Email').fill('charlie@test.com')
		await page.getByRole('button', { name: 'Save Contact' }).click()
		await expect(page.getByText('Contact created successfully')).toBeVisible()

		const searchInput = page.getByPlaceholder('Search contacts...')
		await searchInput.fill('Bob')
		await page.waitForTimeout(500) // Debounce

		await expect(page.getByRole('row').filter({ hasText: 'Bob' })).toBeVisible()
		await expect(page.getByRole('row').filter({ hasText: 'Charlie' })).not.toBeVisible()
	})

	test('deletes a contact', async ({ page }) => {
		await page.getByRole('row').filter({ hasText: 'Alicia' }).click()
		
		await page.getByRole('button', { name: 'Delete' }).click()
		
		// Confirm in Alert Dialog
		const alertDialog = page.getByRole('alertdialog')
		await alertDialog.getByRole('button', { name: 'Delete' }).click()
		
		await expect(page.getByText('Contact deleted')).toBeVisible()
		await expect(page).toHaveURL(/\/contacts/)
		await expect(page.getByRole('row').filter({ hasText: 'Alicia' })).not.toBeVisible()
	})
})
