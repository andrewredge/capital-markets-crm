import type { Metadata } from 'next'
import { CompaniesPageClient } from '@/components/companies/companies-page-client'

export const metadata: Metadata = {
	title: 'Companies | Capital Markets CRM',
	description: 'Manage companies, investors, and startups.',
}

export default function CompaniesPage() {
	return <CompaniesPageClient />
}
