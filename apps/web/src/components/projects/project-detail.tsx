'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
	MapPin,
	Calendar,
	Edit,
	Mountain,
	Info,
	Layers,
	DollarSign,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EditProjectDialog } from './edit-project-dialog'
import { ActivityTimeline } from '@/components/shared/activity-timeline'
import { NotesSection } from '@/components/shared/notes-section'
import { DocumentsSection } from '@/components/shared/documents-section'
import { EntityTags } from '@/components/shared/entity-tags'
import { PROJECT_STATUS_OPTIONS, COMMODITY_OPTIONS } from '@crm/shared'
import { format } from 'date-fns'

interface ProjectDetailProps {
	id: string
}

export function ProjectDetail({ id }: ProjectDetailProps) {
	const t = useTranslations('projects')
	const tNav = useTranslations('nav')
	const tActions = useTranslations('actions')
	const router = useRouter()
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

	const { data: project, isLoading, error } = useQuery(
		trpc.projects.getById.queryOptions({ id }),
	)

	const deleteMutation = useMutation(
		trpc.projects.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t('deleteSuccess'))
				router.push('/projects')
				queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() })
			},
			onError: (error) => {
				toast.error(error.message || t('deleteError'))
			},
		}),
	)

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-6">
						<Skeleton className="h-48 w-full" />
						<Skeleton className="h-96 w-full" />
					</div>
					<div className="space-y-6">
						<Skeleton className="h-64 w-full" />
					</div>
				</div>
			</div>
		)
	}

	if (error || !project) {
		return (
			<div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
				<h2 className="text-xl font-semibold">{t('notFound')}</h2>
				<Button variant="outline" asChild>
					<Link href="/projects">{t('pageTitle')}</Link>
				</Button>
			</div>
		)
	}

	const statusOption = PROJECT_STATUS_OPTIONS.find((o) => o.value === project.projectStatus)
	const primaryCommodity = COMMODITY_OPTIONS.find((o) => o.value === project.primaryCommodity)

	return (
		<div className="space-y-6">
			{/* Breadcrumbs */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground">
				<Link href="/" className="hover:text-foreground">{tNav('dashboard')}</Link>
				<span>/</span>
				<Link href="/projects" className="hover:text-foreground">{tNav('projects')}</Link>
				<span>/</span>
				<span className="text-foreground font-medium">{project.name}</span>
			</nav>

			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 rounded bg-primary/10 flex items-center justify-center text-primary">
						<Mountain className="h-8 w-8" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
						<div className="flex items-center gap-2 mt-1">
							<Badge variant="outline">{statusOption?.label || project.projectStatus}</Badge>
							<Badge>{primaryCommodity?.label || project.primaryCommodity}</Badge>
							<p className="text-muted-foreground ml-2">
								{project.ownerCompanyName}
							</p>
						</div>
						<div className="mt-2">
							<EntityTags projectId={project.id} />
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
						<Edit className="h-4 w-4 mr-2" />
						{tActions('edit')}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Location Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">{t('tabs.location')}</CardTitle>
								<MapPin className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent className="space-y-2 pt-2">
								<div>
									<p className="text-xs text-muted-foreground">{t('form.country')}</p>
									<p className="text-sm font-medium">{project.country || '-'}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t('form.region')}</p>
									<p className="text-sm font-medium">{project.stateProvince || '-'}</p>
								</div>
								{project.latitude && project.longitude && (
									<div>
										<p className="text-xs text-muted-foreground">{t('coordinates')}</p>
										<p className="text-sm font-medium">
											{project.latitude}, {project.longitude}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Tenure Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">{t('tabs.tenure')}</CardTitle>
								<Layers className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent className="space-y-2 pt-2">
								<div>
									<p className="text-xs text-muted-foreground">{t('form.tenureType')}</p>
									<p className="text-sm font-medium capitalize">{project.tenureType?.replace('_', ' ') || '-'}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t('form.tenureArea')}</p>
									<p className="text-sm font-medium">{project.tenureArea || '-'}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t('form.tenureExpiry')}</p>
									<p className="text-sm font-medium">
										{project.tenureExpiry ? format(new Date(project.tenureExpiry), 'MMM d, yyyy') : '-'}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Geology Card */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">{t('tabs.geology')}</CardTitle>
							<Info className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent className="space-y-4 pt-2">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-xs text-muted-foreground">{t('form.reportingStandard')}</p>
									<p className="text-sm font-medium">{project.reportingStandard || '-'}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t('form.stageOfStudy')}</p>
									<p className="text-sm font-medium capitalize">{project.stageOfStudy?.replace('_', ' ') || '-'}</p>
								</div>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t('form.resourceEstimate')}</p>
								<p className="text-sm font-medium">{project.resourceEstimate || '-'}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t('form.reserveEstimate')}</p>
								<p className="text-sm font-medium">{project.reserveEstimate || '-'}</p>
							</div>
							{Array.isArray(project.secondaryCommodities) && project.secondaryCommodities.length > 0 && (
								<div>
									<p className="text-xs text-muted-foreground">{t('form.secondaryCommodities')}</p>
									<div className="flex flex-wrap gap-1 mt-1">
										{(project.secondaryCommodities as string[]).map((c) => (
											<Badge key={c} variant="secondary" className="text-[10px]">
												{COMMODITY_OPTIONS.find((o) => o.value === c)?.label || c}
											</Badge>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Financial Card */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">{t('tabs.financial')}</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent className="grid grid-cols-3 gap-4 pt-2">
							<div>
								<p className="text-xs text-muted-foreground">{t('form.capexEstimate')}</p>
								<p className="text-sm font-medium">{project.capexEstimate || '-'}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t('form.npv')}</p>
								<p className="text-sm font-medium">{project.npv || '-'}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{t('form.irr')}</p>
								<p className="text-sm font-medium">{project.irr || '-'}</p>
							</div>
						</CardContent>
					</Card>

					<ActivityTimeline projectId={project.id} />
					<NotesSection projectId={project.id} />
					<DocumentsSection projectId={project.id} />
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">{t('form.description')}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground whitespace-pre-wrap">
								{project.description || t('noDescription')}
							</p>
						</CardContent>
					</Card>
				</div>
			</div>

			<EditProjectDialog
				project={project}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
			/>
		</div>
	)
}
