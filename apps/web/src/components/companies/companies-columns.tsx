import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

export type Company = {
	id: string
	name: string
	entityType: string
	website: string | null
	industry: string | null
	headquarters: string | null
	createdAt: Date
}

export const columns: ColumnDef<Company>[] = [
	{
		accessorKey: 'name',
		header: 'Name',
		cell: ({ row }) => (
			<div className="font-medium">{row.getValue('name')}</div>
		),
	},
	{
		accessorKey: 'entityType',
		header: 'Type',
		cell: ({ row }) => {
			const type = row.getValue('entityType') as string
			let className = ''

			switch (type) {
				case 'startup':
					className = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
					break
				case 'listed_company':
					className = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/50'
					break
				case 'investor':
					className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50'
					break
				case 'service_provider':
					className = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900/50'
					break
			}

			const label = type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

			return (
				<Badge variant="secondary" className={className}>
					{label}
				</Badge>
			)
		},
	},
	{
		accessorKey: 'industry',
		header: 'Industry',
		cell: ({ row }) => row.getValue('industry') || '-',
	},
	{
		accessorKey: 'headquarters',
		header: 'Headquarters',
		cell: ({ row }) => row.getValue('headquarters') || '-',
	},
	{
		accessorKey: 'website',
		header: 'Website',
		cell: ({ row }) => {
			const website = row.getValue('website') as string
			if (!website) return '-'
			return (
				<a
					href={website.startsWith('http') ? website : `https://${website}`}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-1 text-primary hover:underline"
					onClick={(e) => e.stopPropagation()}
				>
					{website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
					<ExternalLink className="h-3 w-3" />
				</a>
			)
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Created',
		cell: ({ row }) => {
			const date = new Date(row.getValue('createdAt'))
			return new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			}).format(date)
		},
	},
]
