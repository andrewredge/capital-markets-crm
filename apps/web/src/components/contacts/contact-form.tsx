'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createContactSchema, type CreateContactInput, CONTACT_STATUS_OPTIONS } from '@crm/shared'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface ContactFormProps {
	defaultValues?: Partial<CreateContactInput>
	onSubmit: (data: CreateContactInput) => void
	isLoading?: boolean
}

export function ContactForm({ defaultValues, onSubmit, isLoading }: ContactFormProps) {
	const t = useTranslations('contacts')
	const tActions = useTranslations('actions')
	const form = useForm<CreateContactInput>({
		resolver: zodResolver(createContactSchema) as any,
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			title: '',
			linkedinUrl: '',
			source: '',
			status: 'active',
			...defaultValues,
		} as any,
	})

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="firstName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('form.firstName')}</FormLabel>
								<FormControl>
									<Input placeholder={t('form.firstNamePlaceholder')} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="lastName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('form.lastName')}</FormLabel>
								<FormControl>
									<Input placeholder={t('form.lastNamePlaceholder')} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.email')}</FormLabel>
							<FormControl>
								<Input type="email" placeholder={t('form.emailPlaceholder')} {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('form.phone')}</FormLabel>
								<FormControl>
									<Input placeholder={t('form.phonePlaceholder')} {...field} value={field.value || ''} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="status"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('form.status')}</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={t('form.selectStatus')} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{CONTACT_STATUS_OPTIONS.map((option) => ( 
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.title')}</FormLabel>
							<FormControl>
								<Input placeholder={t('form.titlePlaceholder')} {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="linkedinUrl"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.linkedinUrl')}</FormLabel>
							<FormControl>
								<Input placeholder={t('form.linkedinPlaceholder')} {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="source"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.source')}</FormLabel>
							<FormControl>
								<Input placeholder={t('form.sourcePlaceholder')} {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-3 pt-4">
					<Button type="submit" disabled={isLoading}>
						{isLoading ? tActions('saving') : tActions('save')}
					</Button>
				</div>
			</form>
		</Form>
	)
}
