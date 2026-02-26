import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type Contact = {
	id: string
	firstName: string
	lastName: string
	email: string | null
	phone: string | null
	title: string | null
	status: string
	createdAt: Date
}

export const getColumns = (t: any): ColumnDef<Contact>[] => [
	{
		accessorKey: 'name',
		header: t('columns.name'),
		cell: ({ row }) => {
			const contact = row.original
			return (
				<div className="font-medium">
					{contact.firstName} {contact.lastName}
				</div>
			)
		},
	},
	{
		accessorKey: 'email',
		header: t('columns.email'),
		cell: ({ row }) => row.getValue('email') || '-',
	},
	{
		accessorKey: 'phone',
		header: t('columns.phone'),
		cell: ({ row }) => row.getValue('phone') || '-',
	},
	{
		accessorKey: 'title',
		header: t('columns.title'),
		cell: ({ row }) => row.getValue('title') || '-',
	},
	{
		accessorKey: 'status',
		header: t('columns.status'),
		cell: ({ row }) => {
			const status = row.getValue('status') as string
			let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary'
			let className = ''

			switch (status) {
				case 'active':
					className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50'
					break
				case 'lead':
					className = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
					break
				case 'churned':
					variant = 'destructive'
					break
				case 'inactive':
					variant = 'secondary'
					break
			}

			return (
				<Badge variant={variant} className={className}>
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</Badge>
			)
		},
	},
	{
		accessorKey: 'createdAt',
		header: t('columns.createdAt'),
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
