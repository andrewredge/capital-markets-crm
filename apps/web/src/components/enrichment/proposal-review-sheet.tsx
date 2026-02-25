'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Check, X, AlertCircle, UserCheck, History, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import type { ProposedChanges, EnrichableContactField } from '@crm/shared'

interface ProposalReviewSheetProps {
	contactId: string | null
	onClose: () => void
	onSuccess?: () => void
}

export function ProposalReviewSheet({ contactId, onClose, onSuccess }: ProposalReviewSheetProps) {
	const trpc = useTRPC()
	const [acceptedFields, setAcceptedFields] = useState<Record<string, boolean>>({})

	const { data: contact, isLoading: isLoadingContact, isError: isContactError } = useQuery({
		...trpc.contacts.getById.queryOptions({ id: contactId || '' }),
		enabled: !!contactId,
		retry: false,
	})

	const { data: proposals, isLoading: isLoadingProposals, refetch: refetchProposals } = useQuery({
		...trpc.enrichment.getProposalsByContact.queryOptions({ contactId: contactId || '' }),
		enabled: !!contactId,
	})

	const pendingProposal = proposals?.find((p) => p.reviewStatus === 'pending')

	useEffect(() => {
		if (pendingProposal) {
			const changes = pendingProposal.proposedChanges as ProposedChanges
			const initial: Record<string, boolean> = {}
			Object.keys(changes).forEach((key) => {
				initial[key] = true // Default to accept all
			})
			setAcceptedFields(initial)
		} else {
			setAcceptedFields({})
		}
	}, [pendingProposal])

	const markVerifiedMutation = useMutation(
		trpc.enrichment.markVerified.mutationOptions({
			onSuccess: () => {
				toast.success('Contact marked as verified')
				onSuccess?.()
			},
			onError: (err) => {
				toast.error(`Error: ${err.message}`)
			},
		}),
	)

	const reviewMutation = useMutation(
		trpc.enrichment.reviewProposal.mutationOptions({
			onSuccess: () => {
				toast.success('Review submitted successfully')
				onSuccess?.()
			},
			onError: (err) => {
				toast.error(`Error: ${err.message}`)
			},
		}),
	)

	const toggleField = (field: string) => {
		setAcceptedFields((prev) => ({ ...prev, [field]: !prev[field] }))
	}

	const handleReview = (action: 'accept' | 'reject' | 'partial') => {
		if (!pendingProposal) return

		const fields = Object.entries(acceptedFields)
			.filter(([_, accepted]) => accepted)
			.map(([field]) => field)

		reviewMutation.mutate({
			proposalId: pendingProposal.id,
			action: action === 'partial' ? (fields.length === 0 ? 'reject' : 'partial') : action,
			acceptedFields: action === 'reject' ? [] : fields,
		})
	}

	const isLoading = isLoadingContact || isLoadingProposals

	return (
		<Sheet open={!!contactId} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="sm:max-w-lg md:max-w-xl flex flex-col h-full overflow-hidden">
				<SheetHeader className="pb-4">
					<SheetTitle>Enrichment Review</SheetTitle>
					<SheetDescription>
						Verify contact information and review proposed updates.
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
					{isLoading ? (
						<div className="space-y-4">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-40 w-full" />
							<Skeleton className="h-40 w-full" />
						</div>
					) : isContactError || !contact ? (
						<div className="py-10 text-center text-muted-foreground">
							Contact not found.
						</div>
					) : (
						<>
							{/* Current Info */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
										Current Contact Data
									</h3>
									<Button
										variant="outline"
										size="sm"
										className="h-8"
										onClick={() => markVerifiedMutation.mutate({ contactId: contact.id })}
										disabled={markVerifiedMutation.isPending}
									>
										<UserCheck className="mr-2 h-4 w-4" />
										Mark as Verified
									</Button>
								</div>
								<div className="rounded-lg border bg-muted/30 p-4 grid grid-cols-2 gap-4 text-sm">
									<div>
										<label className="text-xs text-muted-foreground block">Name</label>
										<span>{contact.firstName} {contact.lastName}</span>
									</div>
									<div>
										<label className="text-xs text-muted-foreground block">Email</label>
										<span className="truncate block" title={contact.email || ''}>
											{contact.email || '-'}
										</span>
									</div>
									<div>
										<label className="text-xs text-muted-foreground block">Title</label>
										<span>{contact.title || '-'}</span>
									</div>
									<div>
										<label className="text-xs text-muted-foreground block">Phone</label>
										<span>{contact.phone || '-'}</span>
									</div>
								</div>
							</div>

							{/* Proposals */}
							<div className="space-y-4">
								<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
									Pending Proposals
								</h3>
								{!pendingProposal ? (
									<div className="rounded-lg border border-dashed p-8 text-center bg-muted/10">
										<AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
										<p className="text-sm text-muted-foreground">No pending proposals found for this contact.</p>
									</div>
								) : (
									<div className="space-y-4">
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<History className="h-3 w-3" />
											Source: <Badge variant="secondary" className="px-1 py-0 text-[10px]">{pendingProposal.source}</Badge>
											<span>•</span>
											<span>{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(pendingProposal.createdAt))}</span>
										</div>

										<div className="space-y-2">
											{Object.entries(pendingProposal.proposedChanges as ProposedChanges).map(([field, change]) => (
												<div
													key={field}
													className={cn(
														"group relative rounded-lg border p-3 transition-colors",
														acceptedFields[field]
															? "border-primary/30 bg-primary/5"
															: "border-muted bg-muted/20 opacity-60"
													)}
												>
													<div className="flex items-start justify-between mb-2">
														<div>
															<label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
																{field.replace(/([A-Z])/g, ' $1')}
															</label>
															<div className="flex items-center gap-1.5 mt-0.5">
																<Badge
																	variant="outline"
																	className={cn(
																		"text-[10px] px-1 py-0 border-none",
																		change?.confidence === 'high' ? "bg-green-100 text-green-700" :
																		change?.confidence === 'medium' ? "bg-amber-100 text-amber-700" :
																		"bg-red-100 text-red-700"
																	)}
																>
																	{change?.confidence} confidence
																</Badge>
															</div>
														</div>
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6"
															onClick={() => toggleField(field)}
														>
															{acceptedFields[field] ? (
																<Check className="h-4 w-4 text-green-600" />
															) : (
																<X className="h-4 w-4 text-muted-foreground" />
															)}
														</Button>
													</div>

													<div className="grid grid-cols-[1fr,24px,1fr] gap-2 items-center text-sm">
														<div className="p-2 rounded bg-muted/50 line-through text-muted-foreground truncate">
															{change?.current || '(empty)'}
														</div>
														<div className="flex justify-center">
															<ExternalLink className="h-3 w-3 text-muted-foreground rotate-90" />
														</div>
														<div className="p-2 rounded bg-background border border-primary/20 font-medium text-primary truncate">
															{change?.proposed || '(empty)'}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</>
					)}
				</div>

				<SheetFooter className="pt-6 border-t mt-auto">
					{pendingProposal ? (
						<div className="flex w-full gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => handleReview('reject')}
								disabled={reviewMutation.isPending}
							>
								Reject All
							</Button>
							<Button
								className="flex-1"
								onClick={() => {
								const allAccepted = Object.values(acceptedFields).every(Boolean)
								handleReview(allAccepted ? 'accept' : 'partial')
							}}
								disabled={reviewMutation.isPending}
							>
								Apply Selected
							</Button>
						</div>
					) : (
						<Button className="w-full" onClick={onClose}>Close</Button>
					)}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
