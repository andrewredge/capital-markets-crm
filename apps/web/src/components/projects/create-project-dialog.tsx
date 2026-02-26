'use client'

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
import { ProjectForm } from './project-form'
import type { CreateProjectInput } from '@crm/shared'

interface CreateProjectDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const createMutation = useMutation(
		trpc.projects.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() })
				toast.success('Project created successfully')
				onOpenChange(false)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to create project')
			},
		}),
	)

	const onSubmit = (data: CreateProjectInput) => {
		createMutation.mutate(data)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Create New Project</DialogTitle>
					<DialogDescription>
						Add a new mining project or asset to your portfolio.
					</DialogDescription>
				</DialogHeader>
				<ProjectForm onSubmit={onSubmit} isLoading={createMutation.isPending} mode="create" />
			</DialogContent>
		</Dialog>
	)
}
