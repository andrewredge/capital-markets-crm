export const locales = ['en', 'zh', 'id'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
	en: 'English',
	zh: '中文',
	id: 'Bahasa Indonesia',
}
