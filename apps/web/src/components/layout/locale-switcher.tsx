'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { locales, localeNames, type Locale } from '@/i18n/config'

export function LocaleSwitcher() {
	const t = useTranslations('locale')
	const router = useRouter()

	function switchLocale(locale: Locale) {
		document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`
		router.refresh()
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="text-muted-foreground">
					<Globe className="h-5 w-5" />
					<span className="sr-only">{t('switchLanguage')}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{locales.map((locale) => (
					<DropdownMenuItem key={locale} onClick={() => switchLocale(locale)}>
						{localeNames[locale]}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
