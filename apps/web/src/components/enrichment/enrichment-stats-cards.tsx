'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, History, Users } from 'lucide-react'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

export function EnrichmentStatsCards() {
	const trpc = useTRPC()
	const { data: stats, isLoading } = useQuery(trpc.enrichment.getStats.queryOptions())

	const cards = [
		{
			title: 'Total Contacts',
			value: stats?.totalContacts ?? 0,
			description: 'In your organization',
			icon: Users,
			color: 'text-blue-500',
		},
		{
			title: 'Flagged for Review',
			value: stats?.flaggedContacts ?? 0,
			description: 'Score >= 0.4',
			icon: AlertCircle,
			color: 'text-amber-500',
		},
		{
			title: 'Pending Proposals',
			value: stats?.pendingProposals ?? 0,
			description: 'Updates from imports',
			icon: History,
			color: 'text-purple-500',
		},
		{
			title: 'Verified this Month',
			value: stats?.verifiedThisMonth ?? 0,
			description: 'Manual or reviewed',
			icon: CheckCircle2,
			color: 'text-green-500',
		},
	]

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{cards.map((card) => (
				<Card key={card.title}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{card.title}</CardTitle>
						<card.icon className={`h-4 w-4 ${card.color}`} />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-20" />
						) : (
							<>
								<div className="text-2xl font-bold">{card.value}</div>
								<p className="text-xs text-muted-foreground">{card.description}</p>
							</>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	)
}
