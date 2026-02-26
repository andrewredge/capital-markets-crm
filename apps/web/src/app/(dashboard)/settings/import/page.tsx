import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ImportWizard } from '@/components/import/import-wizard'

export const metadata: Metadata = {
	title: 'Import Contacts | Capital Markets CRM',
	description: 'Import contacts from CSV or Excel files.',
}

export default async function ImportPage() {
	const t = await getTranslations('settings.import')

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
				<p className="text-muted-foreground">
					{t('description')}
				</p>
			</div>
			<ImportWizard />
		</div>
	)
}
