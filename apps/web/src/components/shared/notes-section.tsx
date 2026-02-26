'use client'

import { useTranslations } from 'next-intl'
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
	FileText,
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

interface NotesSectionProps {
	contactId?: string
	companyId?: string
	dealId?: string
	projectId?: string
}

export function NotesSection({ contactId, companyId, dealId, projectId }: NotesSectionProps) {
	const t = useTranslations('shared.notes')
	const tActions = useTranslations('actions')
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [isAddOpen, setIsAddOpen] = useState(false)
	const [editingNote, setEditingNote] = useState<{ id: string; title: string | null; content: string; isPinned: boolean } | null>(null)
	const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)

	const { data, isLoading } = useQuery(
		trpc.notes.list.queryOptions({
			contactId,
			companyId,
			dealId,
			projectId,
		}),
	)

	const deleteMutation = useMutation(
		trpc.notes.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.notes.list.queryKey() })
				toast.success(t('deleteSuccess'))
				setDeletingNoteId(null)
			},
			onError: (error) => {
				toast.error(error.message || t('deleteError'))
			},
		}),
	)

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-xl font-bold">{t('title')}</CardTitle>
				<Button size="sm" onClick={() => setIsAddOpen(true)}>
					<Plus className="h-4 w-4 mr-2" />
					{t('addNote')}
				</Button>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4 mt-4">
						{[1, 2].map((i) => (
							<div key={i} className="h-20 w-full bg-muted animate-pulse rounded-md" />
						))}
					</div>
				) : !data?.items?.length ? (
					<div className="text-center py-8 text-muted-foreground">
						{t('noNotes')}
					</div>
				) : (
					<div className="space-y-4 mt-4">
						{data.items.map((note) => (
							<div key={note.id} className="relative group p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
								<div className="flex justify-between items-start mb-2">
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<FileText className="h-3 w-3" />
										<span>{new Date(note.createdAt).toLocaleDateString()}</span>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => setEditingNote(note)}>
												<Edit2 className="h-4 w-4 mr-2" />
												{tActions('edit')}
											</DropdownMenuItem>
											<DropdownMenuItem 
												className="text-destructive"
												onClick={() => setDeletingNoteId(note.id)}
											>
												<Trash2 className="h-4 w-4 mr-2" />
												{tActions('delete')}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								<p className="text-sm whitespace-pre-wrap">{note.content}</p>
							</div>
						))}
					</div>
				)}
			</CardContent>

			<AddNoteDialog
				contactId={contactId}
				companyId={companyId}
				dealId={dealId}
				projectId={projectId}
				open={isAddOpen}
				onOpenChange={setIsAddOpen}
			/>

			{editingNote && (
				<EditNoteDialog
					note={editingNote}
					open={!!editingNote}
					onOpenChange={(open) => !open && setEditingNote(null)}
				/>
			)}

			<AlertDialog 
				open={!!deletingNoteId} 
				onOpenChange={(open) => !open && setDeletingNoteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{tActions('confirm')}</AlertDialogTitle>
						<AlertDialogDescription>
							{t('deleteConfirmMessage')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tActions('cancel')}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deletingNoteId && deleteMutation.mutate({ id: deletingNoteId })}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{tActions('delete')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	)
}
