'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createActivitySchema, ACTIVITY_TYPE_OPTIONS } from '@crm/shared'
import { z } from 'zod'

// Form-specific schema: datetime-local inputs produce "YYYY-MM-DDTHH:mm" which fails z.string().datetime()
// We accept any string here and convert to ISO in onSubmit. Also strip .refine() since entity FK is injected in onSubmit.
const activityFormSchema = createActivitySchema.innerType().extend({
	occurredAt: z.string().optional(),
})
type ActivityFormValues = z.infer<typeof activityFormSchema>
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

interface LogActivityDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	contactId?: string
	companyId?: string
	dealId?: string
	projectId?: string
}

export function LogActivityDialog({
	open,
	onOpenChange,
	contactId,
	companyId,
	dealId,
	projectId,
}: LogActivityDialogProps) {
	const t = useTranslations('shared.activity')
	const tActions = useTranslations('actions')
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const form = useForm<ActivityFormValues>({
		resolver: zodResolver(activityFormSchema),
		defaultValues: {
			activityType: 'meeting',
			subject: '',
			description: '',
			occurredAt: new Date().toISOString(),
			duration: null,
			contactId,
			companyId,
			dealId,
			projectId,
		},
	})

	// Reset form when dialog opens
	useEffect(() => {
		if (open) {
			form.reset({
				activityType: 'meeting',
				subject: '',
				description: '',
				occurredAt: new Date().toISOString().slice(0, 16), // Format for datetime-local
				duration: null,
				contactId,
				companyId,
				dealId,
				projectId,
			})
		}
	}, [open, form, contactId, companyId, dealId, projectId])

	const createMutation = useMutation(
		trpc.activities.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.activities.list.queryKey() })
				toast.success(t('createSuccess') || 'Activity logged')
				onOpenChange(false)
			},
			onError: (error) => {
				toast.error(error.message || t('createError') || 'Failed to log activity')
			},
		}),
	)

	function onSubmit(data: ActivityFormValues) {
		createMutation.mutate({
			...data,
			occurredAt: data.occurredAt ? new Date(data.occurredAt).toISOString() : undefined,
			contactId,
			companyId,
			dealId,
			projectId,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{t('logTitle')}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="activityType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('form.type')}</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={tActions('search')} />
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
									<FormLabel>{t('form.subject')}</FormLabel>
									<FormControl>
										<Input placeholder={t('form.subjectPlaceholder')} {...field} value={field.value || ''} />
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
									<FormLabel>{t('form.description')}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t('form.descriptionPlaceholder')}
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
										<FormLabel>{t('form.occurredAt')}</FormLabel>
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
										<FormLabel>{t('form.duration')}</FormLabel>
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
								disabled={createMutation.isPending}
							>
								{tActions('cancel')}
							</Button>
							<Button type="submit" disabled={createMutation.isPending}>
								{createMutation.isPending ? tActions('loading') : t('logActivity')}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
