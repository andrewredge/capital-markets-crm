'use client'

import { useReducer, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FileUploadStep } from './file-upload-step'
import { ColumnMappingStep } from './column-mapping-step'
import { PreviewStep, getValidContacts } from './preview-step'
import { ImportResultStep } from './import-result-step'
import type { ParsedFile } from '@/lib/parse-file'
import type { CrmContactField, DuplicateStrategy, ImportResult, CreateContactInput } from '@crm/shared'

// =============================================================================
// State
// =============================================================================

type Step = 'upload' | 'mapping' | 'preview' | 'result'
const STEPS: Step[] = ['upload', 'mapping', 'preview', 'result']

interface WizardState {
	step: Step
	file: ParsedFile | null
	mapping: Record<string, CrmContactField | 'skip'>
	duplicateStrategy: DuplicateStrategy
	result: ImportResult | null
}

type WizardAction =
	| { type: 'SET_FILE'; payload: ParsedFile }
	| { type: 'SET_MAPPING'; payload: Record<string, CrmContactField | 'skip'> }
	| { type: 'SET_DUPLICATE_STRATEGY'; payload: DuplicateStrategy }
	| { type: 'SET_RESULT'; payload: ImportResult }
	| { type: 'GO_TO'; payload: Step }
	| { type: 'RESET' }

const initialState: WizardState = {
	step: 'upload',
	file: null,
	mapping: {},
	duplicateStrategy: 'skip',
	result: null,
}

function reducer(state: WizardState, action: WizardAction): WizardState {
	switch (action.type) {
		case 'SET_FILE':
			return { ...state, file: action.payload, mapping: {}, step: 'mapping' }
		case 'SET_MAPPING':
			return { ...state, mapping: action.payload }
		case 'SET_DUPLICATE_STRATEGY':
			return { ...state, duplicateStrategy: action.payload }
		case 'SET_RESULT':
			return { ...state, result: action.payload, step: 'result' }
		case 'GO_TO':
			return { ...state, step: action.payload }
		case 'RESET':
			return initialState
	}
}

// =============================================================================
// Component
// =============================================================================

export function ImportWizard() {
	const [state, dispatch] = useReducer(reducer, initialState)
	const trpc = useTRPC()

	const importMutation = useMutation(
		trpc.contactImport.bulkCreate.mutationOptions({
			onSuccess(data) {
				dispatch({ type: 'SET_RESULT', payload: data })
			},
		}),
	)

	const handleFileParsed = useCallback((data: ParsedFile) => {
		dispatch({ type: 'SET_FILE', payload: data })
	}, [])

	const handleMappingChange = useCallback((mapping: Record<string, CrmContactField | 'skip'>) => {
		dispatch({ type: 'SET_MAPPING', payload: mapping })
	}, [])

	const handleDuplicateStrategyChange = useCallback((strategy: DuplicateStrategy) => {
		dispatch({ type: 'SET_DUPLICATE_STRATEGY', payload: strategy })
	}, [])

	const canProceedToPreview = () => {
		const mapped = new Set(Object.values(state.mapping).filter((v) => v !== 'skip'))
		return mapped.has('firstName') && mapped.has('lastName')
	}

	const handleImport = () => {
		if (!state.file) return
		const validContacts = getValidContacts(state.file.headers, state.file.rows, state.mapping)
		importMutation.mutate({
			contacts: validContacts as CreateContactInput[],
			duplicateStrategy: state.duplicateStrategy,
		})
	}

	const stepIndex = STEPS.indexOf(state.step)
	const progressValue = ((stepIndex + 1) / STEPS.length) * 100

	return (
		<div className="space-y-6">
			<Progress value={progressValue} className="h-2" />

			<div className="flex gap-2 text-sm text-muted-foreground">
				{STEPS.map((s, i) => (
					<span key={s} className={i === stepIndex ? 'text-foreground font-medium' : ''}>
						{i > 0 && ' → '}
						{s === 'upload' && 'Upload'}
						{s === 'mapping' && 'Map Columns'}
						{s === 'preview' && 'Preview'}
						{s === 'result' && 'Result'}
					</span>
				))}
			</div>

			<Card>
				<CardContent className="p-6">
					{state.step === 'upload' && <FileUploadStep onFileParsed={handleFileParsed} />}

					{state.step === 'mapping' && state.file && (
						<ColumnMappingStep
							headers={state.file.headers}
							sampleRows={state.file.rows}
							mapping={state.mapping}
							onMappingChange={handleMappingChange}
						/>
					)}

					{state.step === 'preview' && state.file && (
						<PreviewStep
							headers={state.file.headers}
							rows={state.file.rows}
							mapping={state.mapping}
							duplicateStrategy={state.duplicateStrategy}
							onDuplicateStrategyChange={handleDuplicateStrategyChange}
						/>
					)}

					{state.step === 'result' && state.result && (
						<ImportResultStep result={state.result} onImportMore={() => dispatch({ type: 'RESET' })} />
					)}
				</CardContent>
			</Card>

			{state.step !== 'upload' && state.step !== 'result' && (
				<div className="flex justify-between">
					<Button
						variant="outline"
						onClick={() => {
							const prev = STEPS[stepIndex - 1]
							if (prev) dispatch({ type: 'GO_TO', payload: prev })
						}}
					>
						Back
					</Button>

					{state.step === 'mapping' && (
						<Button
							onClick={() => dispatch({ type: 'GO_TO', payload: 'preview' })}
							disabled={!canProceedToPreview()}
						>
							Continue to Preview
						</Button>
					)}

					{state.step === 'preview' && (
						<Button onClick={handleImport} disabled={importMutation.isPending}>
							{importMutation.isPending ? 'Importing...' : 'Import Contacts'}
						</Button>
					)}
				</div>
			)}

			{importMutation.isError && (
				<p className="text-sm text-destructive">
					Import failed: {importMutation.error?.message || 'Unknown error'}
				</p>
			)}
		</div>
	)
}
