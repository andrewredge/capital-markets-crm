'use client'

import { useTranslations } from 'next-intl'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
	const t = useTranslations('settings')

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<Link href="/settings/import">
					<Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
						<CardHeader>
							<div className="flex items-center gap-2 mb-2 text-primary">
								<Download className="h-5 w-5" />
								<CardTitle>{t('import.title')}</CardTitle>
							</div>
							<CardDescription>
								{t('import.description')}
							</CardDescription>
						</CardHeader>
					</Card>
				</Link>

				<Link href="/settings/enrichment">
					<Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
						<CardHeader>
							<div className="flex items-center gap-2 mb-2 text-primary">
								<Sparkles className="h-5 w-5" />
								<CardTitle>{t('enrichment.title')}</CardTitle>
							</div>
							<CardDescription>
								{t('enrichment.description')}
							</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
		</div>
	)
}
