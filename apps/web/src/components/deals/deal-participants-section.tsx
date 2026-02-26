'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, User, Building2 } from 'lucide-react'
import { DEAL_PARTICIPANT_ROLES } from '@crm/shared'
import { AddParticipantDialog } from './add-participant-dialog'
import { toast } from 'sonner'
import Link from 'next/link'

interface Participant {
  id: string
  dealId: string
  contactId: string | null
  companyId: string | null
  role: string
  isPrimary: boolean
  contact: { id: string; firstName: string; lastName: string; email: string | null } | null
  company: { id: string; name: string; entityType: string | null } | null
}

interface DealParticipantsSectionProps {
  dealId: string
  participants: Participant[]
}

export function DealParticipantsSection({ dealId, participants }: DealParticipantsSectionProps) {
  const t = useTranslations('deals')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.deals.deleteParticipant.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.deals.getById.queryKey({ id: dealId }) })
        toast.success(t('removeParticipantSuccess'))
      },
      onError: (error) => {
        toast.error(error.message || t('removeParticipantError'))
      },
    })
  )

  const handleDelete = (id: string, name: string) => {
    if (confirm(t('removeParticipantConfirm', { name }))) {
      deleteMutation.mutate({ id })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{t('participants')}</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('addParticipant')}
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {participants.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground italic border-2 border-dashed rounded-lg">     
              {t('noParticipants')}
            </div>
          ) : (
            participants.map((p) => {
              const roleLabel = DEAL_PARTICIPANT_ROLES.find(r => r.value === p.role)?.label || p.role
              const name = p.contact
                ? `${p.contact.firstName} ${p.contact.lastName}`
                : p.company?.name || 'Unknown'
              const href = p.contactId ? `/contacts/${p.contactId}` : `/companies/${p.companyId}`

              return (
                <div key={p.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">        
                      {p.contactId ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Link
                          href={href}
                          className="text-sm font-medium truncate hover:text-primary transition-colors"
                        >
                          {name}
                        </Link>
                        {p.isPrimary && (
                          <Badge className="text-[9px] py-0 px-1 bg-primary/10 text-primary border-primary/20">Primary</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{roleLabel}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(p.id, name)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </CardContent>

      <AddParticipantDialog
        dealId={dealId}
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
      />
    </Card>
  )
}
