'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createNoteSchema } from '@crm/shared'
import { z } from 'zod'

// Strip .refine() for form validation — entity FK is injected in onSubmit
const noteFormSchema = createNoteSchema.innerType()
type NoteFormValues = z.infer<typeof noteFormSchema>
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
	FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useEffect } from 'react'

interface AddNoteDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	contactId?: string
	companyId?: string
	dealId?: string
	projectId?: string
}

export function AddNoteDialog({
	open,
	onOpenChange,
	contactId,
	companyId,
	dealId,
	projectId,
}: AddNoteDialogProps) {
	const t = useTranslations('shared.notes')
	const tActions = useTranslations('actions')
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const form = useForm<NoteFormValues>({
		resolver: zodResolver(noteFormSchema) as any, // as any needed: z.boolean().default() input/output type mismatch with RHF
		defaultValues: {
			title: '',
			content: '',
			isPinned: false,
			contactId,
			companyId,
			dealId,
			projectId,
		},
	})

	useEffect(() => {
		if (open) {
			form.reset({
				title: '',
				content: '',
				isPinned: false,
				contactId,
				companyId,
				dealId,
				projectId,
			})
		}
	}, [open, form, contactId, companyId, dealId, projectId])

	const createMutation = useMutation(
		trpc.notes.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.notes.list.queryKey() })
				toast.success(t('createSuccess'))
				onOpenChange(false)
			},
			onError: (error) => {
				toast.error(error.message || t('createError'))
			},
		}),
	)

	function onSubmit(data: NoteFormValues) {
		createMutation.mutate({
			...data,
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
					<DialogTitle>{t('addTitle')}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('form.title')}</FormLabel>
									<FormControl>
										<Input placeholder={t('form.titlePlaceholder')} {...field} value={field.value || ''} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="content"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('form.content')}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t('form.placeholder')}
											className="min-h-[150px]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="isPinned"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>{t('form.pinToTop')}</FormLabel>
										<FormDescription>
											{t('form.pinDescription')}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
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
								{createMutation.isPending ? tActions('loading') : t('addNote')}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
