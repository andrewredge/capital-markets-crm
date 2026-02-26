import { AuthCard } from '@/components/auth/auth-card'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function RegisterPage() {
    return (
        <AuthCard
            title="Registration by Invitation Only"
            description="New accounts require an invitation from a platform administrator"
            footer={
                <p>Already have an account?{' '}
                    <Link href="/login" className="text-primary underline">Sign in</Link>
                </p>
            }
        >
            <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="p-3 bg-muted rounded-full">
                    <Mail className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-sm">
                    To create an account, you need an invitation link from a platform administrator.
                    If you believe you should have access, please contact your administrator.
                </p>
            </div>
        </AuthCard>
    )
}
