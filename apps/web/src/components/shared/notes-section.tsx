'use client'

import { useState } from 'react'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
	Plus,
	MoreHorizontal,
	Edit2,
	Trash2,
	Pin,
	PinOff,
} from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AddNoteDialog } from './add-note-dialog'
import { EditNoteDialog } from './edit-note-dialog'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface NotesSectionProps {
	contactId?: string
	companyId?: string
	dealId?: string
	projectId?: string
}

function formatDate(date: Date | string) {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(new Date(date))
}

export function NotesSection({ contactId, companyId, dealId, projectId }: NotesSectionProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [isAddOpen, setIsAddOpen] = useState(false)
	const [editingNote, setEditingNote] = useState<{
		id: string
		title: string | null
		content: string
		isPinned: boolean
	} | null>(null)
	const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)

	const { data, isLoading } = useQuery(
		trpc.notes.list.queryOptions({
			contactId,
			companyId,
			dealId,
			projectId,
			limit: 50,
		}),
	)

	const deleteMutation = useMutation(
		trpc.notes.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.notes.list.queryKey() })
				toast.success('Note deleted')
				setDeletingNoteId(null)
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to delete note')
			},
		}),
	)

	const pinMutation = useMutation(
		trpc.notes.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.notes.list.queryKey() })
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update note')
			},
		}),
	)

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-xl font-bold">Notes</CardTitle>
				<Button size="sm" onClick={() => setIsAddOpen(true)}>
					<Plus className="h-4 w-4 mr-2" />
					Add Note
				</Button>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4 mt-4">
						{[1, 2].map((i) => (
							<div key={i} className="h-32 w-full bg-muted animate-pulse rounded-lg" />
						))}
					</div>
				) : !data?.items?.length ? (
					<div className="text-center py-8 text-muted-foreground">
						No notes yet. Add your first note.
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 mt-4">
						{data.items.map((note) => (
							<div
								key={note.id}
								className={cn(
									"group relative p-4 rounded-lg border bg-card transition-shadow hover:shadow-sm",
									note.isPinned && "border-primary/20 bg-primary/5 shadow-sm"
								)}
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 space-y-1">
										<div className="flex items-center gap-2">
											{note.isPinned && (
												<Pin className="h-3 w-3 text-primary fill-primary" />
											)}
											{note.title && (
												<h3 className="font-semibold text-sm">{note.title}</h3>
											)}
										</div>
										<p className="text-sm whitespace-pre-wrap text-foreground">
											{note.content}
										</p>
										<p className="text-[10px] text-muted-foreground pt-2">
											{formatDate(note.createdAt)}
										</p>
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
											onClick={() => pinMutation.mutate({ id: note.id, isPinned: !note.isPinned })}
										>
											{note.isPinned ? (
												<PinOff className="h-4 w-4 text-primary" />
											) : (
												<Pin className="h-4 w-4 text-muted-foreground" />
											)}
										</Button>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-7 w-7">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => setEditingNote(note)}>
													<Edit2 className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-destructive"
													onClick={() => setDeletingNoteId(note.id)}
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>

			<AddNoteDialog
				open={isAddOpen}
				onOpenChange={setIsAddOpen}
				contactId={contactId}
				companyId={companyId}
				dealId={dealId}
				projectId={projectId}
			/>

			{editingNote && (
				<EditNoteDialog
					note={editingNote}
					open={!!editingNote}
					onOpenChange={(open) => !open && setEditingNote(null)}
				/>
			)}

			<AlertDialog open={!!deletingNoteId} onOpenChange={(open) => !open && setDeletingNoteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Note</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this note? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deletingNoteId && deleteMutation.mutate({ id: deletingNoteId })}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	)
}
