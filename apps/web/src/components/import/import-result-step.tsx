'use client'

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
					<h3 className="text-lg font-semibold">Import Complete</h3>
					<p className="text-sm text-muted-foreground">{totalProcessed} rows processed.</p>
				</div>
			</div>

			<div className="flex gap-4 flex-wrap">
				{result.imported > 0 && (
					<Badge variant="secondary" className="text-sm text-green-700">
						{result.imported} imported
					</Badge>
				)}
				{result.updated > 0 && (
					<Badge variant="secondary" className="text-sm text-blue-700">
						{result.updated} updated
					</Badge>
				)}
				{result.skipped > 0 && (
					<Badge variant="secondary" className="text-sm">
						{result.skipped} skipped
					</Badge>
				)}
				{result.errors.length > 0 && (
					<Badge variant="destructive" className="text-sm">
						{result.errors.length} errors
					</Badge>
				)}
			</div>

			{hasErrors && (
				<div className="space-y-2">
					<h4 className="text-sm font-medium">Error Details</h4>
					<div className="rounded-md border overflow-auto max-h-[300px]">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[80px]">Row</TableHead>
									<TableHead className="w-[120px]">Field</TableHead>
									<TableHead>Error</TableHead>
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
					Import More
				</Button>
				<Link href="/contacts">
					<Button>View Contacts</Button>
				</Link>
			</div>
		</div>
	)
}
