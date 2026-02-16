import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
    return (
        <AuthCard
            title="Sign in"
            description="Enter your credentials to access your account"
            footer={
                <p>Don't have an account?{' '}
                    <Link href="/register" className="text-primary underline">Register</Link>
                </p>
            }
        >
            <LoginForm />
        </AuthCard>
    )
}
