"use client"

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Search, Shield, ShieldOff } from 'lucide-react'

export default function AdminUsersPage() {
    const t = useTranslations('admin.users')
    const tTable = useTranslations('table')
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [page, setPage] = useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', search, statusFilter, page],
        queryFn: () =>
            trpcClient.platformAdmin.listUsers.query({
                search: search || undefined,
                accountStatus: statusFilter !== 'all' ? statusFilter as 'pending' | 'active' | 'suspended' : undefined,   
                page,
                limit: 25,
            }),
    })

    const updateStatusMutation = useMutation({
        mutationFn: (input: { userId: string; accountStatus: 'active' | 'suspended' }) =>
            trpcClient.platformAdmin.updateAccountStatus.mutate(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            toast.success(t('updateStatusSuccess'))
        },
        onError: (e) => toast.error(e.message),
    })

    const updateRoleMutation = useMutation({
        mutationFn: (input: { userId: string; platformRole: 'user' | 'super_admin' }) =>
            trpcClient.platformAdmin.updatePlatformRole.mutate(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            toast.success(t('updateRoleSuccess'))
        },
        onError: (e) => toast.error(e.message),
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground">{t('description')}</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> 
                            <Input
                                placeholder={t('searchPlaceholder')}
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={t('filterByStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                                <SelectItem value="active">{t('active')}</SelectItem>
                                <SelectItem value="pending">{t('pending')}</SelectItem>
                                <SelectItem value="suspended">{t('suspended')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('columns.name')}</TableHead>
                                <TableHead>{t('columns.email')}</TableHead>
                                <TableHead>{t('columns.status')}</TableHead>
                                <TableHead>{t('columns.role')}</TableHead>
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
                            ) : !data?.items.length ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {t('noUsers')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.items.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    user.accountStatus === 'active'
                                                        ? 'default'
                                                        : user.accountStatus === 'suspended'
                                                        ? 'destructive'
                                                        : 'secondary'
                                                }
                                            >
                                                {t(user.accountStatus as 'active' | 'pending' | 'suspended')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.platformRole === 'super_admin' ? 'default' : 'outline'}> 
                                                {user.platformRole === 'super_admin' ? t('roles.superAdmin') : t('roles.user')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.accountStatus === 'active' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            updateStatusMutation.mutate({
                                                                userId: user.id,
                                                                accountStatus: 'suspended',
                                                            })
                                                        }
                                                    >
                                                        <ShieldOff className="h-4 w-4 mr-1" />
                                                        {t('actions.suspend')}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            updateStatusMutation.mutate({
                                                                userId: user.id,
                                                                accountStatus: 'active',
                                                            })
                                                        }
                                                    >
                                                        <Shield className="h-4 w-4 mr-1" />
                                                        {t('actions.activate')}
                                                    </Button>
                                                )}
                                                {user.platformRole === 'user' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            updateRoleMutation.mutate({
                                                                userId: user.id,
                                                                platformRole: 'super_admin',
                                                            })
                                                        }
                                                    >
                                                        {t('actions.promote')}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            updateRoleMutation.mutate({
                                                                userId: user.id,
                                                                platformRole: 'user',
                                                            })
                                                        }
                                                    >
                                                        {t('actions.demote')}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {data && data.total > data.limit && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                {tTable('showing', {
                                    from: (page - 1) * data.limit + 1,
                                    to: Math.min(page * data.limit, data.total),
                                    total: data.total
                                })}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    {tTable('previous')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page * data.limit >= data.total}
                                    onClick={() => setPage(page + 1)}
                                >
                                    {tTable('next')}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
