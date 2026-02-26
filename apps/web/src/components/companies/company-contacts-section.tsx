'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, User } from 'lucide-react'
import { AddContactRoleDialog } from './add-contact-role-dialog'
import Link from 'next/link'

interface CompanyContactsSectionProps {
	companyId: string
	roles: any[]
}

export function CompanyContactsSection({ companyId, roles }: CompanyContactsSectionProps) {
	const t = useTranslations('companies')
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const deleteMutation = useMutation(
		trpc.contactCompanyRoles.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.companies.getById.queryKey({ id: companyId }) })
				toast.success(t('removeContactSuccess'))
			},
			onError: (error) => {
				toast.error(error.message || t('removeContactError'))
			},
		}),
	)

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-bold">{t('contactsSection')}</CardTitle>
				<Button size="sm" variant="ghost" onClick={() => setIsAddDialogOpen(true)}>
					<Plus className="h-4 w-4" />
				</Button>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{roles.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t('noContacts')}</p>  
					) : (
						roles.map((role) => (
							<div key={role.id} className="flex items-center justify-between group">
								<div className="flex items-center gap-3">
									<div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
										<User className="h-4 w-4 text-muted-foreground" />
									</div>
									<div>
										<Link
											href={`/contacts/${role.contact.id}`}
											className="text-sm font-medium hover:underline"
										>
											{role.contact.firstName} {role.contact.lastName}
										</Link>
										<div className="flex items-center gap-2"> 
											<span className="text-xs text-muted-foreground capitalize">
												{role.role.replace('_', ' ')}
											</span>
											{role.isPrimary && (
												<Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
													Primary
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

			<AddContactRoleDialog
				companyId={companyId}
				open={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
			/>
		</Card>
	)
}
