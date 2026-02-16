'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  updateDealSchema, 
  type UpdateDealInput,
  DEAL_TYPES 
} from '@crm/shared'
import { z } from 'zod'

// Form schema to handle datetime-local input
const dealFormSchema = updateDealSchema.extend({
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
import { useEffect } from 'react'

interface EditDealDialogProps {
  deal: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDealDialog({ 
  deal, 
  open, 
  onOpenChange 
}: EditDealDialogProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema) as any,
    defaultValues: {
      name: deal?.name || '',
      currentStageId: deal?.currentStageId || '',
      dealType: deal?.dealType || 'venture_investment',
      amount: deal?.amount ? parseFloat(deal.amount) : null,
      currency: deal?.currency || 'USD',
      confidence: deal?.confidence || null,
      description: deal?.description || '',
      expectedCloseDate: deal?.expectedCloseDate 
        ? new Date(deal.expectedCloseDate).toISOString().slice(0, 16) 
        : null,
    },
  })

  // Update form when deal changes
  useEffect(() => {
    if (deal && open) {
      form.reset({
        name: deal.name,
        currentStageId: deal.currentStageId,
        dealType: deal.dealType,
        amount: deal.amount ? parseFloat(deal.amount) : null,
        currency: deal.currency,
        confidence: deal.confidence,
        description: deal.description || '',
        expectedCloseDate: deal.expectedCloseDate 
          ? new Date(deal.expectedCloseDate).toISOString().slice(0, 16) 
          : null,
      })
    }
  }, [deal, open, form])

  // Fetch stages for deal's pipeline
  const { data: stages, isLoading: isLoadingStages } = useQuery(
    trpc.pipelines.listStages.queryOptions(
      { pipelineId: deal?.pipelineId },
      { enabled: !!deal?.pipelineId && open }
    )
  )

  const updateMutation = useMutation(
    trpc.deals.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.deals.getById.queryKey({ id: deal.id }) })
        queryClient.invalidateQueries({ queryKey: trpc.deals.list.queryKey() })
        queryClient.invalidateQueries({ queryKey: trpc.deals.getForKanban.queryKey() })
        toast.success('Deal updated')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update deal')
      },
    })
  )

  function onSubmit(data: DealFormValues) {
    updateMutation.mutate({
      id: deal.id,
      ...data,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate).toISOString() : null,
    } as any)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
          <DialogDescription>
            Update the deal information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Series A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Pipeline</FormLabel>
                <Input value={deal?.pipeline?.name || ''} disabled className="bg-muted/50" />
                <p className="text-[10px] text-muted-foreground mt-1">Pipeline cannot be changed after creation.</p>
              </FormItem>

              <FormField
                control={form.control}
                name="currentStageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoadingStages}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages?.map((s: any) => (
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
                    <FormLabel>Deal Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
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
                        <FormLabel>Amount</FormLabel>
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
                      <FormLabel>Currency</FormLabel>
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
                    <FormLabel>Expected Close</FormLabel>
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
                    <FormLabel>Confidence (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0-100"
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional deal details..." 
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
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
