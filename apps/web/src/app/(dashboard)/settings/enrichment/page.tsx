import { getTranslations } from 'next-intl/server'
import { StalenessQueueTable } from '@/components/enrichment/staleness-queue-table'
import { EnrichmentStatsCards } from '@/components/enrichment/enrichment-stats-cards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function EnrichmentPage() {
	const t = await getTranslations('settings.enrichment')

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
				<p className="text-muted-foreground">
					{t('pageDescription')}
				</p>
			</div>

			<EnrichmentStatsCards />

			<Card>
				<CardHeader>
					<CardTitle>{t('stalenessQueue')}</CardTitle>
					<CardDescription>
						{t('stalenessDescription')}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<StalenessQueueTable />
				</CardContent>
			</Card>
		</div>
	)
}
