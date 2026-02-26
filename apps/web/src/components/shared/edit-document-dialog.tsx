'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateDocumentSchema, type UpdateDocumentInput, DOCUMENT_TYPE_VALUES, DOCUMENT_VISIBILITY_VALUES } from '@crm/shared'
import { DOCUMENT_TYPE_OPTIONS, DOCUMENT_VISIBILITY_OPTIONS } from '@crm/shared/constants'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface EditDocumentDialogProps {
	document: { id: string; documentType: string; description: string | null; visibility: string }
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditDocumentDialog({ document, open, onOpenChange }: EditDocumentDialogProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const form = useForm<UpdateDocumentInput>({
		resolver: zodResolver(updateDocumentSchema),
		defaultValues: {
			documentType: document.documentType as typeof DOCUMENT_TYPE_VALUES[number],
			description: document.description ?? '',
			visibility: document.visibility as typeof DOCUMENT_VISIBILITY_VALUES[number],
		},
	})

	const updateMutation = useMutation(
		trpc.documents.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.documents.list.queryKey() })
				toast.success('Document updated')
				onOpenChange(false)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update document')
			},
		}),
	)

	function onSubmit(data: UpdateDocumentInput) {
		updateMutation.mutate({ id: document.id, ...data })
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Document</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="documentType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Document Type</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{DOCUMENT_TYPE_OPTIONS.map((opt) => (
												<SelectItem key={opt.value} value={opt.value}>
													{opt.label}
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
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea {...field} placeholder="Optional description" rows={3} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="visibility"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Visibility</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select visibility" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{DOCUMENT_VISIBILITY_OPTIONS.map((opt) => (
												<SelectItem key={opt.value} value={opt.value}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-2 pt-2">
							<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending ? 'Saving...' : 'Save'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
