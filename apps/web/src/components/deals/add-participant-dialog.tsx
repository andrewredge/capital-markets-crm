'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  createDealParticipantSchema, 
  DEAL_PARTICIPANT_ROLES 
} from '@crm/shared'
import { z } from 'zod'

// Strip refine for RHF
const participantFormSchema = createDealParticipantSchema.innerType()
type ParticipantFormValues = z.infer<typeof participantFormSchema>

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
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, User, Building2, Check } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AddParticipantDialogProps {
  dealId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddParticipantDialog({ dealId, open, onOpenChange }: AddParticipantDialogProps) {
  const [entityType, setEntityType] = useState<'contact' | 'company'>('contact')
  const [search, setSearch] = useState('')
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: contacts, isLoading: isLoadingContacts } = useQuery(
    trpc.contacts.list.queryOptions(
      { search: debouncedSearch, limit: 10 },
      { enabled: entityType === 'contact' }
    )
  )

  const { data: companies, isLoading: isLoadingCompanies } = useQuery(
    trpc.companies.list.queryOptions(
      { search: debouncedSearch, limit: 10 },
      { enabled: entityType === 'company' }
    )
  )

  const form = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantFormSchema) as any,
    defaultValues: {
      dealId,
      role: 'investor',
      isPrimary: false,
    },
  })

  const createMutation = useMutation(
    trpc.deals.createParticipant.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.deals.getById.queryKey({ id: dealId }) })
        toast.success('Participant added')
        onOpenChange(false)
        resetForm()
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to add participant')
      },
    })
  )

  const resetForm = () => {
    setSelectedEntityId(null)
    setSearch('')
    form.reset({
      dealId,
      role: 'investor',
      isPrimary: false,
    })
  }

  function onSubmit(data: ParticipantFormValues) {
    if (!selectedEntityId) {
      toast.error(`Please select a ${entityType}`)
      return
    }

    createMutation.mutate({
      ...data,
      contactId: entityType === 'contact' ? selectedEntityId : undefined,
      companyId: entityType === 'company' ? selectedEntityId : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) resetForm()
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogDescription>
            Add a contact or company to this deal with a specific role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Tabs value={entityType} onValueChange={(v) => {
            setEntityType(v as 'contact' | 'company')
            setSelectedEntityId(null)
            setSearch('')
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <FormLabel>{entityType === 'contact' ? 'Search Contacts' : 'Search Companies'}</FormLabel>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search by name...`}
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="max-h-[200px] overflow-y-auto border rounded-md mt-2">
              {entityType === 'contact' ? (
                <div className="p-1">
                  {isLoadingContacts ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                  ) : contacts?.items.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No contacts found</div>
                  ) : (
                    contacts?.items.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => setSelectedEntityId(contact.id)}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 text-sm rounded-sm hover:bg-muted transition-colors text-left",
                          selectedEntityId === contact.id && "bg-primary/5 text-primary"
                        )}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{contact.firstName} {contact.lastName}</span>
                        </div>
                        {selectedEntityId === contact.id && <Check className="h-4 w-4" />}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-1">
                  {isLoadingCompanies ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                  ) : companies?.items.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No companies found</div>
                  ) : (
                    companies?.items.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => setSelectedEntityId(company.id)}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 text-sm rounded-sm hover:bg-muted transition-colors text-left",
                          selectedEntityId === company.id && "bg-primary/5 text-primary"
                        )}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{company.name}</span>
                        </div>
                        {selectedEntityId === company.id && <Check className="h-4 w-4" />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEAL_PARTICIPANT_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
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
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Primary Participant</FormLabel>
                      <div className="text-[11px] text-muted-foreground">
                        Set as the main contact for this deal
                      </div>
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

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || !selectedEntityId}>
                  {createMutation.isPending ? 'Adding...' : 'Add Participant'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
