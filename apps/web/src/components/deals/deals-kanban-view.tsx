'use client'

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DEAL_TYPES } from '@crm/shared'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Deal {
  id: string
  name: string
  dealType: string
  amount: string | null
  currency: string
  confidence: number | null
  currentStageId: string
  updatedAt: string | Date
}

interface StageWithDeals {
  id: string
  name: string
  color: string
  deals: Deal[]
}

interface DealsKanbanViewProps {
  pipelineId: string
  search?: string
}

export function DealsKanbanView({ pipelineId, search }: DealsKanbanViewProps) {
  const t = useTranslations('deals')
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)

  const { data, isLoading } = useQuery(
    trpc.deals.getForKanban.queryOptions({ pipelineId })
  )

  const moveToStageMutation = useMutation(
    trpc.deals.moveToStage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.deals.getForKanban.queryKey({ pipelineId }) })
        queryClient.invalidateQueries({ queryKey: trpc.deals.list.queryKey() })
      },
      onError: (error) => {
        toast.error(error.message || t('moveError'))
      },
    })
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const filteredStages = data?.stages.map(stage => ({
    ...stage,
    deals: stage.deals.filter(deal => 
      !search || deal.name.toLowerCase().includes(search.toLowerCase())
    )
  })) || []

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const dealId = active.id as string
    
    // Find the deal in our data
    for (const stage of filteredStages) {
      const deal = stage.deals.find(d => d.id === dealId)
      if (deal) {
        setActiveDeal(deal)
        break
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDeal(null)

    if (!over) return

    const dealId = active.id as string
    const overId = over.id as string

    // Find the target stage
    let toStageId: string | null = null
    
    // Case 1: Dropped over a stage column
    if (filteredStages.some(s => s.id === overId)) {
      toStageId = overId
    } 
    // Case 2: Dropped over another deal card
    else {
      for (const stage of filteredStages) {
        if (stage.deals.some(d => d.id === overId)) {
          toStageId = stage.id
          break
        }
      }
    }

    if (toStageId) {
      // Find current stage of the deal
      let fromStageId: string | null = null
      for (const stage of filteredStages) {
        if (stage.deals.some(d => d.id === dealId)) {
          fromStageId = stage.id
          break
        }
      }

      if (toStageId !== fromStageId) {
        moveToStageMutation.mutate({ dealId, toStageId })
        
        // Optimistic update
        queryClient.setQueryData(
          trpc.deals.getForKanban.queryKey({ pipelineId }),
          (old: any) => {
            if (!old) return old
            return {
              ...old,
              stages: old.stages.map((s: any) => {
                if (s.id === fromStageId) {
                  return { ...s, deals: s.deals.filter((d: any) => d.id !== dealId) }
                }
                if (s.id === toStageId) {
                  const deal = activeDeal || old.stages.find((fs: any) => fs.id === fromStageId)?.deals.find((d: any) => d.id === dealId)
                  return { ...s, deals: [deal, ...s.deals] }
                }
                return s
              })
            }
          }
        )
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-80 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] items-start">
        {filteredStages.map((stage) => (
          <KanbanColumn key={stage.id} stage={stage} />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="w-80 opacity-80 cursor-grabbing">
            <DealCard deal={activeDeal} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({ stage }: { stage: StageWithDeals }) {
  const t = useTranslations('deals')
  return (
    <div className="flex-shrink-0 w-80 flex flex-col max-h-full bg-muted/30 rounded-lg border overflow-hidden">
      <div 
        className="p-3 border-b flex items-center justify-between"
        style={{ borderTop: `3px solid ${stage.color}` }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <Badge variant="secondary" className="px-1.5 py-0 h-5 min-w-[20px] justify-center">
            {stage.deals.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext
          id={stage.id}
          items={stage.deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {stage.deals.map((deal) => (
            <SortableDealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
        
        {/* Empty area drop zone */}
        {stage.deals.length === 0 && (
          <div className="h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-xs">
            {t('dropDealsHere')}
          </div>
        )}
      </div>
    </div>
  )
}

function SortableDealCard({ deal }: { deal: Deal }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-30")}
      {...attributes}
      {...listeners}
    >
      <DealCard deal={deal} />
    </div>
  )
}

function DealCard({ deal, isOverlay }: { deal: Deal; isOverlay?: boolean }) {
  const t = useTranslations('deals')
  const router = useRouter()
  const typeLabel = DEAL_TYPES.find(t => t.value === deal.dealType)?.label || deal.dealType

  const formatAmount = (amount: string | null, currency: string) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount))
  }

  const amountStr = formatAmount(deal.amount, deal.currency)

  return (
    <div 
      className={cn(
        "bg-card p-3 rounded-lg border shadow-sm hover:border-primary transition-colors cursor-pointer group",
        isOverlay && "border-primary shadow-md"
      )}
      onClick={() => router.push(`/deals/${deal.id}`)}
    >
      <div className="flex flex-col gap-2">
        <div className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
          {deal.name}
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal uppercase tracking-wider bg-muted/50">
            {typeLabel}
          </Badge>
          {amountStr && (
            <span className="text-xs font-semibold">{amountStr}</span>
          )}
        </div>

        {deal.confidence !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{t('confidence')}</span>
              <span>{deal.confidence}%</span>
            </div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${deal.confidence}%` }} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
