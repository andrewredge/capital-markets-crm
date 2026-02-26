"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { completeInvitationSchema } from '@crm/shared'
import type { CompleteInvitationInput } from '@crm/shared'
import { trpcClient } from '@/lib/trpc'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

function InviteFormContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token') ?? ''
    const [completed, setCompleted] = useState(false)

    const { data: invitation, isLoading, error } = useQuery({
        queryKey: ['invitation', token],
        queryFn: () => trpcClient.platformAdmin.validateInvitation.query({ token }),
        enabled: !!token,
        retry: false,
    })

    const completeMutation = useMutation({
        mutationFn: (input: CompleteInvitationInput) =>
            trpcClient.platformAdmin.completeInvitation.mutate(input),
        onSuccess: () => {
            setCompleted(true)
            setTimeout(() => router.push('/login'), 2000)
        },
    })

    const form = useForm({
        resolver: zodResolver(completeInvitationSchema.omit({ token: true })),
        defaultValues: { name: '', password: '' },
    })

    if (!token) {
        return (
            <AuthCard title="Invalid Link" description="No invitation token provided">
                <div className="flex items-center gap-2 text-destructive py-4">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">This link is missing the invitation token.</p>
                </div>
            </AuthCard>
        )
    }

    if (isLoading) {
        return (
            <AuthCard title="Validating Invitation" description="Please wait...">
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </AuthCard>
        )
    }

    if (error || !invitation) {
        return (
            <AuthCard title="Invalid Invitation" description="This invitation is no longer valid">
                <div className="flex items-center gap-2 text-destructive py-4">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">This invitation may have expired or already been used.</p>
                </div>
            </AuthCard>
        )
    }

    if (completed) {
        return (
            <AuthCard title="Account Created" description="Redirecting to login...">
                <div className="flex items-center gap-2 text-green-600 py-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-sm">Your account has been created. Redirecting...</p>
                </div>
            </AuthCard>
        )
    }

    return (
        <AuthCard
            title="Complete Registration"
            description={`You've been invited to join as ${invitation.email}`}
        >
            <form
                onSubmit={form.handleSubmit((data) =>
                    completeMutation.mutate({ ...data, token })
                )}
                className="space-y-4"
            >
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        {...form.register('name')}
                        placeholder="Your full name"
                    />
                    {form.formState.errors.name && (
                        <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        value={invitation.email}
                        disabled
                        className="bg-muted"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        {...form.register('password')}
                        placeholder="At least 8 characters"
                    />
                    {form.formState.errors.password && (
                        <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                    )}
                </div>

                {completeMutation.error && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{completeMutation.error.message}</span>
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={completeMutation.isPending}>
                    {completeMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                        </>
                    ) : (
                        'Create Account'
                    )}
                </Button>
            </form>
        </AuthCard>
    )
}

export default function InvitePage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Suspense fallback={
                <AuthCard title="Loading..." description="Please wait">
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </AuthCard>
            }>
                <InviteFormContent />
            </Suspense>
        </div>
    )
}
