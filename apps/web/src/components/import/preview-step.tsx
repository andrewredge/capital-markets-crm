'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { createContactSchema, type CrmContactField, type DuplicateStrategy, DUPLICATE_STRATEGIES } from '@crm/shared'

interface MappedRow {
	data: Record<string, string>
	errors: { field: string; message: string }[]
	rowIndex: number
}

interface PreviewStepProps {
	headers: string[]
	rows: string[][]
	mapping: Record<string, CrmContactField | 'skip'>
	duplicateStrategy: DuplicateStrategy
	onDuplicateStrategyChange: (strategy: DuplicateStrategy) => void
}

function applyMapping(
	headers: string[],
	rows: string[][],
	mapping: Record<string, CrmContactField | 'skip'>,
): MappedRow[] {
	return rows.map((row, rowIndex) => {
		const data: Record<string, string> = {}
		for (let i = 0; i < headers.length; i++) {
			const field = mapping[headers[i]!]
			if (field && field !== 'skip') {
				data[field] = row[i] || ''
			}
		}

		const result = createContactSchema.safeParse(data)
		const errors: { field: string; message: string }[] = []
		if (!result.success) {
			for (const issue of result.error.issues) {
				errors.push({
					field: issue.path[0]?.toString() || 'unknown',
					message: issue.message,
				})
			}
		}

		return { data, errors, rowIndex: rowIndex + 1 }
	})
}

export function PreviewStep({
	headers,
	rows,
	mapping,
	duplicateStrategy,
	onDuplicateStrategyChange,
}: PreviewStepProps) {
	const t = useTranslations('settings.import.previewStep')
	const tFields = useTranslations('settings.import.columnMapping.fields')
	const mappedRows = useMemo(() => applyMapping(headers, rows, mapping), [headers, rows, mapping])

	const activeFields = useMemo(() => {
		const fields: CrmContactField[] = []
		for (const header of headers) {
			const field = mapping[header]
			if (field && field !== 'skip') fields.push(field)
		}
		return fields
	}, [headers, mapping])

	const validCount = mappedRows.filter((r) => r.errors.length === 0).length
	const errorCount = mappedRows.filter((r) => r.errors.length > 0).length
	const previewRows = mappedRows.slice(0, 20)

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold">{t('title')}</h3>
				<p className="text-sm text-muted-foreground">{t('description')}</p>
			</div>

			<div className="flex gap-4">
				<Badge variant="secondary" className="text-sm">
					{t('totalRows', { count: rows.length })}
				</Badge>
				<Badge variant="secondary" className="text-sm text-green-700">
					{t('valid', { count: validCount })}
				</Badge>
				{errorCount > 0 && (
					<Badge variant="destructive" className="text-sm">
						{t('withErrors', { count: errorCount })}
					</Badge>
				)}
			</div>

			<div className="rounded-md border overflow-auto max-h-[400px]">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[60px]">{t('row')}</TableHead>
							{activeFields.map((field) => (
								<TableHead key={field}>{tFields(field)}</TableHead>
							))}
							<TableHead className="w-[100px]">{t('status')}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{previewRows.map((row) => (
							<TableRow key={row.rowIndex} className={row.errors.length > 0 ? 'bg-destructive/5' : ''}>
								<TableCell className="text-muted-foreground">{row.rowIndex}</TableCell>
								{activeFields.map((field) => {
									const fieldError = row.errors.find((e) => e.field === field)
									return (
										<TableCell key={field}>
											{fieldError ? (
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<span className="text-destructive border-b border-destructive border-dashed cursor-help">
																{row.data[field] || t('empty')}
															</span>
														</TooltipTrigger>
														<TooltipContent>{fieldError.message}</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											) : (
												row.data[field] || ''
											)}
										</TableCell>
									)
								})}
								<TableCell>
									{row.errors.length > 0 ? (
										<Badge variant="destructive" className="text-xs">
											{t('errorCount', { count: row.errors.length })}
										</Badge>
									) : (
										<Badge variant="secondary" className="text-xs">
											{t('ok')}
										</Badge>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{rows.length > 20 && (
				<p className="text-sm text-muted-foreground">{t('showingFirst', { count: rows.length })}</p>
			)}

			<div className="space-y-3">
				<label className="text-sm font-medium">{t('duplicateHandling')}</label>
				<RadioGroup
					value={duplicateStrategy}
					onValueChange={(v) => onDuplicateStrategyChange(v as DuplicateStrategy)}
					className="space-y-2"
				>
					{DUPLICATE_STRATEGIES.map((strategy) => (
						<div key={strategy} className="flex items-start space-x-3">
							<RadioGroupItem value={strategy} id={strategy} className="mt-0.5" />
							<div>
								<label htmlFor={strategy} className="text-sm font-medium cursor-pointer">
									{t(`strategies.${strategy}`)}
								</label>
								<p className="text-xs text-muted-foreground">{t(`strategies.${strategy}Description`)}</p>
							</div>
						</div>
					))}
				</RadioGroup>
			</div>
		</div>
	)
}

/** Export for use by the wizard to compute valid contacts to send */
export function getValidContacts(
	headers: string[],
	rows: string[][],
	mapping: Record<string, CrmContactField | 'skip'>,
) {
	const mapped = applyMapping(headers, rows, mapping)
	return mapped.filter((r) => r.errors.length === 0).map((r) => r.data)
}
