'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  createStageSchema, 
  updateStageSchema,
  type CreateStageInput,
  type UpdateStageInput,
  TAG_COLOR_OPTIONS,
  TERMINAL_TYPES
} from '@crm/shared'
import { cn } from '@/lib/utils'

interface EditStageDialogProps {
  pipelineId: string
  stage?: {
    id: string
    name: string
    color: string
    isTerminal: boolean
    terminalType: string | null
  }
  nextPosition: number
  trigger: ReactNode
}

export function EditStageDialog({ pipelineId, stage, nextPosition, trigger }: EditStageDialogProps) {
  const [open, setOpen] = useState(false)
  const isEdit = !!stage
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm<any>({
    resolver: zodResolver(isEdit ? updateStageSchema : createStageSchema) as any,
    defaultValues: {
      name: stage?.name ?? '',
      color: stage?.color ?? '#3B82F6',
      isTerminal: stage?.isTerminal ?? false,
      terminalType: stage?.terminalType ?? null,
    },
  })

  const isTerminal = form.watch('isTerminal')

  useEffect(() => {
    if (!isTerminal) {
      form.setValue('terminalType', null)
    } else if (!form.getValues('terminalType')) {
      form.setValue('terminalType', 'won')
    }
  }, [isTerminal, form])

  const createMutation = useMutation(
    trpc.pipelines.createStage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.pipelines.listStages.queryKey({ pipelineId }) })
        toast.success('Stage created')
        setOpen(false)
        form.reset()
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create stage')
      },
    })
  )

  const updateMutation = useMutation(
    trpc.pipelines.updateStage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.pipelines.listStages.queryKey({ pipelineId }) })
        toast.success('Stage updated')
        setOpen(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update stage')
      },
    })
  )

  function onSubmit(values: any) {
    if (isEdit) {
      updateMutation.mutate({
        id: stage.id,
        ...values,
      })
    } else {
      createMutation.mutate({
        pipelineId,
        position: nextPosition,
        ...values,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Stage' : 'Add Stage'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Modify the properties of this pipeline stage.' 
              : 'Add a new stage to this pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Discovery" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {TAG_COLOR_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={cn(
                          'h-8 w-8 rounded-full border-2 transition-all hover:scale-110',
                          field.value === value ? 'border-foreground ring-2 ring-ring ring-offset-2' : 'border-transparent'
                        )}
                        style={{ backgroundColor: value }}
                        title={label}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <FormField
                control={form.control}
                name="isTerminal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Terminal Stage</FormLabel>
                      <FormDescription className="text-xs">
                        Deals in this stage are considered closed.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isTerminal && (
                <FormField
                  control={form.control}
                  name="terminalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outcome Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select outcome type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TERMINAL_TYPES.map((type) => (
                            <SelectItem key={type} value={type} className="capitalize">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending 
                  ? (isEdit ? 'Saving...' : 'Adding...') 
                  : (isEdit ? 'Save Changes' : 'Add Stage')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
