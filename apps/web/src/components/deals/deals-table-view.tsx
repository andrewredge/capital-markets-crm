'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
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
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { DEAL_TYPES } from '@crm/shared'
import { format } from 'date-fns'

interface DealRow {
  id: string
  name: string
  dealType: string
  amount: string | null
  currency: string
  currentStageId: string
  stageName: string | null
  stageColor: string | null
  pipelineName: string | null
  confidence: number | null
  expectedCloseDate: string | Date | null
  createdAt: string | Date
}

interface DealsTableViewProps {
  pipelineId: string
  search?: string
}

const columnHelper = createColumnHelper<DealRow>()

function formatCurrency(amount: string | null, currency: string) {
  if (!amount) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor('dealType', {
    header: 'Type',
    cell: (info) => {
      const type = DEAL_TYPES.find((t) => t.value === info.getValue())
      return <Badge variant="secondary">{type?.label || info.getValue()}</Badge>
    },
  }),
  columnHelper.accessor('amount', {
    header: 'Amount',
    cell: (info) => formatCurrency(info.getValue(), info.row.original.currency),
  }),
  columnHelper.accessor('stageName', {
    header: 'Stage',
    cell: (info) => (
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: info.row.original.stageColor || '#6B7280' }}
        />
        <span>{info.getValue() || '—'}</span>
      </div>
    ),
  }),
  columnHelper.accessor('confidence', {
    header: 'Confidence',
    cell: (info) => {
      const val = info.getValue()
      return val !== null ? `${val}%` : '—'
    },
  }),
  columnHelper.accessor('expectedCloseDate', {
    header: 'Expected Close',
    cell: (info) => {
      const date = info.getValue()
      return date ? format(new Date(date), 'MMM d, yyyy') : '—'
    },
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => format(new Date(info.getValue()), 'MMM d, yyyy'),
  }),
]

export function DealsTableView({ pipelineId, search }: DealsTableViewProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const limit = 25

  const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
    setSorting(updater)
    setPage(1)
  }

  const { data, isLoading } = useQuery(
    trpc.deals.list.queryOptions({
      pipelineId,
      search,
      sortBy: sorting[0]?.id,
      sortDir: sorting[0]?.desc ? 'desc' : 'asc',
      page,
      limit,
    })
  )

  const table = useReactTable({
    data: (data?.items as any) ?? [],
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
      <div className="rounded-md border bg-card">
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
                            header.getContext()
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
                  onClick={() => router.push(`/deals/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
                  No deals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {data?.items.length ?? 0} of {data?.total ?? 0} deals
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
          <div className="text-sm font-medium px-2">
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
    </div>
  )
}
