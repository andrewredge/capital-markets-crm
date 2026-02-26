'use strict'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { PROJECT_STATUS_OPTIONS, COMMODITY_OPTIONS } from '@crm/shared'
import { format } from 'date-fns'
import Link from 'next/link'

export const columns: ColumnDef<any>[] = [
	{
		accessorKey: 'name',
		header: 'Name',
		cell: ({ row }) => {
			return (
				<div className="font-medium text-primary">
					{row.getValue('name')}
				</div>
			)
		},
	},
	{
		accessorKey: 'ownerCompanyName',
		header: 'Owner Company',
		cell: ({ row }) => {
			const name = row.getValue('ownerCompanyName') as string
			const id = row.original.ownerCompanyId as string
			if (!name) return <span className="text-muted-foreground">-</span>
			return (
				<Link
					href={`/companies/${id}`}
					className="hover:underline text-muted-foreground"
					onClick={(e) => e.stopPropagation()}
				>
					{name}
				</Link>
			)
		},
	},
	{
		accessorKey: 'projectStatus',
		header: 'Status',
		cell: ({ row }) => {
			const status = row.getValue('projectStatus') as string
			const option = PROJECT_STATUS_OPTIONS.find((o) => o.value === status)
			return (
				<Badge variant="outline">
					{option?.label || status}
				</Badge>
			)
		},
	},
	{
		accessorKey: 'primaryCommodity',
		header: 'Primary Commodity',
		cell: ({ row }) => {
			const commodity = row.getValue('primaryCommodity') as string
			const option = COMMODITY_OPTIONS.find((o) => o.value === commodity)
			return (
				<Badge>
					{option?.label || commodity}
				</Badge>
			)
		},
	},
	{
		accessorKey: 'country',
		header: 'Country',
		cell: ({ row }) => row.getValue('country') || '-',
	},
	{
		accessorKey: 'createdAt',
		header: 'Created',
		cell: ({ row }) => {
			const date = row.getValue('createdAt')
			if (!date) return '-'
			return format(new Date(date as string), 'MMM d, yyyy')
		},
	},
]
