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
import { format } from 'date-fns'

interface EditProjectDialogProps {
	project: any
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const updateMutation = useMutation(
		trpc.projects.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() })
				queryClient.invalidateQueries({ queryKey: trpc.projects.getById.queryKey({ id: project.id }) })
				toast.success('Project updated successfully')
				onOpenChange(false)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update project')
			},
		}),
	)

	const onSubmit = (data: CreateProjectInput) => {
		updateMutation.mutate({ id: project.id, ...data })
	}

	// Prepare default values
	const defaultValues = {
		...project,
		tenureExpiry: project.tenureExpiry ? format(new Date(project.tenureExpiry), 'yyyy-MM-dd') : '',
		latitude: project.latitude ? parseFloat(project.latitude) : undefined,
		longitude: project.longitude ? parseFloat(project.longitude) : undefined,
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[700px]">
				<DialogHeader>
					<DialogTitle>Edit Project</DialogTitle>
					<DialogDescription>
						Update the details for {project.name}.
					</DialogDescription>
				</DialogHeader>
				<ProjectForm 
					defaultValues={defaultValues} 
					onSubmit={onSubmit} 
					isLoading={updateMutation.isPending} 
					mode="edit" 
				/>
			</DialogContent>
		</Dialog>
	)
}
