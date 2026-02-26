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
	Edit,
	Trash2,
	MapPin,
	Mountain,
	Globe,
	Info,
	FileText,
	DollarSign,
	Building2,
	Plus,
	Unlink,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EditProjectDialog } from './edit-project-dialog'
import { ActivityTimeline } from '@/components/shared/activity-timeline'
import { NotesSection } from '@/components/shared/notes-section'
import { EntityTags } from '@/components/shared/entity-tags'
import { PROJECT_STATUS_OPTIONS, COMMODITY_OPTIONS, REPORTING_STANDARD_OPTIONS, STAGE_OF_STUDY_OPTIONS, TENURE_TYPE_OPTIONS, PROJECT_DEAL_ROLE_OPTIONS } from '@crm/shared'
import { format } from 'date-fns'

interface ProjectDetailProps {
	id: string
}

export function ProjectDetail({ id }: ProjectDetailProps) {
	const router = useRouter()
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const { data: project, isLoading, error } = useQuery(
		trpc.projects.getById.queryOptions({ id }),
	)

	const deleteMutation = useMutation(
		trpc.projects.delete.mutationOptions({
			onSuccess: () => {
				toast.success('Project deleted')
				router.push('/projects')
				queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() })
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to delete project')
			},
		}),
	)

	const unlinkDealMutation = useMutation(
		trpc.projects.unlinkDeal.mutationOptions({
			onSuccess: () => {
				toast.success('Deal unlinked')
				queryClient.invalidateQueries({ queryKey: trpc.projects.getById.queryKey({ id }) })
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to unlink deal')
			},
		}),
	)

	if (isLoading) {
		return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>
	}

	if (error || !project) {
		return (
			<div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
				<h2 className="text-xl font-semibold">Project not found</h2>
				<Button variant="outline" asChild>
					<Link href="/projects">Back to Projects</Link>
				</Button>
			</div>
		)
	}

	const statusLabel = PROJECT_STATUS_OPTIONS.find(o => o.value === project.projectStatus)?.label || project.projectStatus
	const commodityLabel = COMMODITY_OPTIONS.find(o => o.value === project.primaryCommodity)?.label || project.primaryCommodity
	const reportingStandardLabel = REPORTING_STANDARD_OPTIONS.find(o => o.value === project.reportingStandard)?.label || project.reportingStandard
	const stageOfStudyLabel = STAGE_OF_STUDY_OPTIONS.find(o => o.value === project.stageOfStudy)?.label || project.stageOfStudy
	const tenureTypeLabel = TENURE_TYPE_OPTIONS.find(o => o.value === project.tenureType)?.label || project.tenureType

	return (
		<div className="space-y-6">
			{/* Breadcrumbs */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground">
				<Link href="/" className="hover:text-foreground">Dashboard</Link>
				<span>/</span>
				<Link href="/projects" className="hover:text-foreground">Projects</Link>
				<span>/</span>
				<span className="text-foreground font-medium">{project.name}</span>
			</nav>

			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 rounded bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
						<Mountain className="h-8 w-8" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
						<div className="flex items-center gap-2 mt-1">
							<Badge variant="outline">{statusLabel}</Badge>
							<Badge>{commodityLabel}</Badge>
						</div>
						<div className="mt-2">
							<EntityTags projectId={project.id} />
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
					{/* Detail Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Location Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Location</CardTitle>
								<MapPin className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">Country</span>
										<span className="text-sm font-medium">{project.country || '-'}</span>
									</div>
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">State/Province</span>
										<span className="text-sm font-medium">{project.stateProvince || '-'}</span>
									</div>
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">Nearest Town</span>
										<span className="text-sm font-medium">{project.nearestTown || '-'}</span>
									</div>
									{(project.latitude || project.longitude) && (
										<div className="flex justify-between py-1 border-b border-border/50">
											<span className="text-sm text-muted-foreground">Coordinates</span>
											<span className="text-sm font-medium">{project.latitude}, {project.longitude}</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Geology Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Geology & Study</CardTitle>
								<Info className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">Primary</span>
										<span className="text-sm font-medium">{commodityLabel}</span>
									</div>
									{(project.secondaryCommodities as string[]) && (project.secondaryCommodities as string[]).length > 0 && (
										<div className="flex flex-wrap gap-1 py-1">
											{(project.secondaryCommodities as string[]).map((c: string) => (
												<Badge key={c} variant="secondary" className="text-[10px]">
													{COMMODITY_OPTIONS.find(o => o.value === c)?.label || c}
												</Badge>
											))}
										</div>
									)}
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">Stage of Study</span>
										<span className="text-sm font-medium">{stageOfStudyLabel || '-'}</span>
									</div>
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">Standard</span>
										<span className="text-sm font-medium">{reportingStandardLabel || '-'}</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Tenure Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Tenure</CardTitle>
								<FileText className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">Type</span>
										<span className="text-sm font-medium">{tenureTypeLabel || '-'}</span>
									</div>
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">Area</span>
										<span className="text-sm font-medium">{project.tenureArea || '-'}</span>
									</div>
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">Expiry</span>
										<span className="text-sm font-medium">
											{project.tenureExpiry ? format(new Date(project.tenureExpiry), 'MMM d, yyyy') : '-'}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Financials Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Financials</CardTitle>
								<DollarSign className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">CAPEX</span>
										<span className="text-sm font-medium">{project.capexEstimate || '-'}</span>
									</div>
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">NPV</span>
										<span className="text-sm font-medium">{project.npv || '-'}</span>
									</div>
									<div className="flex justify-between py-1 border-b border-border/50">
										<span className="text-sm text-muted-foreground">IRR</span>
										<span className="text-sm font-medium">{project.irr || '-'}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Description Card */}
					{project.description && (
						<Card>
							<CardHeader>
								<CardTitle>Description</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm whitespace-pre-wrap">{project.description}</p>
							</CardContent>
						</Card>
					)}

					{/* Resources & Reserves Card */}
					{(project.resourceEstimate || project.reserveEstimate) && (
						<Card>
							<CardHeader>
								<CardTitle>Resources & Reserves</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{project.resourceEstimate && (
									<div>
										<p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Resource Estimate</p>
										<p className="text-sm">{project.resourceEstimate}</p>
									</div>
								)}
								{project.reserveEstimate && (
									<div>
										<p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Reserve Estimate</p>
										<p className="text-sm">{project.reserveEstimate}</p>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					<ActivityTimeline projectId={project.id} />
					<NotesSection projectId={project.id} />
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Owner Company */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<Building2 className="h-4 w-4" />
								Owner Company
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Link 
								href={`/companies/${project.ownerCompanyId}`}
								className="text-sm font-medium text-primary hover:underline"
							>
								{project.ownerCompanyName}
							</Link>
						</CardContent>
					</Card>

					{/* Linked Deals */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0">
							<CardTitle className="text-base">Linked Deals</CardTitle>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<Plus className="h-4 w-4" />
							</Button>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{project.linkedDeals && project.linkedDeals.length > 0 ? (
									project.linkedDeals.map((link: any) => (
										<div key={link.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
											<div className="space-y-1">
												<Link 
													href={`/deals/${link.dealId}`}
													className="text-sm font-medium hover:underline block"
												>
													{link.deal.name}
												</Link>
												<Badge variant="outline" className="text-[10px] py-0">
													{PROJECT_DEAL_ROLE_OPTIONS.find(o => o.value === link.role)?.label || link.role}
												</Badge>
											</div>
											<Button 
												variant="ghost" 
												size="icon" 
												className="h-8 w-8 text-muted-foreground hover:text-destructive"
												onClick={() => unlinkDealMutation.mutate({ id: link.id })}
											>
												<Unlink className="h-3 w-3" />
											</Button>
										</div>
									))
								) : (
									<p className="text-sm text-muted-foreground">No linked deals.</p>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<EditProjectDialog
				project={project}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
			/>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the project
							and all associated data.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutation.mutate({ id: project.id })}
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
