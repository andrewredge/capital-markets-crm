"use client"

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
            toast.success('Account status updated')
        },
        onError: (e) => toast.error(e.message),
    })

    const updateRoleMutation = useMutation({
        mutationFn: (input: { userId: string; platformRole: 'user' | 'super_admin' }) =>
            trpcClient.platformAdmin.updatePlatformRole.mutate(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            toast.success('Platform role updated')
        },
        onError: (e) => toast.error(e.message),
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">Manage platform users and their access.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : !data?.items.length ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No users found
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
                                                {user.accountStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.platformRole === 'super_admin' ? 'default' : 'outline'}>
                                                {user.platformRole === 'super_admin' ? 'Super Admin' : 'User'}
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
                                                        Suspend
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
                                                        Activate
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
                                                        Promote
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
                                                        Demote
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
                                Showing {(page - 1) * data.limit + 1}-{Math.min(page * data.limit, data.total)} of {data.total}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page * data.limit >= data.total}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
