'use client'

import { useState } from 'react'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	Plus,
	MoreHorizontal,
	Edit2,
	Trash2,
	Users,
	Phone,
	Mail,
	FileText,
	CheckSquare,
	TrendingUp,
	Clock,
} from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ActivityType } from '@crm/shared'
import { LogActivityDialog } from './log-activity-dialog'
import { EditActivityDialog } from './edit-activity-dialog'
import { toast } from 'sonner'
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

interface ActivityTimelineProps {
	contactId?: string
	companyId?: string
}

function formatRelativeTime(date: Date | string): string {
	const now = new Date()
	const d = new Date(date)
	const diffMs = now.getTime() - d.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	if (diffMins < 1) return 'just now'
	if (diffMins < 60) return `${diffMins}m ago`
	const diffHours = Math.floor(diffMins / 60)
	if (diffHours < 24) return `${diffHours}h ago`
	const diffDays = Math.floor(diffHours / 24)
	if (diffDays < 7) return `${diffDays}d ago`
	return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
	meeting: <Users className="h-4 w-4" />,
	call: <Phone className="h-4 w-4" />,
	email: <Mail className="h-4 w-4" />,
	note: <FileText className="h-4 w-4" />,
	task: <CheckSquare className="h-4 w-4" />,
	deal_update: <TrendingUp className="h-4 w-4" />,
}

export function ActivityTimeline({ contactId, companyId }: ActivityTimelineProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [isLogOpen, setIsLogOpen] = useState(false)
	const [editingActivity, setEditingActivity] = useState<{
		id: string
		activityType: ActivityType
		subject: string | null
		description: string | null
		occurredAt: Date | string
		duration: number | null
		contactId: string | null
		companyId: string | null
	} | null>(null)
	const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null)

	const { data, isLoading } = useQuery(
		trpc.activities.list.queryOptions({
			contactId,
			companyId,
			limit: 20,
		}),
	)

	const deleteMutation = useMutation(
		trpc.activities.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.activities.list.queryKey() })
				toast.success('Activity deleted')
				setDeletingActivityId(null)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to delete activity')
			},
		}),
	)

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-xl font-bold">Activity Timeline</CardTitle>
				<Button size="sm" onClick={() => setIsLogOpen(true)}>
					<Plus className="h-4 w-4 mr-2" />
					Log Activity
				</Button>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4 mt-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex gap-4">
								<div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-1/4 bg-muted animate-pulse" />
									<div className="h-4 w-full bg-muted animate-pulse" />
								</div>
							</div>
						))}
					</div>
				) : !data?.items?.length ? (
					<div className="text-center py-8 text-muted-foreground">
						No activities yet. Log your first activity.
					</div>
				) : (
					<div className="relative space-y-6 mt-4 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
						{data.items.map((activity) => (
							<div key={activity.id} className="relative flex items-start gap-4">
								<div className="absolute left-0 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-background ring-2 ring-muted">
									{ACTIVITY_ICONS[activity.activityType] || <Clock className="h-4 w-4" />}
								</div>
								<div className="ml-10 flex-1 space-y-1">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="font-semibold">{activity.subject || activity.activityType.replace('_', ' ')}</span>
											<Badge variant="outline" className="capitalize text-[10px] h-5">
												{activity.activityType.replace('_', ' ')}
											</Badge>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-muted-foreground">
												{formatRelativeTime(activity.occurredAt)}
											</span>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon" className="h-7 w-7">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => setEditingActivity({ ...activity, activityType: activity.activityType as ActivityType })}>
														<Edit2 className="h-4 w-4 mr-2" />
														Edit
													</DropdownMenuItem>
													<DropdownMenuItem
														className="text-destructive"
														onClick={() => setDeletingActivityId(activity.id)}
													>
														<Trash2 className="h-4 w-4 mr-2" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
									<p className="text-sm text-muted-foreground line-clamp-3">
										{activity.description}
									</p>
									{activity.duration && (
										<div className="flex items-center gap-1 text-xs text-muted-foreground">
											<Clock className="h-3 w-3" />
											{activity.duration} mins
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>

			<LogActivityDialog
				open={isLogOpen}
				onOpenChange={setIsLogOpen}
				contactId={contactId}
				companyId={companyId}
			/>

			{editingActivity && (
				<EditActivityDialog
					activity={editingActivity}
					open={!!editingActivity}
					onOpenChange={(open) => !open && setEditingActivity(null)}
				/>
			)}

			<AlertDialog open={!!deletingActivityId} onOpenChange={(open) => !open && setDeletingActivityId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Activity</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this activity? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deletingActivityId && deleteMutation.mutate({ id: deletingActivityId })}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	)
}
