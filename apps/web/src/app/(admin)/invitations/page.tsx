"use client"

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendPlatformInviteSchema } from '@crm/shared'
import type { SendPlatformInviteInput } from '@crm/shared'
import { trpcClient } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Mail, Copy, X } from 'lucide-react'

export default function AdminInvitationsPage() {
    const t = useTranslations('admin.invitations')
    const tTable = useTranslations('table')
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)

    const { data: invitations, isLoading } = useQuery({
        queryKey: ['admin-invitations'],
        queryFn: () =>
            trpcClient.platformAdmin.listInvitations.query({ page: 1, limit: 50 }),
    })

    const { data: orgs } = useQuery({
        queryKey: ['admin-organizations'],
        queryFn: () => trpcClient.platformAdmin.listOrganizations.query(),
    })

    const form = useForm({
        resolver: zodResolver(sendPlatformInviteSchema),
        defaultValues: { email: '', platformRole: 'user' as const, organizationId: undefined as string | undefined },     
    })

    const sendMutation = useMutation({
        mutationFn: (input: SendPlatformInviteInput) =>
            trpcClient.platformAdmin.sendInvitation.mutate(input),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-invitations'] })
            form.reset()
            setShowForm(false)
            // Copy invite link to clipboard
            const url = `${window.location.origin}/invite?token=${(data as { token: string }).token}`
            navigator.clipboard.writeText(url)
            toast.success(t('messages.sendSuccess'))
        },
        onError: (e) => toast.error(e.message),
    })

    const revokeMutation = useMutation({
        mutationFn: (invitationId: string) =>
            trpcClient.platformAdmin.revokeInvitation.mutate({ invitationId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-invitations'] })
            toast.success(t('messages.revokeSuccess'))
        },
        onError: (e) => toast.error(e.message),
    })

    const copyInviteLink = (token: string) => {
        const url = `${window.location.origin}/invite?token=${token}`
        navigator.clipboard.writeText(url)
        toast.success(t('messages.copySuccess'))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Mail className="h-4 w-4 mr-2" />
                    {t('sendInvitation')}
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('newInvitation')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={form.handleSubmit((data) => sendMutation.mutate(data as SendPlatformInviteInput))}  
                            className="flex flex-col gap-4 sm:flex-row sm:items-end"
                        >
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="email">{t('form.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...form.register('email')}
                                    placeholder="user@example.com"
                                />
                                {form.formState.errors.email && (
                                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>     
                                )}
                            </div>

                            <div className="w-[180px] space-y-2">
                                <Label>{t('form.role')}</Label>
                                <Select
                                    value={form.watch('platformRole')}
                                    onValueChange={(v) => form.setValue('platformRole', v as 'user' | 'super_admin')}     
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">{t('roles.user')}</SelectItem>
                                        <SelectItem value="super_admin">{t('roles.superAdmin')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-[220px] space-y-2">
                                <Label>{t('form.org')}</Label>
                                <Select
                                    value={form.watch('organizationId') ?? 'none'}
                                    onValueChange={(v) => form.setValue('organizationId', v === 'none' ? undefined : v)}  
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('form.noOrg')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">{t('form.noOrg')}</SelectItem>
                                        {orgs?.map((org) => (
                                            <SelectItem key={org.id} value={org.id}>
                                                {org.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" disabled={sendMutation.isPending}>
                                {sendMutation.isPending ? t('form.sending') : t('form.send')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('form.email')}</TableHead>
                                <TableHead>{t('form.role')}</TableHead>
                                <TableHead>{t('columns.status')}</TableHead>
                                <TableHead>{t('columns.expires')}</TableHead>
                                <TableHead>{t('columns.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {tTable('loading')}
                                    </TableCell>
                                </TableRow>
                            ) : !invitations?.items.length ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {t('noInvitations')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invitations.items.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium">{inv.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={inv.platformRole === 'super_admin' ? 'default' : 'outline'}>  
                                                {inv.platformRole === 'super_admin' ? t('roles.superAdmin') : t('roles.user')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    inv.status === 'pending'
                                                        ? 'secondary'
                                                        : inv.status === 'accepted'
                                                        ? 'default'
                                                        : 'destructive'
                                                }
                                            >
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(inv.expiresAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {inv.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyInviteLink(inv.token)}
                                                        >
                                                            <Copy className="h-4 w-4 mr-1" />
                                                            {t('actions.copyLink')}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => revokeMutation.mutate(inv.id)}
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            {t('actions.revoke')}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
