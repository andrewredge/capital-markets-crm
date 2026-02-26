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
	DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CompanyForm } from './company-form'
import type { CreateCompanyInput } from '@crm/shared'

export function CreateCompanyDialog() {
	const t = useTranslations('companies')
	const [open, setOpen] = useState(false)
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const createMutation = useMutation(
		trpc.companies.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.companies.list.queryKey() })
				toast.success(t('createSuccess'))
				setOpen(false)
			},
			onError: (error) => {
				toast.error(error.message || t('createError'))
			},
		}),
	)

	const onSubmit = (data: CreateCompanyInput) => {
		createMutation.mutate(data)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="gap-2">
					<Plus className="h-4 w-4" />
					{t('createTitle')}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{t('createTitle')}</DialogTitle>
					<DialogDescription>
						{t('createDescription')}
					</DialogDescription>
				</DialogHeader>
				<CompanyForm onSubmit={onSubmit} isLoading={createMutation.isPending} />
			</DialogContent>
		</Dialog>
	)
}
