'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
	Upload,
	Download,
	MoreHorizontal,
	Edit2,
	Trash2,
	FileText,
	Image,
	FileSpreadsheet,
	Presentation,
	File,
	X,
} from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { EditDocumentDialog } from './edit-document-dialog'
import { formatFileSize, getFileIconType } from '@/lib/file-utils'
import { DOCUMENT_TYPE_OPTIONS } from '@crm/shared/constants'
import { toast } from 'sonner'

interface DocumentsSectionProps {
	contactId?: string
	companyId?: string
	dealId?: string
	projectId?: string
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
	const type = getFileIconType(mimeType)
	switch (type) {
		case 'pdf':
			return <FileText className={className} />
		case 'image':
			return <Image className={className} />
		case 'spreadsheet':
			return <FileSpreadsheet className={className} />
		case 'presentation':
			return <Presentation className={className} />
		case 'text':
			return <FileText className={className} />
		default:
			return <File className={className} />
	}
}

function formatDate(date: Date | string) {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(new Date(date))
}

export function DocumentsSection({ contactId, companyId, dealId, projectId }: DocumentsSectionProps) {
	const t = useTranslations('shared.documents')
	const tActions = useTranslations('actions')
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [uploading, setUploading] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(0)
	const [dragOver, setDragOver] = useState(false)
	const [documentType, setDocumentType] = useState<string>('other')
	const [editingDoc, setEditingDoc] = useState<{
		id: string; documentType: string; description: string | null; visibility: string
	} | null>(null)
	const [deletingDocId, setDeletingDocId] = useState<string | null>(null)

	const { data, isLoading } = useQuery(
		trpc.documents.list.queryOptions({
			contactId,
			companyId,
			dealId,
			projectId,
			limit: 50,
		}),
	)

	const getUploadUrlMutation = useMutation(
		trpc.documents.getUploadUrl.mutationOptions(),
	)

	const confirmUploadMutation = useMutation(
		trpc.documents.confirmUpload.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.documents.list.queryKey() })
				toast.success(t('uploadSuccess'))
				setUploading(false)
				setUploadProgress(0)
			},
			onError: (error) => {
				toast.error(error.message || t('uploadError'))
				setUploading(false)
				setUploadProgress(0)
			},
		}),
	)

	const deleteMutation = useMutation(
		trpc.documents.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.documents.list.queryKey() })
				toast.success(t('deleteSuccess'))
				setDeletingDocId(null)
			},
			onError: (error) => {
				toast.error(error.message || t('deleteError'))
			},
		}),
	)

	const handleUpload = useCallback(
		async (file: File) => {
			if (file.size > 100 * 1024 * 1024) {
				toast.error(t('fileTooLarge'))
				return
			}

			setUploading(true)
			setUploadProgress(10)

			try {
				// 1. Get presigned URL
				const { url, storageKey } = await getUploadUrlMutation.mutateAsync({
					fileName: file.name,
					fileSize: file.size,
					mimeType: file.type || 'application/octet-stream',
					contactId,
					companyId,
					dealId,
					projectId,
					documentType: documentType as any,
				})

				setUploadProgress(30)

				// 2. Upload directly to S3/MinIO
				const uploadResponse = await fetch(url, {
					method: 'PUT',
					body: file,
					headers: {
						'Content-Type': file.type || 'application/octet-stream',
					},
				})

				if (!uploadResponse.ok) {
					throw new Error(t('uploadStorageFailed'))
				}

				setUploadProgress(80)

				// 3. Confirm upload with metadata
				await confirmUploadMutation.mutateAsync({
					storageKey,
					fileName: file.name,
					fileSize: file.size,
					mimeType: file.type || 'application/octet-stream',
					contactId,
					companyId,
					dealId,
					projectId,
					documentType: documentType as any,
				})

				setUploadProgress(100)
			} catch (e) {
				toast.error(e instanceof Error ? e.message : t('uploadFailed'))
				setUploading(false)
				setUploadProgress(0)
			}
		},
		[contactId, companyId, dealId, projectId, documentType, getUploadUrlMutation, confirmUploadMutation, t],
	)

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setDragOver(false)
			const file = e.dataTransfer.files[0]
			if (file) handleUpload(file)
		},
		[handleUpload],
	)

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (file) handleUpload(file)
			// Reset input so the same file can be re-selected
			e.target.value = ''
		},
		[handleUpload],
	)

	const handleDownload = useCallback(
		async (docId: string) => {
			try {
				const result = await trpc.documents.getDownloadUrl.queryOptions({ id: docId })
				// Use the query client to fetch
				const data = await queryClient.fetchQuery(result)
				window.open(data.url, '_blank')
			} catch {
				toast.error(t('downloadError'))
			}
		},
		[trpc, queryClient],
	)

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-xl font-bold">{t('title')}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Upload zone */}
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Select value={documentType} onValueChange={setDocumentType}>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder={t('form.type')} />
							</SelectTrigger>
							<SelectContent>
								{DOCUMENT_TYPE_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{uploading ? (
						<div className="rounded-lg border p-4 space-y-2">
							<p className="text-sm text-muted-foreground">{tActions('loading')}</p>
							<Progress value={uploadProgress} />
						</div>
					) : (
						<label
							className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
								dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
							}`}
							onDragOver={(e) => {
								e.preventDefault()
								setDragOver(true)
							}}
							onDragLeave={() => setDragOver(false)}
							onDrop={handleDrop}
						>
							<Upload className="h-6 w-6 text-muted-foreground mb-2" />
							<p className="text-sm font-medium">{t('dropZone')}</p>
							<p className="text-xs text-muted-foreground mt-1">{t('maxSize')}</p>
							<input
								type="file"
								className="hidden"
								onChange={handleInputChange}
								disabled={uploading}
							/>
						</label>
					)}
				</div>

				{/* Document list */}
				{isLoading ? (
					<div className="space-y-3">
						{[1, 2].map((i) => (
							<div key={i} className="h-16 w-full bg-muted animate-pulse rounded-lg" />
						))}
					</div>
				) : !data?.items?.length ? (
					<div className="text-center py-4 text-muted-foreground text-sm">
						{t('noDocuments')}
					</div>
				) : (
					<div className="space-y-2">
						{data.items.map((doc) => (
							<div
								key={doc.id}
								className="group flex items-center gap-3 rounded-lg border p-3 transition-shadow hover:shadow-sm"
							>
								<div className="flex-shrink-0">
									<FileIcon mimeType={doc.mimeType} className="h-8 w-8 text-muted-foreground" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{doc.fileName}</p>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<span>{formatFileSize(doc.fileSize)}</span>
										<span>&middot;</span>
										<span>{formatDate(doc.createdAt)}</span>
										{doc.documentType !== 'other' && (
											<>
												<span>&middot;</span>
												<Badge variant="secondary" className="text-[10px] px-1.5 py-0">
													{DOCUMENT_TYPE_OPTIONS.find((o) => o.value === doc.documentType)?.label ?? doc.documentType}
												</Badge>
											</>
										)}
										{doc.visibility === 'showcase' && (
											<Badge variant="outline" className="text-[10px] px-1.5 py-0">
												{t('showcase')}
											</Badge>
										)}
									</div>
									{doc.description && (
										<p className="text-xs text-muted-foreground mt-1 truncate">{doc.description}</p>
									)}
								</div>
								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => handleDownload(doc.id)}
									>
										<Download className="h-4 w-4" />
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="h-7 w-7">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => setEditingDoc(doc)}>
												<Edit2 className="h-4 w-4 mr-2" />
												{tActions('edit')}
											</DropdownMenuItem>
											<DropdownMenuItem
												className="text-destructive"
												onClick={() => setDeletingDocId(doc.id)}
											>
												<Trash2 className="h-4 w-4 mr-2" />
												{tActions('delete')}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>

			{editingDoc && (
				<EditDocumentDialog
					document={editingDoc}
					open={!!editingDoc}
					onOpenChange={(open) => !open && setEditingDoc(null)}
				/>
			)}

			<AlertDialog open={!!deletingDocId} onOpenChange={(open) => !open && setDeletingDocId(null)}>
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
							onClick={() => deletingDocId && deleteMutation.mutate({ id: deletingDocId })}
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
