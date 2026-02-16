'use client'

import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Edit, 
  Trash2, 
  ChevronRight, 
  GitBranch, 
  TrendingUp, 
  Calendar,
  DollarSign,
  User,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { DEAL_TYPES } from '@crm/shared'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'
import { ActivityTimeline } from '@/components/shared/activity-timeline'
import { NotesSection } from '@/components/shared/notes-section'
import { EntityTags } from '@/components/shared/entity-tags'
import { DealParticipantsSection } from './deal-participants-section'
import { DealStageHistorySection } from './deal-stage-history-section'
import { EditDealDialog } from './edit-deal-dialog'
import Link from 'next/link'

interface DealDetailProps {
  id: string
}

export function DealDetail({ id }: DealDetailProps) {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { data: deal, isLoading, error } = useQuery(
    trpc.deals.getById.queryOptions({ id })
  )

  const deleteMutation = useMutation(
    trpc.deals.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.deals.list.queryKey() })
        toast.success('Deal deleted')
        router.push('/deals')
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete deal')
      },
    })
  )

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this deal?')) {
      deleteMutation.mutate({ id })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="p-12 text-center border rounded-xl bg-muted/30">
        <h3 className="text-lg font-medium">Deal not found</h3>
        <p className="text-muted-foreground mb-4">The deal you are looking for does not exist or has been deleted.</p>
        <Button onClick={() => router.push('/deals')}>Back to Deals</Button>
      </div>
    )
  }

  const typeLabel = DEAL_TYPES.find(t => t.value === deal.dealType)?.label || deal.dealType

  const formatAmount = (amount: string | null, currency: string) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount))
  }

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/deals" className="hover:text-foreground">Deals</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{deal.name}</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{deal.name}</h1>
              <Badge 
                variant="outline" 
                className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-sm"
              >
                {deal.currentStage?.name}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1 text-sm font-normal">
                {typeLabel}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <GitBranch className="h-4 w-4" />
                <span>{deal.pipeline?.name}</span>
              </div>
              {deal.amount && (
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatAmount(deal.amount, deal.currency)}</span>
                </div>
              )}
              {deal.confidence !== null && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  <span>{deal.confidence}% Confidence</span>
                </div>
              )}
            </div>
            <div className="mt-1">
              <EntityTags dealId={deal.id} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tight">Description</div>
                    <p className="text-sm whitespace-pre-wrap">
                      {deal.description || <span className="text-muted-foreground italic">No description provided.</span>}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-tight">Expected Close</div>
                      <div className="text-sm font-medium">
                        {deal.expectedCloseDate 
                          ? format(new Date(deal.expectedCloseDate), 'MMMM d, yyyy') 
                          : <span className="text-muted-foreground font-normal">Not set</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-tight">Created</div>
                      <div className="text-sm">
                        {format(new Date(deal.createdAt), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-tight">Deal Owner</div>
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
