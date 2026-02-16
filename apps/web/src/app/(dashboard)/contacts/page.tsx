import type { Metadata } from 'next'
import { ContactsPageClient } from '@/components/contacts/contacts-page-client'

export const metadata: Metadata = {
	title: 'Contacts | Capital Markets CRM',
	description: 'Manage your contacts and relationships.',
}

export default function ContactsPage() {
	return <ContactsPageClient />
}
