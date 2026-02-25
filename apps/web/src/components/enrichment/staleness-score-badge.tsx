import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StalenessScoreBadgeProps {
	score: number
	className?: string
}

export function StalenessScoreBadge({ score, className }: StalenessScoreBadgeProps) {
	let colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900'

	if (score >= 0.7) {
		colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900'
	} else if (score >= 0.4) {
		colorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900'
	}

	return (
		<Badge variant="outline" className={cn('font-mono font-medium', colorClass, className)}>
			{(score * 100).toFixed(0)}%
		</Badge>
	)
}
