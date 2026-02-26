'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Building2 } from 'lucide-react'
import { AddCompanyRoleDialog } from './add-company-role-dialog'
import Link from 'next/link'

interface ContactCompanyRolesSectionProps {
	contactId: string
	roles: any[]
}

export function ContactCompanyRolesSection({ contactId, roles }: ContactCompanyRolesSectionProps) {
	const t = useTranslations('contacts')
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const deleteMutation = useMutation(
		trpc.contactCompanyRoles.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.contacts.getById.queryKey({ id: contactId }) })
				toast.success(t('removeRoleSuccess'))
			},
			onError: (error) => {
				toast.error(error.message || t('removeRoleError'))
			},
		}),
	)

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-bold">{t('companiesSection')}</CardTitle>
				<Button size="sm" variant="ghost" onClick={() => setIsAddDialogOpen(true)}>
					<Plus className="h-4 w-4" />
				</Button>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{roles.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t('noCompanies')}</p> 
					) : (
						roles.map((role) => (
							<div key={role.id} className="flex items-center justify-between group">
								<div className="flex items-center gap-3">
									<div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
										<Building2 className="h-4 w-4 text-muted-foreground" />
									</div>
									<div>
										<Link
											href={`/companies/${role.company.id}`}
											className="text-sm font-medium hover:underline"
										>
											{role.company.name}
										</Link>
										<div className="flex items-center gap-2"> 
											<span className="text-xs text-muted-foreground capitalize">
												{role.role.replace('_', ' ')}
											</span>
											{role.isPrimary && (
												<Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
													{t('primary')}
												</Badge>
											)}
										</div>
									</div>
								</div>
								<Button
									size="icon"
									variant="ghost"
									className="h-8 w-8 opacity-0 group-hover:opacity-100"
									onClick={() => deleteMutation.mutate({ id: role.id })}
									disabled={deleteMutation.isPending}
								>
									<Trash2 className="h-4 w-4 text-destructive" />   
								</Button>
							</div>
						))
					)}
				</div>
			</CardContent>

			<AddCompanyRoleDialog
				contactId={contactId}
				open={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
			/>
		</Card>
	)
}
