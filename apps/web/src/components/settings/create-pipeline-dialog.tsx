'use client'

import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { 
  createPipelineSchema, 
  type CreatePipelineInput,
  DEFAULT_VC_PIPELINE_STAGES 
} from '@crm/shared'

export function CreatePipelineDialog() {
  const [open, setOpen] = useState(false)
  const [seedStages, setSeedStages] = useState(true)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm<CreatePipelineInput>({
    resolver: zodResolver(createPipelineSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      isDefault: false,
    },
  })

  const createStageMutation = useMutation(
    trpc.pipelines.createStage.mutationOptions()
  )

  const createPipelineMutation = useMutation(
    trpc.pipelines.create.mutationOptions({
      onSuccess: async (pipeline) => {
        if (!pipeline) return;
        if (seedStages) {
          try {
            // Create default stages sequentially to maintain order and avoid race conditions
            for (const stage of DEFAULT_VC_PIPELINE_STAGES) {
              await createStageMutation.mutateAsync({
                pipelineId: pipeline.id,
                ...stage,
              })
            }
            toast.success('Pipeline created with default stages')
          } catch (error) {
            console.error('Failed to seed stages:', error)
            toast.error('Pipeline created, but failed to seed some stages')
          }
        } else {
          toast.success('Pipeline created')
        }

        queryClient.invalidateQueries({ queryKey: trpc.pipelines.list.queryKey() })
        setOpen(false)
        form.reset()
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create pipeline')
      },
    })
  )

  function onSubmit(values: CreatePipelineInput) {
    createPipelineMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Pipeline</DialogTitle>
          <DialogDescription>
            Add a new pipeline to manage a different business process.
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
                    <Input placeholder="e.g. Venture Fund II" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional description of this pipeline's purpose" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Default Pipeline</FormLabel>
                    <FormDescription>
                      Make this the default pipeline for new deals.
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

            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 bg-muted/50">
              <Checkbox
                id="seed-stages"
                checked={seedStages}
                onCheckedChange={(checked) => setSeedStages(!!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="seed-stages"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Seed with default VC stages
                </label>
                <p className="text-sm text-muted-foreground">
                  Automatically create Sourced, First Meeting, DD, IC Review, etc.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createPipelineMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPipelineMutation.isPending}>
                {createPipelineMutation.isPending ? 'Creating...' : 'Create Pipeline'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
