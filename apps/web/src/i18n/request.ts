import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

export default getRequestConfig(async () => {
	// Read locale from cookie, then Accept-Language header, then default
	const cookieStore = await cookies()
	const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined

	let locale: Locale = defaultLocale

	if (cookieLocale && locales.includes(cookieLocale)) {
		locale = cookieLocale
	} else {
		const headerStore = await headers()
		const acceptLang = headerStore.get('accept-language') ?? ''
		const preferred = acceptLang.split(',').map((l) => (l.split(';')[0] ?? '').trim().split('-')[0])
		const match = preferred.find((l) => locales.includes(l as Locale)) as Locale | undefined
		if (match) locale = match
	}

	return {
		locale,
		messages: (await import(`../../messages/${locale}/common.json`)).default,
	}
})
