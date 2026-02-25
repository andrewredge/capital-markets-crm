'use client'

import { useState } from 'react'
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	type ColumnDef,
} from '@tanstack/react-table'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { StalenessScoreBadge } from './staleness-score-badge'
import { StalenessFlagsList } from './staleness-flags-list'
import type { StalenessFlag } from '@crm/shared'
import { ProposalReviewSheet } from './proposal-review-sheet'

export type StalenessQueueItem = {
	id: string
	contactId: string
	firstName: string
	lastName: string
	title: string | null
	score: number
	flags: StalenessFlag[]
	lastVerifiedAt: string | null
}

const columns: ColumnDef<StalenessQueueItem>[] = [
	{
		id: 'contact',
		header: 'Contact',
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="font-medium text-sm">
					{row.original.firstName} {row.original.lastName}
				</span>
				<span className="text-xs text-muted-foreground truncate max-w-[200px]">
					{row.original.title || 'No title'}
				</span>
			</div>
		),
	},
	{
		accessorKey: 'score',
		header: 'Score',
		cell: ({ row }) => <StalenessScoreBadge score={row.original.score} />,
	},
	{
		accessorKey: 'flags',
		header: 'Signals',
		cell: ({ row }) => <StalenessFlagsList flags={row.original.flags} />,
	},
	{
		accessorKey: 'lastVerifiedAt',
		header: 'Last Verified',
		cell: ({ row }) => {
			const date = row.original.lastVerifiedAt
			if (!date) return <span className="text-muted-foreground italic text-xs">Never</span>
			return (
				<span className="text-xs">
					{new Intl.DateTimeFormat('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					}).format(new Date(date))}
				</span>
			)
		},
	},
]

export function StalenessQueueTable() {
	const trpc = useTRPC()
	const [search, setSearch] = useState('')
	const [minScore, setMinScore] = useState<string>('0.4')
	const [page, setPage] = useState(1)
	const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
	const limit = 25

	const debouncedSearch = useDebounce(search, 300)

	const { data, isLoading, refetch } = useQuery(
		trpc.enrichment.getStalenessQueue.queryOptions({
			search: debouncedSearch || undefined,
			minScore: parseFloat(minScore) || 0,
			page,
			limit,
		}),
	)

	const table = useReactTable<StalenessQueueItem>({
		data: (data?.items ?? []) as StalenessQueueItem[],
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
	})

	const totalPages = Math.ceil((data?.total ?? 0) / limit)

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search flagged contacts..."
						className="pl-8"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value)
							setPage(1)
						}}
					/>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">Min Score:</span>
					<Select
						value={minScore}
						onValueChange={(value) => {
							setMinScore(value)
							setPage(1)
						}}
					>
						<SelectTrigger className="w-[120px]">
							<SelectValue placeholder="Min Score" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="0">All</SelectItem>
							<SelectItem value="0.1">10%+</SelectItem>
							<SelectItem value="0.4">40%+ (Flagged)</SelectItem>
							<SelectItem value="0.7">70%+ (Critical)</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isLoading}>
					<RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
				</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={i}>
									{columns.map((_, j) => (
										<TableCell key={j}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									))}
								</TableRow>
							))
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => setSelectedContactId(row.original.contactId)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-muted-foreground"
								>
									No flagged contacts found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between">
				<div className="text-sm text-muted-foreground">
					Showing {data?.items.length ?? 0} of {data?.total ?? 0} flagged contacts
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1 || isLoading}
					>
						<ChevronLeft className="h-4 w-4 mr-1" />
						Previous
					</Button>
					<div className="text-sm font-medium">
						Page {page} of {Math.max(1, totalPages)}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => p + 1)}
						disabled={page >= totalPages || isLoading}
					>
						Next
						<ChevronRight className="h-4 w-4 ml-1" />
					</Button>
				</div>
			</div>

			<ProposalReviewSheet
				contactId={selectedContactId}
				onClose={() => setSelectedContactId(null)}
				onSuccess={() => {
					setSelectedContactId(null)
					refetch()
				}}
			/>
		</div>
	)
}
