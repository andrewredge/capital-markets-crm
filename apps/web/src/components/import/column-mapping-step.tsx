'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { COLUMN_ALIAS_MAP, CRM_CONTACT_FIELDS, type CrmContactField } from '@crm/shared'

const REQUIRED_FIELDS: CrmContactField[] = ['firstName', 'lastName']

interface ColumnMappingStepProps {
	headers: string[]
	sampleRows: string[][]
	mapping: Record<string, CrmContactField | 'skip'>
	onMappingChange: (mapping: Record<string, CrmContactField | 'skip'>) => void
}

/** Auto-map source columns to CRM fields using the alias table */
export function autoMapColumns(headers: string[]): Record<string, CrmContactField | 'skip'> {
	const mapping: Record<string, CrmContactField | 'skip'> = {}
	const usedFields = new Set<CrmContactField>()

	for (const header of headers) {
		const normalized = header.toLowerCase().trim()
		const match = COLUMN_ALIAS_MAP[normalized]
		if (match && !usedFields.has(match)) {
			mapping[header] = match
			usedFields.add(match)
		} else {
			mapping[header] = 'skip'
		}
	}

	return mapping
}

export function ColumnMappingStep({ headers, sampleRows, mapping, onMappingChange }: ColumnMappingStepProps) {
	const t = useTranslations('settings.import.columnMapping')
	// Stabilize callback ref to avoid re-render loops from inline function props
	const onMappingChangeRef = useRef(onMappingChange)
	onMappingChangeRef.current = onMappingChange

	// Auto-map on first render if mapping is empty
	useEffect(() => {
		if (Object.keys(mapping).length === 0) {
			onMappingChangeRef.current(autoMapColumns(headers))
		}
	}, [headers, mapping])

	const usedFields = useMemo(() => {
		const used = new Set<CrmContactField>()
		for (const value of Object.values(mapping)) {
			if (value !== 'skip') used.add(value)
		}
		return used
	}, [mapping])

	const missingRequired = REQUIRED_FIELDS.filter((f) => !usedFields.has(f))

	const handleChange = (header: string, value: string) => {
		onMappingChange({ ...mapping, [header]: value as CrmContactField | 'skip' })
	}

	const preview = sampleRows.slice(0, 3)

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold">{t('title')}</h3>
				<p className="text-sm text-muted-foreground">
					{t('description')}
				</p>
			</div>

			{missingRequired.length > 0 && (
				<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{t('requiredNotMapped', { fields: missingRequired.map((f) => t(`fields.${f}`)).join(', ') })}
				</div>
			)}

			<div className="rounded-md border overflow-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[200px]">{t('sourceColumn')}</TableHead>
							<TableHead className="w-[200px]">{t('mapsTo')}</TableHead>
							<TableHead>{t('preview')}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{headers.map((header) => (
							<TableRow key={header}>
								<TableCell className="font-medium">{header}</TableCell>
								<TableCell>
									<Select value={mapping[header] || 'skip'} onValueChange={(v) => handleChange(header, v)}>
										<SelectTrigger className="w-[180px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="skip">
												<span className="text-muted-foreground">{t('skip')}</span>
											</SelectItem>
											{CRM_CONTACT_FIELDS.map((field) => (
												<SelectItem
													key={field}
													value={field}
													disabled={usedFields.has(field) && mapping[header] !== field}
												>
													{t(`fields.${field}`)}
													{REQUIRED_FIELDS.includes(field) && (
														<Badge variant="outline" className="ml-2 text-xs">
															{t('required')}
														</Badge>
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{preview.map((row, i) => row[headers.indexOf(header)] || '').join(' · ')}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
