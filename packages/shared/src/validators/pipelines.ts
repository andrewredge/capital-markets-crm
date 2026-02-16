import { z } from 'zod'

// =============================================================================
// Pipeline Validators
// =============================================================================

export const TERMINAL_TYPES = ['won', 'lost', 'passed'] as const
export type TerminalType = (typeof TERMINAL_TYPES)[number]

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/

export const createPipelineSchema = z.object({
	name: z.string().min(1, 'Pipeline name is required').max(100),
	description: z.string().max(500).optional().or(z.literal('')),
	isDefault: z.boolean().default(false),
})

export const updatePipelineSchema = createPipelineSchema.partial()

export const pipelineFilterSchema = z.object({
	search: z.string().optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

// =============================================================================
// Stage Validators
// =============================================================================

export const createStageSchema = z.object({
	pipelineId: z.string().min(1, 'Pipeline is required'),
	name: z.string().min(1, 'Stage name is required').max(100),
	position: z.number().int().min(0),
	color: z.string().regex(hexColorRegex, 'Must be a valid hex color').default('#3B82F6'),
	isTerminal: z.boolean().default(false),
	terminalType: z.enum(TERMINAL_TYPES).optional().nullable(),
})

export const updateStageSchema = createStageSchema.partial().omit({ pipelineId: true })

export const reorderStagesSchema = z.object({
	pipelineId: z.string().min(1),
	stageIds: z.array(z.string().min(1)).min(1),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>
export type PipelineFilterInput = z.infer<typeof pipelineFilterSchema>
export type CreateStageInput = z.infer<typeof createStageSchema>
export type UpdateStageInput = z.infer<typeof updateStageSchema>
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>
