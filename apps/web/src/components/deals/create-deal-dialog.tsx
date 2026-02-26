'use client'

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDealSchema,
  type CreateDealInput,
  DEAL_TYPES
} from '@crm/shared'
import { z } from 'zod'

// Form schema to handle datetime-local input
const dealFormSchema = createDealSchema.extend({
  expectedCloseDate: z.string().optional().nullable(),
})
type DealFormValues = z.infer<typeof dealFormSchema>

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CreateDealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPipelineId?: string
}

export function CreateDealDialog({
  open,
  onOpenChange,
  defaultPipelineId
}: CreateDealDialogProps) {
  const t = useTranslations('deals')
  const tActions = useTranslations('actions')
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema) as any,
    defaultValues: {
      name: '',
      pipelineId: defaultPipelineId || '',
      currentStageId: '',
      dealType: 'venture_investment',
      amount: null,
      currency: 'USD',
      confidence: null,
      description: '',
      expectedCloseDate: null,
    },
  })

  const selectedPipelineId = form.watch('pipelineId')

  // Fetch pipelines for selector
  const { data: pipelines } = useQuery(
    trpc.pipelines.list.queryOptions({ limit: 50 })
  )

  // Fetch stages for selected pipeline
  const { data: stages, isLoading: isLoadingStages } = useQuery(
    trpc.pipelines.listStages.queryOptions(
      { pipelineId: selectedPipelineId },
      { enabled: !!selectedPipelineId }
    )
  )

  // Reset stage when pipeline changes
  useEffect(() => {
    if (stages?.length) {
      const firstActive = stages.find(s => !s.isTerminal) || stages[0]
      if (firstActive) {
        form.setValue('currentStageId', firstActive.id)
      }
    } else {
      form.setValue('currentStageId', '')
    }
  }, [stages, form])

  // Set default pipeline if provided
  useEffect(() => {
    if (defaultPipelineId && !form.getValues('pipelineId')) {
      form.setValue('pipelineId', defaultPipelineId)
    }
  }, [defaultPipelineId, form])

  const createMutation = useMutation(
    trpc.deals.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.deals.list.queryKey() })
        queryClient.invalidateQueries({ queryKey: trpc.deals.getForKanban.queryKey() })
        toast.success(t('createSuccess'))
        onOpenChange(false)
        form.reset()
      },
      onError: (error) => {
        toast.error(error.message || t('createError'))
      },
    })
  )

  function onSubmit(data: DealFormValues) {
    createMutation.mutate({
      ...data,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate).toISOString() : null,
    } as CreateDealInput)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createTitle')}</DialogTitle>
          <DialogDescription>
            {t('createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pipelineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.pipeline')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.selectPipeline')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pipelines?.items.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentStageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.initialStage')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedPipelineId || isLoadingStages}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.selectStage')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dealType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.type')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEAL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.amount')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.currency')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expectedCloseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.expectedClose')}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.confidence')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('form.confidencePlaceholder')}
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('form.descriptionPlaceholder')}
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                {tActions('cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? tActions('saving') : t('createTitle')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
