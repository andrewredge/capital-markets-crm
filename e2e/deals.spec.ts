import { test, expect } from '@playwright/test'
import {
	uniqueEmail,
	uniqueOrgName,
	uiRegister,
	uiLogin,
	uiCreateOrg,
	uiSelectOrg,
	navigateToDeals,
	navigateToContacts,
	navigateToCompanies,
	navigateToPipelineSettings,
} from './helpers'

test.describe('Deals CRUD', () => {
	let testEmail: string
	const testPassword = 'Password123!'
	let orgName: string

	test.beforeAll(async ({ browser }) => {
		test.setTimeout(120_000) // lots of setup: register, org, pipeline, contact, company, deal
		testEmail = uniqueEmail('deals')
		orgName = uniqueOrgName('DealsOrg')
		const page = await browser.newPage()
		await uiRegister(page, { name: 'Deals User', email: testEmail, password: testPassword })
		await uiCreateOrg(page, orgName)

		// Create a pipeline with default stages
		await navigateToPipelineSettings(page)
		await page.getByRole('button', { name: 'Create Pipeline' }).first().click()
		await expect(page.getByRole('dialog')).toBeVisible()
		await page.getByLabel('Name').fill('Test Pipeline')
		await page.getByRole('dialog').getByRole('button', { name: 'Create Pipeline' }).click()
		await expect(page.getByText(/Pipeline created/)).toBeVisible({ timeout: 20_000 })

		// Create a contact for participant tests
		await navigateToContacts(page)
		await page.getByRole('button', { name: 'New Contact' }).click()
		await page.getByLabel('First Name').fill('Deal')
		await page.getByLabel('Last Name').fill('Contact')
		await page.getByRole('button', { name: 'Save Contact' }).click()
		await expect(page.getByText('Contact created successfully')).toBeVisible()

		// Create a company for participant tests
		await navigateToCompanies(page)
		await page.getByRole('button', { name: 'New Company' }).click()
		await page.getByLabel('Company Name').fill('DealCorp')
		await page.getByLabel('Entity Type').click()
		await page.getByRole('option', { name: 'Startup' }).click()
		await page.getByRole('button', { name: 'Save Company' }).click()
		await expect(page.getByText('Company created successfully')).toBeVisible()

		// Create the main test deal so all tests can find it
		await navigateToDeals(page)
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })
		await page.getByRole('button', { name: 'New Deal' }).click()
		await page.getByLabel('Deal Name').fill('Acme Series A')
		await page.getByRole('button', { name: 'Create Deal' }).click()
		await expect(page.getByText('Deal created')).toBeVisible({ timeout: 10_000 })

		await page.close()
	})

	test.beforeEach(async ({ page }) => {
		await uiLogin(page, { email: testEmail, password: testPassword })
		await uiSelectOrg(page, orgName)
		await navigateToDeals(page)
	})

	test('displays deals page with pipeline selector', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Deals' })).toBeVisible()
		// Pipeline selector should show "Test Pipeline"
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })
	})

	test('creates a deal via dialog', async ({ page }) => {
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })

		await page.getByRole('button', { name: 'New Deal' }).click()
		await page.getByLabel('Deal Name').fill('New Test Deal')
		await page.getByRole('button', { name: 'Create Deal' }).click()

		await expect(page.getByText('Deal created')).toBeVisible({ timeout: 10_000 })
		// Deal should appear (in Kanban or table view)
		await expect(page.getByText('New Test Deal')).toBeVisible({ timeout: 10_000 })
	})

	test('toggles between kanban and table views', async ({ page }) => {
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })
		await expect(page.getByText('Acme Series A').first()).toBeVisible({ timeout: 10_000 })

		// Switch to table view
		await page.getByRole('tab', { name: /table/i }).click()
		await expect(page.getByText('Acme Series A').first()).toBeVisible()

		// Switch back to kanban
		await page.getByRole('tab', { name: /kanban/i }).click()
		await expect(page.getByText('Acme Series A').first()).toBeVisible()
	})

	test('navigates to deal detail from table view', async ({ page }) => {
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })

		// Switch to table view
		await page.getByRole('tab', { name: /table/i }).click()
		const dealRow = page.getByRole('row').filter({ hasText: 'Acme Series A' }).first()
		await expect(dealRow).toBeVisible({ timeout: 10_000 })
		await dealRow.click()

		await expect(page).toHaveURL(/\/deals\/[a-zA-Z0-9_-]+/)
		await expect(page.getByRole('heading', { name: /Acme Series A/ })).toBeVisible()
	})

	test('deal detail shows overview and sections', async ({ page }) => {
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })

		await page.getByRole('tab', { name: /table/i }).click()
		const dealRow = page.getByRole('row').filter({ hasText: 'Acme Series A' }).first()
		await expect(dealRow).toBeVisible({ timeout: 10_000 })
		await dealRow.click()
		await expect(page).toHaveURL(/\/deals\/[a-zA-Z0-9_-]+/)

		// Check key sections exist
		await expect(page.getByText('Overview')).toBeVisible()
		await expect(page.getByText('Participants', { exact: true })).toBeVisible()
		// The stage badge should show "Sourced" (first non-terminal stage)
		await expect(page.getByText('Sourced').first()).toBeVisible()
		await expect(page.getByText('Test Pipeline')).toBeVisible()
	})

	test('edits a deal', async ({ page }) => {
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })
		await page.getByRole('tab', { name: /table/i }).click()
		const dealRow = page.getByRole('row').filter({ hasText: 'Acme Series A' }).first()
		await expect(dealRow).toBeVisible({ timeout: 10_000 })
		await dealRow.click()
		await expect(page).toHaveURL(/\/deals\/[a-zA-Z0-9_-]+/)

		await page.getByRole('button', { name: 'Edit' }).click()

		await page.getByLabel('Deal Name').fill('Acme Series A (Updated)')
		await page.getByRole('button', { name: /save|update/i }).click()

		await expect(page.getByText('Deal updated')).toBeVisible({ timeout: 10_000 })
		await expect(page.getByRole('heading', { name: 'Acme Series A (Updated)' })).toBeVisible()
	})

	test('adds a contact participant to deal', async ({ page }) => {
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })
		await page.getByRole('tab', { name: /table/i }).click()
		const dealRow = page.getByRole('row').filter({ hasText: /Acme Series A/ }).first()
		await expect(dealRow).toBeVisible({ timeout: 10_000 })
		await dealRow.click()
		await expect(page).toHaveURL(/\/deals\/[a-zA-Z0-9_-]+/)

		// Click "Add" button in Participants section — use exact match to avoid matching "Add Note"
		await page.getByRole('button', { name: 'Add', exact: true }).click()

		// Should open Add Participant dialog
		await expect(page.getByRole('heading', { name: 'Add Participant' })).toBeVisible()

		// Search for our test contact
		await page.getByPlaceholder('Search by name...').fill('Deal')
		await page.waitForTimeout(500) // debounce

		// Select the contact from search results
		await page.getByRole('dialog').getByText('Deal Contact').click()

		// Role defaults to Investor, keep it
		await page.getByRole('dialog').getByRole('button', { name: 'Add Participant' }).click()

		await expect(page.getByText('Participant added')).toBeVisible({ timeout: 10_000 })
		await expect(page.getByText('Deal Contact').first()).toBeVisible()
	})

	test('adds a company participant to deal', async ({ page }) => {
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })
		await page.getByRole('tab', { name: /table/i }).click()
		const dealRow = page.getByRole('row').filter({ hasText: /Acme Series A/ }).first()
		await expect(dealRow).toBeVisible({ timeout: 10_000 })
		await dealRow.click()
		await expect(page).toHaveURL(/\/deals\/[a-zA-Z0-9_-]+/)

		// Click "Add" button — use exact match
		await page.getByRole('button', { name: 'Add', exact: true }).click()

		// Switch to Company tab
		await page.getByRole('tab', { name: 'Company' }).click()

		await page.getByPlaceholder('Search by name...').fill('DealCorp')
		await page.waitForTimeout(500)

		await page.getByRole('dialog').getByText('DealCorp').click()

		// Change role to Target
		await page.getByLabel('Role').click()
		await page.getByRole('option', { name: 'Target' }).click()

		await page.getByRole('dialog').getByRole('button', { name: 'Add Participant' }).click()

		await expect(page.getByText('Participant added')).toBeVisible({ timeout: 10_000 })
		await expect(page.getByText('DealCorp').first()).toBeVisible()
	})

	test('creates a second deal and views it', async ({ page }) => {
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })

		await page.getByRole('button', { name: 'New Deal' }).click()
		await page.getByLabel('Deal Name').fill('Beta Acquisition')
		// Change deal type
		await page.getByLabel('Deal Type').click()
		await page.getByRole('option', { name: 'M&A (Buy-side)' }).click()
		await page.getByRole('button', { name: 'Create Deal' }).click()

		await expect(page.getByText('Deal created')).toBeVisible({ timeout: 10_000 })
		await expect(page.getByText('Beta Acquisition')).toBeVisible({ timeout: 10_000 })
	})

	test('deletes a deal', async ({ page }) => {
		await expect(page.getByText('Test Pipeline')).toBeVisible({ timeout: 10_000 })
		await page.getByRole('tab', { name: /table/i }).click()
		const dealRow = page.getByRole('row').filter({ hasText: 'Beta Acquisition' })
		await expect(dealRow).toBeVisible({ timeout: 10_000 })
		await dealRow.click()
		await expect(page).toHaveURL(/\/deals\/[a-zA-Z0-9_-]+/)

		// Deal detail uses window.confirm for delete
		page.on('dialog', (dialog) => dialog.accept())
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText('Deal deleted')).toBeVisible({ timeout: 10_000 })
		await expect(page).toHaveURL(/\/deals/)
	})
})
