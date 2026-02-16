'use client'

import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GitBranch, Plus, ChevronRight, Trash2, Edit } from 'lucide-react'
import { CreatePipelineDialog } from './create-pipeline-dialog'
import { StageEditor } from './stage-editor'
import { toast } from 'sonner'
import Link from 'next/link'

export function PipelinesSettingsClient() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    trpc.pipelines.list.queryOptions({ limit: 50 })
  )

  const deletePipelineMutation = useMutation(
    trpc.pipelines.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.pipelines.list.queryKey() })
        toast.success('Pipeline deleted')
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete pipeline')
      },
    })
  )

  const handleDeletePipeline = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete the pipeline "${name}"? This action cannot be undone.`)) {
      deletePipelineMutation.mutate({ id })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground">Settings</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Pipelines</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Settings</h1>
          <CreatePipelineDialog />
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : data?.items.length ? (
          <Accordion type="multiple" className="space-y-4">
            {data.items.map((pipeline) => (
              <AccordionItem
                key={pipeline.id}
                value={pipeline.id}
                className="border rounded-xl px-4 bg-card"
              >
                <div className="flex items-center justify-between">
                  <AccordionTrigger className="hover:no-underline flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <GitBranch className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{pipeline.name}</span>
                          {pipeline.isDefault && (
                            <Badge variant="secondary" className="font-normal">Default</Badge>
                          )}
                        </div>
                        {pipeline.description && (
                          <p className="text-sm text-muted-foreground font-normal line-clamp-1">
                            {pipeline.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeletePipeline(e, pipeline.id, pipeline.name)}
                      disabled={deletePipelineMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <AccordionContent className="pt-4 border-t">
                  <StageEditor pipelineId={pipeline.id} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-muted/30 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No pipelines configured</h3>
            <p className="text-muted-foreground mb-6">
              Create a pipeline to start managing your deal process.
            </p>
            <CreatePipelineDialog />
          </div>
        )}
      </div>
    </div>
  )
}
