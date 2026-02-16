'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
	Globe,
	Calendar,
	Edit,
	Trash2,
	Building2,
	MapPin,
	Users,
	BarChart3,
	Briefcase,
	Rocket,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EditCompanyDialog } from './edit-company-dialog'
import { CompanyContactsSection } from './company-contacts-section'
import { CompanyRelationshipsSection } from './company-relationships-section'
import { ActivityTimeline } from '@/components/shared/activity-timeline'
import { NotesSection } from '@/components/shared/notes-section'
import { EntityTags } from '@/components/shared/entity-tags'

interface CompanyDetailProps {
	id: string
}

export function CompanyDetail({ id }: CompanyDetailProps) {
	const router = useRouter()
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const { data: company, isLoading, error } = useQuery(
		trpc.companies.getById.queryOptions({ id }),
	)

	const deleteMutation = useMutation(
		trpc.companies.delete.mutationOptions({
			onSuccess: () => {
				toast.success('Company deleted')
				router.push('/companies')
				queryClient.invalidateQueries({ queryKey: trpc.companies.list.queryKey() })
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to delete company')
			},
		}),
	)

	if (isLoading) {
		return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>
	}

	if (error || !company) {
		return (
			<div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
				<h2 className="text-xl font-semibold">Company not found</h2>
				<Button variant="outline" asChild>
					<Link href="/companies">Back to Companies</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Breadcrumbs */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground">
				<Link href="/" className="hover:text-foreground">Dashboard</Link>
				<span>/</span>
				<Link href="/companies" className="hover:text-foreground">Companies</Link>
				<span>/</span>
				<span className="text-foreground font-medium">{company.name}</span>
			</nav>

			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 rounded bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
						<Building2 className="h-8 w-8" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
						<div className="flex items-center gap-2 mt-1">
							<Badge variant="outline" className="capitalize">
								{company.entityType.replace('_', ' ')}
							</Badge>
							{company.industry && (
								<span className="text-sm text-muted-foreground">{company.industry}</span>
							)}
						</div>
						<div className="mt-2">
							<EntityTags companyId={company.id} />
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
						<Edit className="h-4 w-4 mr-2" />
						Edit
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="text-destructive hover:bg-destructive/10"
						onClick={() => setIsDeleteDialogOpen(true)}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Delete
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Company Details</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<Globe className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-0.5">
										<p className="text-xs text-muted-foreground">Website</p>
										{company.website ? (
											<a
												href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm font-medium hover:underline flex items-center gap-1"
											>
												{company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
											</a>
										) : (
											<p className="text-sm text-muted-foreground">No website</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-3">
									<MapPin className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-0.5">
										<p className="text-xs text-muted-foreground">Headquarters</p>
										<p className="text-sm font-medium">{company.headquarters || '-'}</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Users className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-0.5">
										<p className="text-xs text-muted-foreground">Employees</p>
										<p className="text-sm font-medium">{company.employeeCountRange || '-'}</p>
									</div>
								</div>
							</div>
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-0.5">
										<p className="text-xs text-muted-foreground">Founded</p>
										<p className="text-sm font-medium">{company.foundedYear || '-'}</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Entity-specific sections */}
					{company.entityType === 'investor' && (
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<Briefcase className="h-5 w-5 text-primary" />
									<CardTitle>Investor Profile</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Investor Type</p>
									<p className="text-sm font-medium capitalize">{company.investorType || '-'}</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">AUM</p>
									<p className="text-sm font-medium">{company.aum || '-'}</p>
								</div>
								{Array.isArray(company.investmentStageFocus) && company.investmentStageFocus.length > 0 && (
									<div className="space-y-1 col-span-2">
										<p className="text-xs text-muted-foreground">Investment Stage Focus</p>
										<div className="flex flex-wrap gap-1 mt-1">
											{(company.investmentStageFocus as string[]).map((stage: string) => (
												<Badge key={stage} variant="outline" className="text-[10px]">
													{stage}
												</Badge>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{company.entityType === 'listed_company' && (
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<BarChart3 className="h-5 w-5 text-primary" />
									<CardTitle>Market Information</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Ticker</p>
									<p className="text-sm font-medium uppercase">{company.tickerSymbol || '-'}</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Exchange</p>
									<p className="text-sm font-medium uppercase">{company.exchange || '-'}</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Market Cap</p>
									<p className="text-sm font-medium">{company.marketCap || '-'}</p>
								</div>
							</CardContent>
						</Card>
					)}

					{company.entityType === 'startup' && (
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<Rocket className="h-5 w-5 text-primary" />
									<CardTitle>Startup & Funding</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Funding Stage</p>
									<p className="text-sm font-medium">{company.fundingStage || '-'}</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Total Funding</p>
									<p className="text-sm font-medium">{company.totalFunding || '-'}</p>
								</div>
							</CardContent>
						</Card>
					)}

					<ActivityTimeline companyId={company.id} />
					<NotesSection companyId={company.id} />
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					<CompanyContactsSection
						companyId={company.id}
						roles={company.contactCompanyRoles || []}
					/>
					<CompanyRelationshipsSection
						companyId={company.id}
						relationshipsFrom={company.companyRelationshipsFrom || []}
						relationshipsTo={company.companyRelationshipsTo || []}
					/>
				</div>
			</div>

			<EditCompanyDialog
				company={company}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
			/>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the company
							and all associated data.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutation.mutate({ id: company.id })}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
