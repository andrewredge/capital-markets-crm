import { AuthCard } from '@/components/auth/auth-card'
import { RegisterForm } from '@/components/auth/register-form'
import Link from 'next/link'

export default function RegisterPage() {
    return (
        <AuthCard
            title="Create an account"
            description="Enter your details to get started"
            footer={
                <p>Already have an account?{' '}
                    <Link href="/login" className="text-primary underline">Sign in</Link>
                </p>
            }
        >
            <RegisterForm />
        </AuthCard>
    )
}
