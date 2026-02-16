import { test, expect } from '@playwright/test'
import { uniqueEmail, uniqueOrgName, uiRegister, uiLogin, uiCreateOrg, navigateToCompanies } from './helpers'

test.describe('Companies CRUD', () => {
	let testEmail: string
	const testPassword = 'Password123!'
	let orgName: string

	test.beforeAll(async ({ browser }) => {
		testEmail = uniqueEmail('companies')
		orgName = uniqueOrgName('CompaniesOrg')
		const page = await browser.newPage()
		await uiRegister(page, { name: 'Companies User', email: testEmail, password: testPassword })
		await uiCreateOrg(page, orgName)
		await page.close()
	})

	test.beforeEach(async ({ page }) => {
		await uiLogin(page, { email: testEmail, password: testPassword })
		await navigateToCompanies(page)
	})

	test('displays empty companies list', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Companies', exact: true })).toBeVisible()
		await expect(page.getByText('No companies found.')).toBeVisible()
	})

	test('creates a company via dialog', async ({ page }) => {
		await page.getByRole('button', { name: 'New Company' }).click()
		
		await page.getByLabel('Company Name').fill('Acme Corp')
		await page.getByLabel('Entity Type').click()
		await page.getByRole('option', { name: 'Startup' }).click()
		
		await page.getByRole('button', { name: 'Save Company' }).click()
		
		await expect(page.getByText('Company created successfully')).toBeVisible()
		await expect(page.getByRole('row').filter({ hasText: 'Acme Corp' })).toBeVisible()
	})

	test('creates an investor company with specific fields', async ({ page }) => {
		await page.getByRole('button', { name: 'New Company' }).click()
		
		await page.getByLabel('Company Name').fill('Big Fund')
		await page.getByLabel('Entity Type').click()
		await page.getByRole('option', { name: 'Investor' }).click()
		
		// Investor specific fields should appear
		await page.getByLabel('AUM').fill('$500M')
		
		await page.getByRole('button', { name: 'Save Company' }).click()
		
		await expect(page.getByText('Company created successfully')).toBeVisible()
		await expect(page.getByRole('row').filter({ hasText: 'Big Fund' })).toBeVisible()
		// Check for investor badge (using case-insensitive match for "investor")
		await expect(page.getByRole('row').filter({ hasText: 'Big Fund' }).getByText('investor', { exact: false })).toBeVisible()
	})

	test('navigates to company detail', async ({ page }) => {
		await page.getByRole('row').filter({ hasText: 'Acme Corp' }).click()
		
		await expect(page).toHaveURL(/\/companies\/[a-zA-Z0-9_-]+/)
		await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible()
	})

	test('edits a company', async ({ page }) => {
		await page.getByRole('row').filter({ hasText: 'Acme Corp' }).click()
		
		await page.getByRole('button', { name: 'Edit' }).click()
		await page.getByLabel('Company Name').fill('Acme Inc')
		await page.getByRole('button', { name: 'Save Company' }).click()
		
		await expect(page.getByText('Company updated successfully')).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Acme Inc' })).toBeVisible()
	})

	test('filters by entity type', async ({ page }) => {
		// We have Acme Inc (Startup) and Big Fund (Investor)
		
		const typeFilter = page.getByRole('combobox').filter({ hasText: 'Filter by type' })
		await typeFilter.click()
		await page.getByRole('option', { name: 'Investor' }).click()
		await page.waitForTimeout(500) // Debounce/Server load

		await expect(page.getByRole('row').filter({ hasText: 'Big Fund' })).toBeVisible()
		await expect(page.getByRole('row').filter({ hasText: 'Acme Inc' })).not.toBeVisible()
		
		// Reset filter
		await typeFilter.click()
		await page.getByRole('option', { name: 'All Types' }).click()
		await page.waitForTimeout(500)
		
		await expect(page.getByRole('row').filter({ hasText: 'Acme Inc' })).toBeVisible()
		await expect(page.getByRole('row').filter({ hasText: 'Big Fund' })).toBeVisible()
	})

	test('deletes a company', async ({ page }) => {
		await page.getByRole('row').filter({ hasText: 'Acme Inc' }).click()
		
		await page.getByRole('button', { name: 'Delete' }).click()
		
		// Confirm in Alert Dialog
		const alertDialog = page.getByRole('alertdialog')
		await alertDialog.getByRole('button', { name: 'Delete' }).click()
		
		await expect(page.getByText('Company deleted')).toBeVisible()
		await expect(page).toHaveURL(/\/companies/)
		await expect(page.getByRole('row').filter({ hasText: 'Acme Inc' })).not.toBeVisible()
	})
})
