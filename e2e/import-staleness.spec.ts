import { test, expect } from '@playwright/test'
import {
	uniqueEmail,
	uniqueOrgName,
	uiRegister,
	uiLogin,
	uiCreateOrg,
	uiSelectOrg,
	navigateToImport,
	navigateToEnrichment,
} from './helpers'

test.describe('Import → Staleness Flow', () => {
	let testEmail: string
	const testPassword = 'Password123!'
	let orgName: string

	test.beforeAll(async ({ browser }) => {
		test.setTimeout(120_000)
		testEmail = uniqueEmail('impstal')
		orgName = uniqueOrgName('ImpStalOrg')
		const page = await browser.newPage()

		await uiRegister(page, { name: 'ImpStal User', email: testEmail, password: testPassword })
		await uiCreateOrg(page, orgName)

		await page.close()
	})

	test.beforeEach(async ({ page }) => {
		await uiLogin(page, { email: testEmail, password: testPassword })
		await uiSelectOrg(page, orgName)
	})

	test('import contacts via wizard and verify flagged count in results', async ({ page }) => {
		await navigateToImport(page)

		// Upload contacts-mixed.csv
		const fileInput = page.locator('input[type="file"]')
		await fileInput.setInputFiles('e2e/fixtures/contacts-mixed.csv')

		// File parses and wizard transitions to mapping step
		await expect(page.getByRole('heading', { name: 'Map Columns' })).toBeVisible({ timeout: 10_000 })

		// Auto-mapping should have handled First Name, Last Name, Email
		// Required fields should be mapped — no error banner
		await expect(page.getByText('Required fields not mapped')).not.toBeVisible()

		// Click "Continue to Preview"
		await page.getByRole('button', { name: 'Continue to Preview' }).click()

		// Preview step
		await expect(page.getByText('Preview & Validate')).toBeVisible({ timeout: 10_000 })
		// Should show rows in preview table
		await expect(page.locator('table tbody tr').first()).toBeVisible()
		// Duplicate Handling radio group should be visible
		await expect(page.getByText('Duplicate Handling')).toBeVisible()
		// Default should be "Skip duplicates"
		await expect(page.getByLabel('Skip duplicates')).toBeChecked()

		// Click "Import Contacts"
		await page.getByRole('button', { name: 'Import Contacts' }).click()

		// Result step
		await expect(page.getByText('Import Complete')).toBeVisible({ timeout: 30_000 })
		// 8 imported badge
		await expect(page.getByText('8 imported')).toBeVisible()
		// Flagged for review banner should appear
		await expect(page.getByText(/contacts flagged for review/)).toBeVisible()
		// "Go to Enrichment Queue" link should be visible
		await expect(page.getByText('Go to Enrichment Queue')).toBeVisible()
	})

	test('imported contacts appear in staleness queue', async ({ page }) => {
		// Navigate to enrichment page via settings
		await navigateToEnrichment(page)
		await expect(page.getByText('Data Quality & Enrichment')).toBeVisible({ timeout: 15_000 })

		// Wait for the staleness queue to show actual data rows (not the "No flagged contacts" message)
		// The Flagged for Review stat card should show > 0
		const flaggedCard = page.locator('[class*="card"]').filter({ hasText: 'Flagged for Review' })
		await expect(flaggedCard.locator('.text-2xl')).not.toHaveText('0', { timeout: 20_000 })

		// Staleness queue table should have data rows (not just the "no results" row)
		await expect(page.locator('table tbody tr').first()).toBeVisible()
		const firstRowText = await page.locator('table tbody tr').first().textContent()
		// Should NOT be the "no results" message
		expect(firstRowText).not.toContain('No flagged contacts found')
	})

	test('import with skip duplicate strategy skips existing contacts', async ({ page }) => {
		await navigateToImport(page)

		// Upload same file again
		const fileInput = page.locator('input[type="file"]')
		await fileInput.setInputFiles('e2e/fixtures/contacts-mixed.csv')

		// Wait for mapping step
		await expect(page.getByRole('heading', { name: 'Map Columns' })).toBeVisible({ timeout: 10_000 })
		await expect(page.getByText('Required fields not mapped')).not.toBeVisible()
		await page.getByRole('button', { name: 'Continue to Preview' }).click()
		await expect(page.getByText('Preview & Validate')).toBeVisible({ timeout: 10_000 })

		// "Skip duplicates" should be selected by default
		await expect(page.getByLabel('Skip duplicates')).toBeChecked()

		// Import
		await page.getByRole('button', { name: 'Import Contacts' }).click()
		await expect(page.getByText('Import Complete')).toBeVisible({ timeout: 30_000 })

		// Contacts WITH email (Alice, Bob, Eve, Frank, Henry = 5) should be skipped
		// Contacts WITHOUT email (Carol, Dave, Grace = 3) should be imported (no email to match on)
		// Verify the result shows both imported and skipped badges
		await expect(page.getByText(/\d+ imported/)).toBeVisible({ timeout: 10_000 })
		await expect(page.getByText(/\d+ skipped/)).toBeVisible({ timeout: 10_000 })
	})
})
