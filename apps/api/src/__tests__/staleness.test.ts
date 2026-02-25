import { describe, it, expect } from 'vitest'
import { computeStalenessScore } from '../services/staleness.js'

describe('computeStalenessScore', () => {
	const now = new Date('2026-02-25T12:00:00Z')

	it('should have 0 score for perfect contact', () => {
		const contact = {
			email: 'test@example.com',
			phone: '+123456789',
			title: 'CEO',
			linkedinUrl: 'https://linkedin.com/in/test',
		}
		const roles = [{ id: 'role-1' }]
		const lastVerifiedAt = now

		const { score, flags } = computeStalenessScore(contact, roles, lastVerifiedAt, now)
		expect(score).toBe(0)
		expect(flags).toHaveLength(0)
	})

	it('should flag missing email', () => {
		const contact = { email: null, phone: '+1', title: 'CEO', linkedinUrl: 'https://li.com' }
		const { score, flags } = computeStalenessScore(contact, [{ id: '1' }], now, now)
		expect(flags).toContain('no_email')
		expect(score).toBe(0.15)
	})

	it('should flag missing company role', () => {
		const contact = { email: 'a@b.com', phone: '+1', title: 'CEO', linkedinUrl: 'https://li.com' }
		const { score, flags } = computeStalenessScore(contact, [], now, now)
		expect(flags).toContain('no_company_role')
		expect(score).toBe(0.2)
	})

	it('should flag aging verification (>90d)', () => {
		const contact = { email: 'a@b.com', phone: '+1', title: 'CEO', linkedinUrl: 'https://li.com' }
		const verifiedAt = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000)
		const { score, flags } = computeStalenessScore(contact, [{ id: '1' }], verifiedAt, now)
		expect(flags).toContain('not_verified_90d')
		expect(score).toBe(0.1)
	})

	it('should flag aging verification (>180d, replaces 90d)', () => {
		const contact = { email: 'a@b.com', phone: '+1', title: 'CEO', linkedinUrl: 'https://li.com' }
		const verifiedAt = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000)
		const { score, flags } = computeStalenessScore(contact, [{ id: '1' }], verifiedAt, now)
		expect(flags).toContain('not_verified_180d')
		expect(flags).not.toContain('not_verified_90d')
		expect(score).toBe(0.2)
	})

	it('should clamp score to 1.0', () => {
		const contact = { email: null, phone: null, title: null, linkedinUrl: null }
		const roles: any[] = []
		const verifiedAt = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000)
		const { score } = computeStalenessScore(contact, roles, verifiedAt, now)
		expect(score).toBe(1.0) // Total would be 0.15 + 0.05 + 0.15 + 0.2 + 0.1 + 0.35 = 1.0
	})
})
