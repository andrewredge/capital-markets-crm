'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { ContactForm } from './contact-form'
import type { CreateContactInput } from '@crm/shared'

interface EditContactDialogProps {
	contact: any // Ideally TypedContact
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditContactDialog({ contact, open, onOpenChange }: EditContactDialogProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const updateMutation = useMutation(
		trpc.contacts.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.contacts.getById.queryKey({ id: contact.id }) })
				queryClient.invalidateQueries({ queryKey: trpc.contacts.list.queryKey() })
				toast.success('Contact updated successfully')
				onOpenChange(false)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update contact')
			},
		}),
	)

	const onSubmit = (data: CreateContactInput) => {
		updateMutation.mutate({ id: contact.id, ...data })
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Edit Contact</DialogTitle>
					<DialogDescription>
						Update contact information.
					</DialogDescription>
				</DialogHeader>
				<ContactForm
					defaultValues={contact}
					onSubmit={onSubmit}
					isLoading={updateMutation.isPending}
				/>
			</DialogContent>
		</Dialog>
	)
}
