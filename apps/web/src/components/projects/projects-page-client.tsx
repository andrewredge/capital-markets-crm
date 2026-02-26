'use client'

import { useState } from 'react'
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	type SortingState,
} from '@tanstack/react-table'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	ChevronLeft,
	ChevronRight,
	Plus,
	Search,
	Mountain,
	ChevronUp,
	ChevronDown,
	ChevronsUpDown,
} from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { columns } from './projects-columns'
import { CreateProjectDialog } from './create-project-dialog'
import { PROJECT_STATUS_OPTIONS, COMMODITY_OPTIONS } from '@crm/shared'

export function ProjectsPageClient() {
	const trpc = useTRPC()
	const router = useRouter()
	const [page, setPage] = useState(1)
	const [limit] = useState(25)
	const [search, setSearch] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [commodityFilter, setCommodityFilter] = useState<string>('all')
	const [sorting, setSorting] = useState<SortingState>([])
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

	const debouncedSearch = useDebounce(search, 300)

	const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
		setSorting(updater)
		setPage(1)
	}

	const { data, isLoading } = useQuery(
		trpc.projects.list.queryOptions({
			search: debouncedSearch || undefined,
			projectStatus: statusFilter === 'all' ? undefined : (statusFilter as any),
			primaryCommodity: commodityFilter === 'all' ? undefined : (commodityFilter as any),
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
		<div className="space-y-4 p-8">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Mountain className="h-8 w-8 text-primary" />
					<h1 className="text-3xl font-bold tracking-tight">Projects</h1>
				</div>
				<Button onClick={() => setIsCreateDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Create Project
				</Button>
			</div>

			<div className="flex items-center gap-4 py-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search projects..."
						className="pl-8"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value)
							setPage(1)
						}}
					/>
				</div>
				<Select
					value={statusFilter}
					onValueChange={(value) => {
						setStatusFilter(value)
						setPage(1)
					}}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="All Statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						{PROJECT_STATUS_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={commodityFilter}
					onValueChange={(value) => {
						setCommodityFilter(value)
						setPage(1)
					}}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="All Commodities" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Commodities</SelectItem>
						{COMMODITY_OPTIONS.map((option) => (
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
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									Loading...
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="cursor-pointer"
									onClick={() => router.push(`/projects/${row.original.id}`)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between py-4">
				<div className="text-sm text-muted-foreground">
					Total: {data?.total ?? 0} projects
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
					>
						<ChevronLeft className="h-4 w-4" />
						Previous
					</Button>
					<div className="text-sm font-medium">
						Page {page} of {totalPages || 1}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page === totalPages || totalPages === 0}
					>
						Next
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<CreateProjectDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
			/>
		</div>
	)
}
