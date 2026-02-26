'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	type SortingState,
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
import { CONTACT_STATUS_OPTIONS, type ContactStatus } from '@crm/shared'
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { getColumns } from './contacts-columns'
import { CreateContactDialog } from './create-contact-dialog'
import { useDebounce } from '@/hooks/use-debounce'

export function ContactsPageClient() {
	const t = useTranslations('contacts')
	const tTable = useTranslations('table')
	const router = useRouter()
	const trpc = useTRPC()
	const [search, setSearch] = useState('')
	const [status, setStatus] = useState<ContactStatus | 'all'>('all')
	const [page, setPage] = useState(1)
	const [sorting, setSorting] = useState<SortingState>([])
	const limit = 25

	const columns = getColumns(t)

	const debouncedSearch = useDebounce(search, 300)

	const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
		setSorting(updater)
		setPage(1)
	}

	const { data, isLoading } = useQuery(
		trpc.contacts.list.queryOptions({
			search: debouncedSearch || undefined,
			status: status === 'all' ? undefined : status,
			sortBy: sorting[0]?.id,
			sortDir: sorting[0]?.desc ? 'desc' : 'asc',
			page,
			limit,
		}),
	)

	const table = useReactTable({
		data: data?.items ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualSorting: true,
		onSortingChange: handleSortingChange,
		state: {
			sorting,
		},
	})

	const totalPages = Math.ceil((data?.total ?? 0) / limit)

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
				<CreateContactDialog />
			</div>

			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder={t('searchPlaceholder')}
						className="pl-8"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value)
							setPage(1)
						}}
					/>
				</div>
				<Select
					value={status}
					onValueChange={(value) => {
						setStatus(value as ContactStatus | 'all')
						setPage(1)
					}}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder={t('filterByStatus')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t('allStatuses')}</SelectItem>
						{CONTACT_STATUS_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead 
										key={header.id}
										className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
										onClick={header.column.getToggleSortingHandler()}
									>
										<div className="flex items-center gap-1">
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
												  )}
											{header.column.getIsSorted() === 'asc' ? (
												<ChevronUp className="h-4 w-4" />
											) : header.column.getIsSorted() === 'desc' ? (
												<ChevronDown className="h-4 w-4" />
											) : header.column.getCanSort() ? (
												<ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
											) : null}
										</div>
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
									onClick={() => router.push(`/contacts/${row.original.id}`)}
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
									className="h-24 text-center"
								>
									{t('noResults')}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between">
				<div className="text-sm text-muted-foreground">
					{tTable('showing', {
						from: (page - 1) * limit + 1,
						to: Math.min(page * limit, data?.total ?? 0),
						total: data?.total ?? 0
					})}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1 || isLoading}
					>
						<ChevronLeft className="h-4 w-4 mr-1" />
						{tTable('previous')}
					</Button>
					<div className="text-sm font-medium">
						{t('pageCount', { page, total: Math.max(1, totalPages) })}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => p + 1)}
						disabled={page >= totalPages || isLoading}
					>
						{tTable('next')}
						<ChevronRight className="h-4 w-4 ml-1" />
					</Button>
				</div>
			</div>
		</div>
	)
}
