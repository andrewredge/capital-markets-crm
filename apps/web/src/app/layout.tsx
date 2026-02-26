import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
	title: 'Capital Markets CRM',
	description: 'CRM for capital markets professionals',
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const locale = await getLocale()
	const messages = await getMessages()

	return (
		<html lang={locale}>
			<body className="font-sans antialiased">
				<NextIntlClientProvider messages={messages}>
					<Providers>
						{children}
						<Toaster />
					</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	)
}
