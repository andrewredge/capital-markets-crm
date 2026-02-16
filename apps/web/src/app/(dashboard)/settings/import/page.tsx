import type { Metadata } from 'next'
import { ImportWizard } from '@/components/import/import-wizard'

export const metadata: Metadata = {
	title: 'Import Contacts | Capital Markets CRM',
	description: 'Import contacts from CSV or Excel files.',
}

export default function ImportPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Import Contacts</h1>
				<p className="text-muted-foreground">
					Upload a CSV or Excel file to bulk import contacts into your CRM.
				</p>
			</div>
			<ImportWizard />
		</div>
	)
}
