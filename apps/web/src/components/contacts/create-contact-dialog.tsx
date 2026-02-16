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
	DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ContactForm } from './contact-form'
import type { CreateContactInput } from '@crm/shared'

export function CreateContactDialog() {
	const [open, setOpen] = useState(false)
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const createMutation = useMutation(
		trpc.contacts.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.contacts.list.queryKey() })
				toast.success('Contact created successfully')
				setOpen(false)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to create contact')
			},
		}),
	)

	const onSubmit = (data: CreateContactInput) => {
		createMutation.mutate(data)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="gap-2">
					<Plus className="h-4 w-4" />
					New Contact
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Create New Contact</DialogTitle>
					<DialogDescription>
						Add a new contact to your CRM.
					</DialogDescription>
				</DialogHeader>
				<ContactForm onSubmit={onSubmit} isLoading={createMutation.isPending} />
			</DialogContent>
		</Dialog>
	)
}
