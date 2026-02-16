'use client'

import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GripVertical, Plus, Trash2, Edit2 } from 'lucide-react'
import { EditStageDialog } from './edit-stage-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Stage {
  id: string
  name: string
  position: number
  color: string
  isTerminal: boolean
  terminalType: string | null
}

interface StageEditorProps {
  pipelineId: string
}

export function StageEditor({ pipelineId }: StageEditorProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [stages, setStages] = useState<Stage[]>([])

  const { data, isLoading } = useQuery(
    trpc.pipelines.listStages.queryOptions({ pipelineId })
  )

  useEffect(() => {
    if (data) {
      setStages(data)
    }
  }, [data])

  const reorderMutation = useMutation(
    trpc.pipelines.reorderStages.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.pipelines.listStages.queryKey({ pipelineId }) })
        toast.success('Stages reordered')
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to reorder stages')
        // Revert local state on error
        if (data) setStages(data)
      },
    })
  )

  const deleteStageMutation = useMutation(
    trpc.pipelines.deleteStage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.pipelines.listStages.queryKey({ pipelineId }) })
        toast.success('Stage deleted')
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete stage')
      },
    })
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id)
      const newIndex = stages.findIndex((s) => s.id === over.id)
      
      const newStages = arrayMove(stages, oldIndex, newIndex)
      setStages(newStages)
      
      reorderMutation.mutate({
        pipelineId,
        stageIds: newStages.map((s) => s.id),
      })
    }
  }

  const handleDeleteStage = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the stage "${name}"?`)) {
      deleteStageMutation.mutate({ id })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Stages
        </h4>
        <EditStageDialog
          pipelineId={pipelineId}
          nextPosition={stages.length}
          trigger={
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Plus className="h-4 w-4" />
              Add Stage
            </Button>
          }
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {stages.map((stage) => (
              <SortableStageRow
                key={stage.id}
                stage={stage}
                pipelineId={pipelineId}
                onDelete={() => handleDeleteStage(stage.id, stage.name)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {stages.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
          <p className="text-sm text-muted-foreground">No stages defined for this pipeline.</p>
        </div>
      )}
    </div>
  )
}

interface SortableStageRowProps {
  stage: Stage
  pipelineId: string
  onDelete: () => void
}

function SortableStageRow({ stage, pipelineId, onDelete }: SortableStageRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm transition-colors",
        isDragging && "opacity-50 z-50 border-primary"
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div
        className="h-4 w-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: stage.color }}
      />

      <span className="font-medium flex-1">{stage.name}</span>

      {stage.isTerminal && (
        <Badge
          variant={
            stage.terminalType === 'won'
              ? 'default'
              : stage.terminalType === 'lost'
              ? 'destructive'
              : 'secondary'
          }
          className="capitalize"
        >
          {stage.terminalType}
        </Badge>
      )}

      <div className="flex items-center gap-1">
        <EditStageDialog
          pipelineId={pipelineId}
          stage={stage}
          nextPosition={stage.position}
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Edit2 className="h-4 w-4" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
