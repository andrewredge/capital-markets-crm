"use client"

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'

export default function AccountPendingPage() {
    const t = useTranslations('auth.accountPending')
    const router = useRouter()

    const handleSignOut = async () => {
        await authClient.signOut()
        router.push('/login')
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full w-fit">
                        <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle>{t('title')}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t('message')}
                    </p>
                    <Button variant="outline" onClick={handleSignOut}>
                        {t('signOut')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
