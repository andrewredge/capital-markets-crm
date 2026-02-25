import { Badge } from '@/components/ui/badge'
import type { StalenessFlag } from '@crm/shared'

const FLAG_LABELS: Record<StalenessFlag, string> = {
	no_email: 'No Email',
	no_phone: 'No Phone',
	title_empty: 'No Title',
	no_company_role: 'No Company',
	linkedin_missing: 'No LinkedIn',
	not_verified_90d: '>90d Unverified',
	not_verified_180d: '>180d Unverified',
	not_verified_365d: '>365d Unverified',
}

interface StalenessFlagsListProps {
	flags: StalenessFlag[]
	max?: number
}

export function StalenessFlagsList({ flags, max = 3 }: StalenessFlagsListProps) {
	if (!flags || flags.length === 0) return null

	const displayed = flags.slice(0, max)
	const remaining = flags.length - max

	return (
		<div className="flex flex-wrap gap-1">
			{displayed.map((flag) => (
				<Badge key={flag} variant="secondary" className="px-1.5 py-0 text-[10px] uppercase font-bold tracking-tight bg-secondary/50 text-secondary-foreground border-transparent">
					{FLAG_LABELS[flag] || flag}
				</Badge>
			))}
			{remaining > 0 && (
				<Badge variant="outline" className="px-1 py-0 text-[10px] text-muted-foreground">
					+{remaining} more
				</Badge>
			)}
		</div>
	)
}
