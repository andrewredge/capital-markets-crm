'use client'

import { useTranslations } from 'next-intl'

/**
 * Translate option arrays from @crm/shared constants.
 * Falls back to the original English label if no translation key exists.
 *
 * Usage:
 *   const options = useTranslatedOptions(DOCUMENT_TYPE_OPTIONS, 'constants')
 *   // Each option.label is now translated (or falls back to English)
 */
export function useTranslatedOptions(
	options: readonly { value: string; label: string }[],
	namespace = 'constants',
) {
	const t = useTranslations(namespace)
	return options.map((o) => ({
		...o,
		label: t(o.value, { defaultValue: o.label }),
	}))
}
