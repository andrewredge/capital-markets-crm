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

	const common = (await import(`../../messages/${locale}/common.json`)).default
	const contacts = (await import(`../../messages/${locale}/contacts.json`)).default
	const companies = (await import(`../../messages/${locale}/companies.json`)).default
	const deals = (await import(`../../messages/${locale}/deals.json`)).default
	const projects = (await import(`../../messages/${locale}/projects.json`)).default
	const shared = (await import(`../../messages/${locale}/shared.json`)).default
	const settings = (await import(`../../messages/${locale}/settings.json`)).default
	const admin = (await import(`../../messages/${locale}/admin.json`)).default
	const auth = (await import(`../../messages/${locale}/auth.json`)).default

	return {
		locale,
		messages: {
			...common,
			contacts,
			companies,
			deals,
			projects,
			shared,
			settings,
			admin,
			auth,
		},
	}
})
