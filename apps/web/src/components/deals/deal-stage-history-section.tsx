'use client'

import { useTranslations } from 'next-intl'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { GitBranch, ChevronRight } from 'lucide-react'

interface StageHistoryEntry {
  id: string
  dealId: string
  fromStageId: string | null
  toStageId: string
  movedAt: string | Date
  movedBy: string
}

interface DealStageHistorySectionProps {
  dealId: string
  stageHistory: StageHistoryEntry[]
  pipelineId: string
}

export function DealStageHistorySection({ stageHistory, pipelineId }: DealStageHistorySectionProps) {
  const t = useTranslations('deals')
  const trpc = useTRPC()

  const { data: stages } = useQuery(
    trpc.pipelines.listStages.queryOptions({ pipelineId })
  )

  const getStageName = (id: string | null) => {
    if (!id) return t('created')
    const stage = stages?.find(s => s.id === id)
    return stage?.name || 'Unknown'
  }

  const getStageColor = (id: string) => {
    const stage = stages?.find(s => s.id === id)
    return stage?.color || '#6B7280'
  }

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{t('stageHistory')}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-6">
        <div className="space-y-6">
          {stageHistory.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground italic">
              {t('noHistory')}
            </div>
          ) : (
            <div className="relative space-y-4">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-muted" />

              {stageHistory.map((entry, idx) => (
                <div key={entry.id} className="relative pl-8">
                  {/* Dot */}
                  <div
                    className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-background flex items-center justify-center z-10"
                    style={{ backgroundColor: getStageColor(entry.toStageId) }}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                      <span className="text-muted-foreground font-normal italic">
                        {getStageName(entry.fromStageId)}
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span>{getStageName(entry.toStageId)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {format(new Date(entry.movedAt), 'MMM d, yyyy · h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
