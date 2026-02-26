'use client'

import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { X, Tag as TagIcon } from 'lucide-react'
import { TagCombobox } from './tag-combobox'
import { toast } from 'sonner'

interface EntityTagsProps {
	contactId?: string
	companyId?: string
	dealId?: string
	projectId?: string
}

export function EntityTags({ contactId, companyId, dealId, projectId }: EntityTagsProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data: tags, isLoading } = useQuery(
		trpc.tags.getForEntity.queryOptions({ contactId, companyId, dealId, projectId })
	)

	const addTagMutation = useMutation(
		trpc.tags.addTagging.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.tags.getForEntity.queryKey({ contactId, companyId, dealId, projectId }) })
				toast.success('Tag added')
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to add tag')
			},
		})
	)

	const removeTagMutation = useMutation(
		trpc.tags.removeTagging.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.tags.getForEntity.queryKey({ contactId, companyId, dealId, projectId }) })
				toast.success('Tag removed')
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to remove tag')
			},
		})
	)

	const handleSelectTag = (tagId: string) => {
		addTagMutation.mutate({ tagId, contactId, companyId, dealId, projectId })
	}

	if (isLoading) {
		return <div className="flex gap-2"><div className="h-6 w-16 bg-muted animate-pulse rounded-full" /></div>
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<TagIcon className="h-4 w-4 text-muted-foreground mr-1" />
			{tags?.map((tag) => (
				<Badge
					key={tag.taggingId}
					variant="outline"
					style={{
						borderColor: tag.color || '#6B7280',
						color: tag.color || '#6B7280',
						backgroundColor: tag.color ? `${tag.color}10` : '#6B728010'
					}}
					className="text-xs py-0 pr-1 pl-2 h-6 flex items-center gap-1"
				>
					{tag.name}
					<button
						onClick={() => removeTagMutation.mutate({ id: tag.taggingId })}
						className="hover:bg-background/20 rounded-full p-0.5 transition-colors"
						disabled={removeTagMutation.isPending}
					>
						<X className="h-3 w-3" />
					</button>
				</Badge>
			))}
			<TagCombobox
				onSelect={handleSelectTag}
				excludeTagIds={tags?.map(t => t.tagId)}
			/>
		</div>
	)
}
