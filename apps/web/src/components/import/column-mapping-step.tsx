'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { COLUMN_ALIAS_MAP, CRM_CONTACT_FIELDS, type CrmContactField } from '@crm/shared'

const FIELD_LABELS: Record<CrmContactField, string> = {
	firstName: 'First Name',
	lastName: 'Last Name',
	email: 'Email',
	phone: 'Phone',
	title: 'Job Title',
	linkedinUrl: 'LinkedIn URL',
	contactType: 'Contact Type',
	contactSubtype: 'Contact Subtype',
	companyName: 'Company Name',
	companyRole: 'Company Role',
	source: 'Source',
	status: 'Status',
}

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
				<h3 className="text-lg font-semibold">Map Columns</h3>
				<p className="text-sm text-muted-foreground">
					Map each column from your file to a CRM field, or skip columns you don't need.
				</p>
			</div>

			{missingRequired.length > 0 && (
				<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					Required fields not mapped: {missingRequired.map((f) => FIELD_LABELS[f]).join(', ')}
				</div>
			)}

			<div className="rounded-md border overflow-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[200px]">Source Column</TableHead>
							<TableHead className="w-[200px]">Maps To</TableHead>
							<TableHead>Preview</TableHead>
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
												<span className="text-muted-foreground">Skip</span>
											</SelectItem>
											{CRM_CONTACT_FIELDS.map((field) => (
												<SelectItem
													key={field}
													value={field}
													disabled={usedFields.has(field) && mapping[header] !== field}
												>
													{FIELD_LABELS[field]}
													{REQUIRED_FIELDS.includes(field) && (
														<Badge variant="outline" className="ml-2 text-xs">
															Required
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
