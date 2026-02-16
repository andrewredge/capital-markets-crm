'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateActivitySchema, ACTIVITY_TYPE_OPTIONS, type ActivityType } from '@crm/shared'
import { z } from 'zod'

// Form-specific schema: datetime-local inputs produce "YYYY-MM-DDTHH:mm" which fails z.string().datetime()
const activityUpdateFormSchema = updateActivitySchema.extend({
	occurredAt: z.string().optional(),
})
type ActivityUpdateFormValues = z.infer<typeof activityUpdateFormSchema>
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useEffect } from 'react'

interface EditActivityDialogProps {
	activity: {
		id: string
		activityType: ActivityType
		subject: string | null
		description: string | null
		occurredAt: Date | string
		duration: number | null
		contactId: string | null
		companyId: string | null
	}
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditActivityDialog({
	activity,
	open,
	onOpenChange,
}: EditActivityDialogProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const form = useForm<ActivityUpdateFormValues>({
		resolver: zodResolver(activityUpdateFormSchema),
		defaultValues: {
			activityType: activity.activityType,
			subject: activity.subject || '',
			description: activity.description || '',
			occurredAt: new Date(activity.occurredAt).toISOString().slice(0, 16),
			duration: activity.duration,
		},
	})

	useEffect(() => {
		if (open) {
			form.reset({
				activityType: activity.activityType,
				subject: activity.subject || '',
				description: activity.description || '',
				occurredAt: new Date(activity.occurredAt).toISOString().slice(0, 16),
				duration: activity.duration,
			})
		}
	}, [open, form, activity])

	const updateMutation = useMutation(
		trpc.activities.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.activities.list.queryKey() })
				queryClient.invalidateQueries({ queryKey: trpc.activities.getById.queryKey({ id: activity.id }) })
				toast.success('Activity updated')
				onOpenChange(false)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update activity')
			},
		}),
	)

	function onSubmit(data: ActivityUpdateFormValues) {
		updateMutation.mutate({
			id: activity.id,
			...data,
			occurredAt: data.occurredAt ? new Date(data.occurredAt).toISOString() : undefined,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Edit Activity</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="activityType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Activity Type</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{ACTIVITY_TYPE_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
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
							name="subject"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Subject</FormLabel>
									<FormControl>
										<Input placeholder="Brief summary" {...field} value={field.value || ''} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Detailed notes..."
											className="min-h-[100px]"
											{...field}
											value={field.value || ''}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="occurredAt"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Date & Time</FormLabel>
										<FormControl>
											<Input type="datetime-local" {...field} value={field.value || ''} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="duration"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Duration (mins)</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="30"
												{...field}
												value={field.value || ''}
												onChange={(e) =>
													field.onChange(e.target.value ? parseInt(e.target.value) : null)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={updateMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending ? 'Saving...' : 'Save Changes'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
