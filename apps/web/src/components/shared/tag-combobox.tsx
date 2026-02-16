'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface TagComboboxProps {
	onSelect: (tagId: string) => void
	excludeTagIds?: string[]
}

export function TagCombobox({ onSelect, excludeTagIds = [] }: TagComboboxProps) {
	const [open, setOpen] = React.useState(false)
	const [search, setSearch] = React.useState('')
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data, isLoading } = useQuery(
		trpc.tags.list.queryOptions({ limit: 100 })
	)

	const createMutation = useMutation(
		trpc.tags.create.mutationOptions({
			onSuccess: (newTag) => {
				queryClient.invalidateQueries({ queryKey: trpc.tags.list.queryKey() })
				if (newTag) {
					onSelect(newTag.id)
					toast.success(`Tag "${newTag.name}" created`)
				}
				setOpen(false)
				setSearch('')
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to create tag')
			},
		})
	)

	const filteredTags = React.useMemo(() => {
		if (!data?.items) return []
		return data.items.filter(tag => !excludeTagIds.includes(tag.id))
	}, [data?.items, excludeTagIds])

	const exactMatch = React.useMemo(() => {
		if (!search) return true
		return data?.items?.some(tag => tag.name.toLowerCase() === search.toLowerCase())
	}, [data?.items, search])

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					size="sm"
					className="h-7 w-7 rounded-full p-0"
				>
					<Plus className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search tags..."
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>No tags found.</CommandEmpty>
						<CommandGroup>
							{filteredTags
								.filter(tag => tag.name.toLowerCase().includes(search.toLowerCase()))
								.map((tag) => (
									<CommandItem
										key={tag.id}
										value={tag.id}
										onSelect={() => {
											onSelect(tag.id)
											setOpen(false)
											setSearch('')
										}}
									>
										<div
											className="mr-2 h-2 w-2 rounded-full"
											style={{ backgroundColor: tag.color || '#6B7280' }}
										/>
										{tag.name}
									</CommandItem>
								))}
						</CommandGroup>
						{!exactMatch && search && (
							<CommandGroup heading="New Tag">
								<CommandItem
									value={search}
									onSelect={() => createMutation.mutate({ name: search })}
								>
									<Plus className="mr-2 h-4 w-4" />
									Create "{search}"
								</CommandItem>
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
