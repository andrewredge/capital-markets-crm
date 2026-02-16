'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createContactCompanyRoleSchema, CONTACT_ROLE_OPTIONS, type CreateContactCompanyRoleInput } from '@crm/shared'

interface AddCompanyRoleDialogProps {
	contactId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function AddCompanyRoleDialog({ contactId, open, onOpenChange }: AddCompanyRoleDialogProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data: companiesData } = useQuery(
		trpc.companies.list.queryOptions({ limit: 100 }),
	)

	const form = useForm<CreateContactCompanyRoleInput>({
		resolver: zodResolver(createContactCompanyRoleSchema) as any,
		defaultValues: {
			contactId,
			companyId: '',
			role: 'other',
			isPrimary: false,
		} as any,
	})

	const createMutation = useMutation(
		trpc.contactCompanyRoles.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.contacts.getById.queryKey({ id: contactId }) })
				toast.success('Company role added')
				onOpenChange(false)
				form.reset()
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to add company role')
			},
		}),
	)

	const onSubmit = (data: CreateContactCompanyRoleInput) => {
		createMutation.mutate(data)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>Add Company Role</DialogTitle>
					<DialogDescription>
						Associate this contact with a company.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="companyId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Company</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a company" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{companiesData?.items.map((company) => (
												<SelectItem key={company.id} value={company.id}>
													{company.name}
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
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{CONTACT_ROLE_OPTIONS.map((option) => (
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
							name="isPrimary"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Primary Role</FormLabel>
										<div className="text-xs text-muted-foreground">
											Is this the contact's main company?
										</div>
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

						<div className="flex justify-end gap-3 pt-4">
							<Button type="submit" disabled={createMutation.isPending}>
								{createMutation.isPending ? 'Adding...' : 'Add Role'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
