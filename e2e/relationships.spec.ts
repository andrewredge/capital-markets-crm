import { test, expect } from '@playwright/test'
import { uniqueEmail, uniqueOrgName, uiRegister, uiLogin, uiCreateOrg, navigateToContacts, navigateToCompanies } from './helpers'

test.describe('Entity Relationships', () => {
	let testEmail: string
	const testPassword = 'Password123!'
	let orgName: string

	test.beforeAll(async ({ browser }) => {
		testEmail = uniqueEmail('rel')
		orgName = uniqueOrgName('RelOrg')
		const page = await browser.newPage()
		await uiRegister(page, { name: 'Rel User', email: testEmail, password: testPassword })
		await uiCreateOrg(page, orgName)
		
		// Create a contact
		await navigateToContacts(page)
		await page.getByRole('button', { name: 'New Contact' }).click()
		await page.getByLabel('First Name').fill('Jane')
		await page.getByLabel('Last Name').fill('Doe')
		await page.getByLabel('Email').fill('jane@doe.com')
		await page.getByRole('button', { name: 'Save Contact' }).click()
		await expect(page.getByText('Contact created successfully')).toBeVisible()
		
		// Create a company
		await navigateToCompanies(page)
		await page.getByRole('button', { name: 'New Company' }).click()
		await page.getByLabel('Company Name').fill('TestCo')
		await page.getByLabel('Entity Type').click()
		await page.getByRole('option', { name: 'Startup' }).click()
		await page.getByRole('button', { name: 'Save Company' }).click()
		await expect(page.getByText('Company created successfully')).toBeVisible()
		
		await page.close()
	})

	test.beforeEach(async ({ page }) => {
		await uiLogin(page, { email: testEmail, password: testPassword })
	})

	test('adds a contact to a company', async ({ page }) => {
		await navigateToCompanies(page)
		await page.getByRole('row').filter({ hasText: 'TestCo' }).click()
		
		// Find Contacts section and click the add button in its header
		const contactsSection = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Contacts', exact: true }) }).first()
		await contactsSection.getByRole('button').first().click()
		
		// Fill AddContactRoleDialog
		await page.getByLabel('Contact').click()
		await page.getByRole('option', { name: 'Jane Doe' }).click()
		
		await page.getByLabel('Role').click()
		await page.getByRole('option', { name: 'Founder' }).click()
		
		await page.getByRole('button', { name: 'Add Contact', exact: true }).click()
		
		await expect(page.getByText('Contact added')).toBeVisible()
		await expect(page.getByRole('row').filter({ hasText: 'Jane Doe' })).toBeVisible()
		await expect(page.getByRole('row').filter({ hasText: 'Founder' })).toBeVisible()
	})

	test('contact detail shows company association', async ({ page }) => {
		await navigateToContacts(page)
		await page.getByRole('row').filter({ hasText: 'Jane' }).click()
		
		// Check Companies section
		const companiesSection = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Companies', exact: true }) }).first()
		await expect(companiesSection.getByText('TestCo')).toBeVisible()
		await expect(companiesSection.getByText('Founder')).toBeVisible()
	})
})
