'use client'

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { useDealsViewStore } from '@/stores/deals-view-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Kanban, Table as TableIcon, Plus } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { CreateDealDialog } from './create-deal-dialog'
import { DealsTableView } from './deals-table-view'
import { DealsKanbanView } from './deals-kanban-view'
import { Skeleton } from '@/components/ui/skeleton'

export function DealsPageClient() {
  const t = useTranslations('deals')
  const trpc = useTRPC()
  const { view, setView } = useDealsViewStore()
  const [pipelineId, setPipelineId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data: pipelines, isLoading: isLoadingPipelines } = useQuery(
    trpc.pipelines.list.queryOptions({ limit: 50 })
  )

  useEffect(() => {
    if (pipelines?.items.length && !pipelineId) {
      const defaultPipeline = pipelines.items.find(p => p.isDefault) || pipelines.items[0]
      if (defaultPipeline) {
        setPipelineId(defaultPipeline.id)
      }
    }
  }, [pipelines, pipelineId])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
          {isLoadingPipelines ? (
            <Skeleton className="h-10 w-[200px]" />
          ) : (
            <Select
              value={pipelineId || undefined}
              onValueChange={setPipelineId}
            >
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder={t('selectPipeline')} />
              </SelectTrigger>
              <SelectContent>
                {pipelines?.items.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              className="pl-8 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'table')}>
            <TabsList className="h-9">
              <TabsTrigger value="kanban" className="px-3">
                <Kanban className="h-4 w-4 mr-2" />
                {t('kanbanView')}
              </TabsTrigger>
              <TabsTrigger value="table" className="px-3">
                <TableIcon className="h-4 w-4 mr-2" />
                {t('tableView')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button size="sm" className="h-9" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newDeal')}
          </Button>
        </div>
      </div>

      {!pipelineId && !isLoadingPipelines ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-muted/30 text-center">
          <h3 className="text-lg font-medium">{t('noPipelines')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('noPipelinesMessage')}
          </p>
        </div>
      ) : pipelineId ? (
        <>
          {view === 'kanban' ? (
            <DealsKanbanView pipelineId={pipelineId} search={debouncedSearch} />
          ) : (
            <DealsTableView pipelineId={pipelineId} search={debouncedSearch} />
          )}
        </>
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      )}

      <CreateDealDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        defaultPipelineId={pipelineId || undefined}
      />
    </div>
  )
}
