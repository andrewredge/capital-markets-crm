'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react'
import { AddRelationshipDialog } from './add-relationship-dialog'
import Link from 'next/link'

interface CompanyRelationshipsSectionProps {
	companyId: string
	relationshipsFrom: any[]
	relationshipsTo: any[]
}

export function CompanyRelationshipsSection({
	companyId,
	relationshipsFrom,
	relationshipsTo,
}: CompanyRelationshipsSectionProps) {
	const t = useTranslations('companies')
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const deleteMutation = useMutation(
		trpc.companyRelationships.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.companies.getById.queryKey({ id: companyId }) })
				toast.success(t('removeRelationshipSuccess'))
			},
			onError: (error) => {
				toast.error(error.message || t('removeRelationshipError'))
			},
		}),
	)

	const allRelationships = [
		...relationshipsFrom.map(r => ({ ...r, relatedCompany: r.toCompany, direction: 'from' })),
		...relationshipsTo.map(r => ({ ...r, relatedCompany: r.fromCompany, direction: 'to' })),
	]

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-bold">{t('relationshipsSection')}</CardTitle>
				<Button size="sm" variant="ghost" onClick={() => setIsAddDialogOpen(true)}>
					<Plus className="h-4 w-4" />
				</Button>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{allRelationships.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t('noRelationships')}</p>        
					) : (
						allRelationships.map((rel) => (
							<div key={rel.id} className="flex items-center justify-between group">
								<div className="flex items-center gap-3">
									<div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
										<LinkIcon className="h-4 w-4 text-muted-foreground" />
									</div>
									<div>
										<Link
											href={`/companies/${rel.relatedCompany.id}`}
											className="text-sm font-medium hover:underline"
										>
											{rel.relatedCompany.name}
										</Link>
										<div className="flex items-center gap-2"> 
											<Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
												{rel.relationshipType.replace('_', ' ')}
											</Badge>
										</div>
									</div>
								</div>
								<Button
									size="icon"
									variant="ghost"
									className="h-8 w-8 opacity-0 group-hover:opacity-100"
									onClick={() => deleteMutation.mutate({ id: rel.id })}
									disabled={deleteMutation.isPending}
								>
									<Trash2 className="h-4 w-4 text-destructive" />   
								</Button>
							</div>
						))
					)}
				</div>
			</CardContent>

			<AddRelationshipDialog
				companyId={companyId}
				open={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
			/>
		</Card>
	)
}
