import { StalenessQueueTable } from '@/components/enrichment/staleness-queue-table'
import { EnrichmentStatsCards } from '@/components/enrichment/enrichment-stats-cards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function EnrichmentPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Data Quality & Enrichment</h1>
				<p className="text-muted-foreground">
					Monitor data staleness and review proposed updates for your contacts.
				</p>
			</div>

			<EnrichmentStatsCards />

			<Card>
				<CardHeader>
					<CardTitle>Staleness Queue</CardTitle>
					<CardDescription>
						Contacts sorted by staleness score. Review those with the highest scores first.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<StalenessQueueTable />
				</CardContent>
			</Card>
		</div>
	)
}
