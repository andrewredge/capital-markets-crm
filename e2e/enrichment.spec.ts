import { test, expect } from '@playwright/test'
import {
	uniqueEmail,
	uniqueOrgName,
	uiRegister,
	uiLogin,
	uiCreateOrg,
	uiSelectOrg,
	navigateToEnrichment,
	apiTrpcMutation,
} from './helpers'

test.describe('Enrichment Dashboard', () => {
	let testEmail: string
	const testPassword = 'Password123!'
	let orgName: string

	test.beforeAll(async ({ browser }) => {
		test.setTimeout(120_000)
		testEmail = uniqueEmail('enrich')
		orgName = uniqueOrgName('EnrichOrg')
		const page = await browser.newPage()

		await uiRegister(page, { name: 'Enrich User', email: testEmail, password: testPassword })
		await uiCreateOrg(page, orgName)

		// Seed 6 contacts via tRPC: 2 complete, 2 partial, 2 minimal
		await apiTrpcMutation(page, 'contactImport.bulkCreate', {
			contacts: [
				// 2 "complete" — have all basic fields (still score ~0.55 due to no_company_role + not_verified_365d)
				{
					firstName: 'Quinn',
					lastName: 'CompleteSeed',
					email: 'quinn@enrichseed.com',
					phone: '+1234567890',
					title: 'VP Engineering',
					linkedinUrl: 'https://linkedin.com/in/quinn',
				},
				{
					firstName: 'Remy',
					lastName: 'CompleteSeed',
					email: 'remy@enrichseed.com',
					phone: '+1234567891',
					title: 'CFO',
					linkedinUrl: 'https://linkedin.com/in/remy',
				},
				// 2 "partial" — missing phone and title
				{
					firstName: 'Sam',
					lastName: 'PartialSeed',
					email: 'sam@enrichseed.com',
					linkedinUrl: 'https://linkedin.com/in/sam',
				},
				{
					firstName: 'Tina',
					lastName: 'PartialSeed',
					email: 'tina@enrichseed.com',
					linkedinUrl: 'https://linkedin.com/in/tina',
				},
				// 2 "minimal" — only firstName + lastName (score ~1.0)
				{ firstName: 'Zara', lastName: 'MinimalSeed' },
				{ firstName: 'Yuri', lastName: 'MinimalSeed' },
			],
			duplicateStrategy: 'skip',
		})

		await page.close()
	})

	test.beforeEach(async ({ page }) => {
		await uiLogin(page, { email: testEmail, password: testPassword })
		await uiSelectOrg(page, orgName)
		await navigateToEnrichment(page)
	})

	test('enrichment page loads with stats cards', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Data Quality & Enrichment' })).toBeVisible()

		// 4 stats cards
		await expect(page.getByText('Total Contacts')).toBeVisible()
		await expect(page.getByText('Flagged for Review')).toBeVisible()
		await expect(page.getByText('Pending Proposals')).toBeVisible()
		await expect(page.getByText('Verified this Month')).toBeVisible()

		// Total should show 6
		const totalCard = page.locator('[class*="card"]').filter({ hasText: 'Total Contacts' })
		await expect(totalCard.getByText('6')).toBeVisible({ timeout: 15_000 })

		// Flagged should be >= 2
		const flaggedCard = page.locator('[class*="card"]').filter({ hasText: 'Flagged for Review' })
		const flaggedText = await flaggedCard.locator('.text-2xl').textContent({ timeout: 15_000 })
		expect(Number(flaggedText)).toBeGreaterThanOrEqual(2)
	})

	test('staleness queue displays flagged contacts sorted by score', async ({ page }) => {
		// Wait for staleness queue heading
		await expect(page.getByText('Staleness Queue')).toBeVisible()

		// Wait for data to load — the pagination footer will show non-zero totals
		// Use a polling assertion to wait until the total is > 0
		await expect(async () => {
			const text = await page.getByText(/Showing \d+ of \d+ flagged contacts/).textContent()
			const match = text?.match(/Showing (\d+) of (\d+)/)
			expect(Number(match?.[2])).toBeGreaterThanOrEqual(2)
		}).toPass({ timeout: 15_000 })
	})

	test('staleness queue search filters contacts', async ({ page }) => {
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 })

		// Search for distinctive name "Zara"
		await page.getByPlaceholder('Search flagged contacts...').fill('Zara')
		await page.waitForTimeout(500) // debounce

		// Only Zara should appear
		await expect(page.getByText('Zara')).toBeVisible({ timeout: 10_000 })
		const filteredRows = page.locator('table tbody tr')
		const count = await filteredRows.count()
		expect(count).toBeLessThanOrEqual(2) // Zara row(s)

		// Clear search
		await page.getByPlaceholder('Search flagged contacts...').clear()
		await page.waitForTimeout(500)

		// More contacts should reappear
		const allRows = page.locator('table tbody tr')
		const allCount = await allRows.count()
		expect(allCount).toBeGreaterThan(count)
	})

	test('staleness queue min score filter works', async ({ page }) => {
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 })

		// Default is 40%+ (Flagged) — count current rows
		const defaultCount = await page.locator('table tbody tr').count()
		expect(defaultCount).toBeGreaterThanOrEqual(1)

		// Switch to "All" — should show more or equal
		await page.locator('.flex.items-center.gap-2').filter({ hasText: 'Min Score' }).getByRole('combobox').click()
		await page.getByRole('option', { name: 'All' }).click()
		await page.waitForTimeout(500)
		const allCount = await page.locator('table tbody tr').count()
		expect(allCount).toBeGreaterThanOrEqual(defaultCount)

		// Switch to "70%+ (Critical)" — should show fewer
		await page.locator('.flex.items-center.gap-2').filter({ hasText: 'Min Score' }).getByRole('combobox').click()
		await page.getByRole('option', { name: '70%+ (Critical)' }).click()
		await page.waitForTimeout(500)
		const criticalCount = await page.locator('table tbody tr').count()
		expect(criticalCount).toBeLessThanOrEqual(allCount)
	})

	test('clicking a contact opens the review sheet', async ({ page }) => {
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 })

		// Click the first row
		await page.locator('table tbody tr').first().click()

		// Sheet should open with "Enrichment Review" heading
		await expect(page.getByText('Enrichment Review')).toBeVisible({ timeout: 10_000 })

		// Current Contact Data section should be visible
		await expect(page.getByText('Current Contact Data')).toBeVisible()

		// Mark as Verified button should be present
		await expect(page.getByRole('button', { name: /Mark as Verified/ })).toBeVisible()
	})

	test('mark as verified updates the contact', async ({ page }) => {
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 })

		// Click a flagged contact row to open review sheet
		await page.locator('table tbody tr').first().click()
		await expect(page.getByText('Enrichment Review')).toBeVisible({ timeout: 10_000 })

		// Click "Mark as Verified"
		await page.getByRole('button', { name: /Mark as Verified/ }).click()

		// Assert toast
		await expect(page.getByText('Contact marked as verified')).toBeVisible({ timeout: 10_000 })

		// Wait for sheet to close (onSuccess callback)
		await expect(page.getByText('Enrichment Review')).not.toBeVisible({ timeout: 10_000 })

		// Reload the page to get fresh stats
		await page.reload()
		await expect(page.getByText('Data Quality & Enrichment')).toBeVisible({ timeout: 15_000 })

		// Verified this month should show at least 1
		const verifiedCard = page.locator('[class*="card"]').filter({ hasText: 'Verified this Month' })
		await expect(verifiedCard.locator('.text-2xl')).not.toHaveText('0', { timeout: 15_000 })
	})

	test('review sheet shows no pending proposals message', async ({ page }) => {
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 })

		// Click a contact in the staleness queue
		await page.locator('table tbody tr').first().click()
		await expect(page.getByText('Enrichment Review')).toBeVisible({ timeout: 10_000 })

		// Should show "No pending proposals" message
		await expect(page.getByText('No pending proposals found for this contact.')).toBeVisible()

		// Footer should have "Close" button, not "Apply Selected"/"Reject All"
		await expect(page.getByRole('button', { name: 'Close' }).first()).toBeVisible()
		await expect(page.getByRole('button', { name: 'Apply Selected' })).not.toBeVisible()
		await expect(page.getByRole('button', { name: 'Reject All' })).not.toBeVisible()

		// Click Close (first match is the footer button)
		await page.getByRole('button', { name: 'Close' }).first().click()
		await expect(page.getByText('Enrichment Review')).not.toBeVisible({ timeout: 5_000 })
	})
})
