'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateNoteSchema, type UpdateNoteInput } from '@crm/shared'
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

interface EditNoteDialogProps {
	note: {
		id: string
		title: string | null
		content: string
		isPinned: boolean
	}
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditNoteDialog({
	note,
	open,
	onOpenChange,
}: EditNoteDialogProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const form = useForm<UpdateNoteInput>({
		resolver: zodResolver(updateNoteSchema),
		defaultValues: {
			title: note.title || '',
			content: note.content,
			isPinned: note.isPinned,
		},
	})

	useEffect(() => {
		if (open) {
			form.reset({
				title: note.title || '',
				content: note.content,
				isPinned: note.isPinned,
			})
		}
	}, [open, form, note])

	const updateMutation = useMutation(
		trpc.notes.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.notes.list.queryKey() })
				queryClient.invalidateQueries({ queryKey: trpc.notes.getById.queryKey({ id: note.id }) })
				toast.success('Note updated')
				onOpenChange(false)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update note')
			},
		}),
	)

	function onSubmit(data: UpdateNoteInput) {
		updateMutation.mutate({
			id: note.id,
			...data,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Edit Note</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title (Optional)</FormLabel>
									<FormControl>
										<Input placeholder="Note title" {...field} value={field.value || ''} />
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
									<FormLabel>Content</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Write your note here..."
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
										<FormLabel>Pin to top</FormLabel>
										<FormDescription>
											Pinned notes appear at the top of the list.
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
