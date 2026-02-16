import { test, expect } from '@playwright/test'
import {
	uniqueEmail,
	uniqueOrgName,
	uiRegister,
	uiLogin,
	uiCreateOrg,
	uiSelectOrg,
	navigateToPipelineSettings,
} from './helpers'

test.describe('Pipeline Settings', () => {
	let testEmail: string
	const testPassword = 'Password123!'
	let orgName: string

	test.beforeAll(async ({ browser }) => {
		testEmail = uniqueEmail('pipelines')
		orgName = uniqueOrgName('PipelineOrg')
		const page = await browser.newPage()
		await uiRegister(page, { name: 'Pipeline User', email: testEmail, password: testPassword })
		await uiCreateOrg(page, orgName)
		await page.close()
	})

	test.beforeEach(async ({ page }) => {
		await uiLogin(page, { email: testEmail, password: testPassword })
		await uiSelectOrg(page, orgName)
	})

	test('displays empty pipeline settings', async ({ page }) => {
		await navigateToPipelineSettings(page)
		await expect(page.getByRole('heading', { name: 'Pipeline Settings' })).toBeVisible()
		await expect(page.getByText('No pipelines configured')).toBeVisible({ timeout: 10_000 })
	})

	test('creates a pipeline with default VC stages', async ({ page }) => {
		await navigateToPipelineSettings(page)

		// Click the Create Pipeline button (may be in empty state or header)
		await page.getByRole('button', { name: /Create Pipeline/i }).first().click()

		// Fill in the dialog
		await expect(page.getByRole('dialog')).toBeVisible()
		await page.getByLabel('Name').fill('VC Deal Flow')
		// "Seed with default VC stages" checkbox is checked by default

		// Submit — click the Create Pipeline button inside the dialog
		await page.getByRole('dialog').getByRole('button', { name: /Create Pipeline/i }).click()

		// Toast: "Pipeline created with default stages" or "Pipeline created"
		await expect(page.getByText(/Pipeline created/)).toBeVisible({ timeout: 20_000 })

		// Wait for dialog to close and pipeline to appear
		await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 })
		await expect(page.getByText('VC Deal Flow')).toBeVisible({ timeout: 10_000 })
	})

	test('pipeline accordion shows seeded stages', async ({ page }) => {
		await navigateToPipelineSettings(page)

		// Wait for the pipeline to appear
		await expect(page.getByText('VC Deal Flow')).toBeVisible({ timeout: 10_000 })

		// Expand the pipeline accordion
		await page.getByText('VC Deal Flow').click()

		// Check that seeded stages are visible
		await expect(page.getByText('Sourced')).toBeVisible({ timeout: 10_000 })
		await expect(page.getByText('First Meeting')).toBeVisible()
		await expect(page.getByText('Due Diligence')).toBeVisible()
		await expect(page.getByText('Closed Won')).toBeVisible()
		await expect(page.getByText('Passed', { exact: true })).toBeVisible()
	})

	test('creates a second pipeline without seeded stages', async ({ page }) => {
		await navigateToPipelineSettings(page)

		await page.getByRole('button', { name: /Create Pipeline/i }).first().click()
		await expect(page.getByRole('dialog')).toBeVisible()

		await page.getByLabel('Name').fill('M&A Pipeline')
		// Uncheck the seed stages checkbox
		await page.locator('#seed-stages').click()

		await page.getByRole('dialog').getByRole('button', { name: /Create Pipeline/i }).click()

		await expect(page.getByText(/Pipeline created/)).toBeVisible({ timeout: 15_000 })
		await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 })
		await expect(page.getByText('M&A Pipeline')).toBeVisible({ timeout: 10_000 })
	})
})
