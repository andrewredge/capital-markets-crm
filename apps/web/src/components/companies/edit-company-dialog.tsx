'use client'

import { useTranslations } from 'next-intl'
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
import { CompanyForm } from './company-form'
import type { CreateCompanyInput } from '@crm/shared'

interface EditCompanyDialogProps {
	company: any
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditCompanyDialog({ company, open, onOpenChange }: EditCompanyDialogProps) {
	const t = useTranslations('companies')
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const updateMutation = useMutation(
		trpc.companies.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.companies.getById.queryKey({ id: company.id }) })
				queryClient.invalidateQueries({ queryKey: trpc.companies.list.queryKey() })
				toast.success(t('updateSuccess'))
				onOpenChange(false)
			},
			onError: (error) => {
				toast.error(error.message || t('updateError'))
			},
		}),
	)

	const onSubmit = (data: CreateCompanyInput) => {
		updateMutation.mutate({ id: company.id, ...data })
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{t('editTitle')}</DialogTitle>
					<DialogDescription>
						{t('editDescription')}
					</DialogDescription>
				</DialogHeader>
				<CompanyForm
					defaultValues={company}
					onSubmit={onSubmit}
					isLoading={updateMutation.isPending}
				/>
			</DialogContent>
		</Dialog>
	)
}
