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
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCompanyRelationshipSchema, COMPANY_RELATIONSHIP_TYPE_OPTIONS, type CreateCompanyRelationshipInput } from '@crm/shared'

interface AddRelationshipDialogProps {
	companyId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function AddRelationshipDialog({ companyId, open, onOpenChange }: AddRelationshipDialogProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data: companiesData } = useQuery(
		trpc.companies.list.queryOptions({ limit: 100 }),
	)

	const form = useForm<CreateCompanyRelationshipInput>({
		resolver: zodResolver(createCompanyRelationshipSchema) as any,
		defaultValues: {
			fromCompanyId: companyId,
			toCompanyId: '',
			relationshipType: 'partner_with',
		} as any,
	})

	const createMutation = useMutation(
		trpc.companyRelationships.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.companies.getById.queryKey({ id: companyId }) })
				toast.success('Relationship added')
				onOpenChange(false)
				form.reset()
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to add relationship')
			},
		}),
	)

	const onSubmit = (data: CreateCompanyRelationshipInput) => {
		createMutation.mutate(data)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>Add Relationship</DialogTitle>
					<DialogDescription>
						Link this company to another company.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="toCompanyId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Related Company</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a company" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{companiesData?.items
												.filter(c => c.id !== companyId)
												.map((company) => (
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
							name="relationshipType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Relationship Type</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{COMPANY_RELATIONSHIP_TYPE_OPTIONS.map((option) => (
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

						<div className="flex justify-end gap-3 pt-4">
							<Button type="submit" disabled={createMutation.isPending}>
								{createMutation.isPending ? 'Adding...' : 'Add Relationship'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
