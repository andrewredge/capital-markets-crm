'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
	Mail,
	Phone,
	Linkedin,
	Globe,
	Calendar,
	ArrowLeft,
	Edit,
	Trash2,
	MoreHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EditContactDialog } from './edit-contact-dialog'
import { ContactCompanyRolesSection } from './contact-company-roles-section'
import { ActivityTimeline } from '@/components/shared/activity-timeline'
import { NotesSection } from '@/components/shared/notes-section'
import { EntityTags } from '@/components/shared/entity-tags'

interface ContactDetailProps {
	id: string
}

export function ContactDetail({ id }: ContactDetailProps) {
	const router = useRouter()
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const { data: contact, isLoading, error } = useQuery(
		trpc.contacts.getById.queryOptions({ id }),
	)

	const deleteMutation = useMutation(
		trpc.contacts.delete.mutationOptions({
			onSuccess: () => {
				toast.success('Contact deleted')
				router.push('/contacts')
				queryClient.invalidateQueries({ queryKey: trpc.contacts.list.queryKey() })
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to delete contact')
			},
		}),
	)

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-4" />
					<Skeleton className="h-4 w-20" />
				</div>
				<div className="flex justify-between items-start">
					<div className="space-y-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-32" />
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-9 w-20" />
						<Skeleton className="h-9 w-20" />
					</div>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<Skeleton className="h-64 w-full" />
					</div>
					<div className="space-y-6">
						<Skeleton className="h-48 w-full" />
					</div>
				</div>
			</div>
		)
	}

	if (error || !contact) {
		return (
			<div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
				<h2 className="text-xl font-semibold">Contact not found</h2>
				<Button variant="outline" asChild>
					<Link href="/contacts">Back to Contacts</Link>
				</Button>
			</div>
		)
	}

	const formatDate = (date: Date | string) => {
		return new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		}).format(new Date(date))
	}

	return (
		<div className="space-y-6">
			{/* Breadcrumbs */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground">
				<Link href="/" className="hover:text-foreground">Dashboard</Link>
				<span>/</span>
				<Link href="/contacts" className="hover:text-foreground">Contacts</Link>
				<span>/</span>
				<span className="text-foreground font-medium">
					{contact.firstName} {contact.lastName}
				</span>
			</nav>

			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
						{contact.firstName[0]}{contact.lastName[0]}
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							{contact.firstName} {contact.lastName}
						</h1>
						<div className="flex items-center gap-2 mt-1">
							<p className="text-muted-foreground">{contact.title || 'No title'}</p>
							<Badge variant="secondary" className="capitalize">
								{contact.status}
							</Badge>
						</div>
						<div className="mt-2">
							<EntityTags contactId={contact.id} />
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
						<Edit className="h-4 w-4 mr-2" />
						Edit
					</Button>
					<Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setIsDeleteDialogOpen(true)}>
						<Trash2 className="h-4 w-4 mr-2" />
						Delete
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Contact Information</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-0.5">
										<p className="text-xs text-muted-foreground">Email</p>
										{contact.email ? (
											<a href={`mailto:${contact.email}`} className="text-sm font-medium hover:underline">
												{contact.email}
											</a>
										) : (
											<p className="text-sm text-muted-foreground italic">No email</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-0.5">
										<p className="text-xs text-muted-foreground">Phone</p>
										{contact.phone ? (
											<p className="text-sm font-medium">{contact.phone}</p>
										) : (
											<p className="text-sm text-muted-foreground italic">No phone</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Linkedin className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-0.5">
										<p className="text-xs text-muted-foreground">LinkedIn</p>
										{contact.linkedinUrl ? (
											<a
												href={contact.linkedinUrl.startsWith('http') ? contact.linkedinUrl : `https://${contact.linkedinUrl}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm font-medium hover:underline flex items-center gap-1"
											>
												View Profile
											</a>
										) : (
											<p className="text-sm text-muted-foreground italic">No LinkedIn profile</p>
										)}
									</div>
								</div>
							</div>
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<Globe className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-0.5">
										<p className="text-xs text-muted-foreground">Source</p>
										<p className="text-sm font-medium">{contact.source || 'Direct'}</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-0.5">
										<p className="text-xs text-muted-foreground">Added on</p>
										<p className="text-sm font-medium">{formatDate(contact.createdAt)}</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<ActivityTimeline contactId={contact.id} />
					<NotesSection contactId={contact.id} />
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					<ContactCompanyRolesSection
						contactId={contact.id}
						roles={contact.contactCompanyRoles || []}
					/>
				</div>
			</div>

			<EditContactDialog
				contact={contact}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
			/>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the contact
							and all associated data.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutation.mutate({ id: contact.id })}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
