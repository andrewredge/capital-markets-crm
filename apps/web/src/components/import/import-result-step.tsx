'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ImportResult } from '@crm/shared'

interface ImportResultStepProps {
	result: ImportResult
	onImportMore: () => void
}

export function ImportResultStep({ result, onImportMore }: ImportResultStepProps) {
	const t = useTranslations('settings.import.result')
	const hasErrors = result.errors.length > 0
	const totalProcessed = result.imported + result.updated + result.skipped + result.errors.length

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				{hasErrors ? (
					<AlertTriangle className="h-8 w-8 text-yellow-500" />
				) : (
					<CheckCircle2 className="h-8 w-8 text-green-500" />
				)}
				<div>
					<h3 className="text-lg font-semibold">{t('title')}</h3>
					<p className="text-sm text-muted-foreground">{t('rowsProcessed', { count: totalProcessed })}</p>
				</div>
			</div>

			<div className="flex gap-4 flex-wrap">
				{result.imported > 0 && (
					<Badge variant="secondary" className="text-sm text-green-700">
						{t('imported', { count: result.imported })}
					</Badge>
				)}
				{result.updated > 0 && (
					<Badge variant="secondary" className="text-sm text-blue-700">
						{t('updated', { count: result.updated })}
					</Badge>
				)}
				{result.skipped > 0 && (
					<Badge variant="secondary" className="text-sm">
						{t('skipped', { count: result.skipped })}
					</Badge>
				)}
				{result.errors.length > 0 && (
					<Badge variant="destructive" className="text-sm">
						{t('errors', { count: result.errors.length })}
					</Badge>
				)}
			</div>

			{result.flaggedForReview > 0 && (
				<div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex gap-3 items-start">
					<AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
					<div className="flex-1 space-y-1">
						<p className="text-sm font-medium text-amber-800 dark:text-amber-400">
							{t('flaggedForReview', { count: result.flaggedForReview })}
						</p>
						<p className="text-xs text-amber-700 dark:text-amber-500">
							{t('flaggedDescription')}
						</p>
						<div className="pt-2">
							<Link href="/settings/enrichment" className="text-xs font-semibold text-amber-800 dark:text-amber-400 hover:underline inline-flex items-center gap-1">
								{t('goToEnrichment')}
							</Link>
						</div>
					</div>
				</div>
			)}

			{hasErrors && (
				<div className="space-y-2">
					<h4 className="text-sm font-medium">{t('errorDetails')}</h4>
					<div className="rounded-md border overflow-auto max-h-[300px]">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[80px]">{t('errorRow')}</TableHead>
									<TableHead className="w-[120px]">{t('errorField')}</TableHead>
									<TableHead>{t('errorMessage')}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{result.errors.map((err, i) => (
									<TableRow key={i}>
										<TableCell>{err.row}</TableCell>
										<TableCell className="text-muted-foreground">{err.field || '—'}</TableCell>
										<TableCell>{err.message}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			)}

			<div className="flex gap-3">
				<Button variant="outline" onClick={onImportMore}>
					{t('importMore')}
				</Button>
				<Link href="/contacts">
					<Button>{t('viewContacts')}</Button>
				</Link>
			</div>
		</div>
	)
}
