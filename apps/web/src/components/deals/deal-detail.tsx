'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Edit,
  DollarSign,
  TrendingUp,
  User,
  Clock,
  Briefcase,
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { EditDealDialog } from './edit-deal-dialog'
import { DealParticipantsSection } from './deal-participants-section'
import { DealStageHistorySection } from './deal-stage-history-section'
import { ActivityTimeline } from '@/components/shared/activity-timeline'
import { NotesSection } from '@/components/shared/notes-section'
import { DocumentsSection } from '@/components/shared/documents-section'
import { format } from 'date-fns'
import { DEAL_TYPES } from '@crm/shared'

interface DealDetailProps {
  id: string
}

export function DealDetail({ id }: DealDetailProps) {
  const t = useTranslations('deals')
  const tNav = useTranslations('nav')
  const tActions = useTranslations('actions')
  const router = useRouter()
  const trpc = useTRPC()
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { data: deal, isLoading, error } = useQuery(
    trpc.deals.getById.queryOptions({ id })
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-xl font-semibold">{t('notFound')}</h2>
        <Button variant="outline" asChild>
          <Link href="/deals">{t('backToDeals')}</Link>
        </Button>
      </div>
    )
  }

  const dealTypeLabel = DEAL_TYPES.find((t) => t.value === deal.dealType)?.label || deal.dealType

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{tNav('dashboard')}</Link>
        <span>/</span>
        <Link href="/deals" className="hover:text-foreground">{tNav('deals')}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{deal.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded bg-primary/10 flex items-center justify-center text-primary">
            <Briefcase className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{deal.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: deal.currentStage?.color || '#6B7280' }}
                />
                <span className="text-sm font-medium">{deal.currentStage?.name}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <Badge variant="secondary" className="font-normal">{dealTypeLabel}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {tActions('edit')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('info')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-tight">{t('amount')}</div>
                      <div className="text-lg font-semibold">
                        {deal.amount
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: deal.currency,
                              minimumFractionDigits: 0,
                            }).format(Number(deal.amount))
                          : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-tight">{t('expectedClose')}</div>
                      <div className="text-sm font-medium">
                        {deal.expectedCloseDate
                          ? format(new Date(deal.expectedCloseDate), 'MMMM d, yyyy')
                          : '—'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-tight">{t('confidence')}</div>
                      <div className="text-sm font-medium">
                        {deal.confidence !== null ? `${deal.confidence}%` : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-tight">{t('created')}</div>
                      <div className="text-sm">
                        {format(new Date(deal.createdAt), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-tight">{t('owner')}</div>
                      <div className="text-sm">
                        {/* In a real app we'd fetch the owner name. For now using ID or a placeholder */}
                        System User
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ActivityTimeline dealId={deal.id} />

          <NotesSection dealId={deal.id} />
          <DocumentsSection dealId={deal.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <DealParticipantsSection
            dealId={deal.id}
            participants={deal.participants || []}
          />

          <DealStageHistorySection
            dealId={deal.id}
            stageHistory={deal.stageHistory || []}
            pipelineId={deal.pipelineId}
          />
        </div>
      </div>

      <EditDealDialog
        deal={deal}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </div>
  )
}
