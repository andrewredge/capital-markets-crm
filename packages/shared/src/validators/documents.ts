import { z } from 'zod'

// =============================================================================
// Document Validators
// =============================================================================

export const DOCUMENT_TYPE_VALUES = [
	// Mining-specific
	'technical_report',
	'feasibility_study',
	'resource_estimate',
	'environmental_impact',
	'mining_license',
	'offtake_term_sheet',
	'jv_agreement',
	// General
	'investor_presentation',
	'financial_model',
	'legal',
	'financial',
	'presentation',
	'contract',
	'correspondence',
	'other',
] as const
export type DocumentType = (typeof DOCUMENT_TYPE_VALUES)[number]

export const DOCUMENT_VISIBILITY_VALUES = ['private', 'team', 'showcase'] as const
export type DocumentVisibility = (typeof DOCUMENT_VISIBILITY_VALUES)[number]

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

// =============================================================================
// Schemas
// =============================================================================

export const requestUploadUrlSchema = z
	.object({
		fileName: z.string().min(1, 'File name is required').max(255),
		fileSize: z.number().int().min(1).max(MAX_FILE_SIZE, 'File must be under 100 MB'),
		mimeType: z.string().min(1),
		contactId: z.string().optional(),
		companyId: z.string().optional(),
		dealId: z.string().optional(),
		projectId: z.string().optional(),
		documentType: z.enum(DOCUMENT_TYPE_VALUES).optional(),
		description: z.string().max(1000).optional(),
	})
	.refine(
		(data) => data.contactId || data.companyId || data.dealId || data.projectId,
		{ message: 'Document must be linked to at least one entity' },
	)

export const confirmUploadSchema = z.object({
	storageKey: z.string().min(1),
	fileName: z.string().min(1).max(255),
	fileSize: z.number().int().min(1),
	mimeType: z.string().min(1),
	contactId: z.string().optional(),
	companyId: z.string().optional(),
	dealId: z.string().optional(),
	projectId: z.string().optional(),
	documentType: z.enum(DOCUMENT_TYPE_VALUES).default('other'),
	description: z.string().max(1000).optional(),
	visibility: z.enum(DOCUMENT_VISIBILITY_VALUES).default('team'),
})

export const updateDocumentSchema = z.object({
	documentType: z.enum(DOCUMENT_TYPE_VALUES).optional(),
	description: z.string().max(1000).optional(),
	visibility: z.enum(DOCUMENT_VISIBILITY_VALUES).optional(),
})

export const documentFilterSchema = z.object({
	contactId: z.string().optional(),
	companyId: z.string().optional(),
	dealId: z.string().optional(),
	projectId: z.string().optional(),
	documentType: z.enum(DOCUMENT_TYPE_VALUES).optional(),
	search: z.string().optional(),
	sortBy: z.string().optional(),
	sortDir: z.enum(['asc', 'desc']).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>
