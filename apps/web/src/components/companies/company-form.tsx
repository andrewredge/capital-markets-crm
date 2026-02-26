'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	createCompanySchema,
	type CreateCompanyInput,
	ENTITY_TYPE_OPTIONS,
	INVESTOR_TYPES,
} from '@crm/shared'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

interface CompanyFormProps {
	defaultValues?: Partial<CreateCompanyInput>
	onSubmit: (data: CreateCompanyInput) => void
	isLoading?: boolean
}

export function CompanyForm({
	defaultValues,
	onSubmit,
	isLoading,
}: CompanyFormProps) {
	const t = useTranslations('companies')
	const tActions = useTranslations('actions')
	const form = useForm<CreateCompanyInput>({
		resolver: zodResolver(createCompanySchema) as any,
		defaultValues: {
			name: '',
			website: '',
			entityType: 'startup',
			industry: '',
			headquarters: '',
			...defaultValues,
		} as any,
	})

	const entityType = form.watch('entityType')

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.name')}</FormLabel>
							<FormControl>
								<Input placeholder={t('form.namePlaceholder')} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="website"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('form.website')}</FormLabel>
								<FormControl>
									<Input
										placeholder={t('form.websitePlaceholder')}
										{...field}
										value={field.value || ''}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="entityType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('form.entityType')}</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={t('form.selectType')} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{ENTITY_TYPE_OPTIONS.map((option) => (
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

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="industry"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('form.industry')}</FormLabel>
								<FormControl>
									<Input
										placeholder={t('form.industryPlaceholder')}
										{...field}
										value={field.value || ''}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="headquarters"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('form.headquarters')}</FormLabel>
								<FormControl>
									<Input
										placeholder={t('form.headquartersPlaceholder')}
										{...field}
										value={field.value || ''}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Investor-specific fields */}
				{entityType === 'investor' && (
					<div className="space-y-4 pt-2">
						<Separator />
						<h4 className="text-sm font-medium">{t('form.investorDetails')}</h4>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="investorType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('form.investorType')}</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value || undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t('form.selectType')} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{INVESTOR_TYPES.map((option) => (
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
							<FormField
								control={form.control}
								name="aum"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('form.aum')}</FormLabel>
										<FormControl>
											<Input
												placeholder={t('form.aumPlaceholder')}
												{...field}
												value={field.value || ''}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				)}

				{/* Listed Company-specific fields */}
				{entityType === 'listed_company' && (
					<div className="space-y-4 pt-2">
						<Separator />
						<h4 className="text-sm font-medium">{t('form.marketDetails')}</h4>
						<div className="grid grid-cols-3 gap-4">
							<FormField
								control={form.control}
								name="tickerSymbol"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('form.ticker')}</FormLabel>
										<FormControl>
											<Input
												placeholder={t('form.tickerPlaceholder')}
												{...field}
												value={field.value || ''}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="exchange"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('form.exchange')}</FormLabel>
										<FormControl>
											<Input
												placeholder={t('form.exchangePlaceholder')}
												{...field}
												value={field.value || ''}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="marketCap"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('form.marketCap')}</FormLabel>
										<FormControl>
											<Input
												placeholder={t('form.marketCapPlaceholder')}
												{...field}
												value={field.value || ''}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				)}

				{/* Startup-specific fields */}
				{entityType === 'startup' && (
					<div className="space-y-4 pt-2">
						<Separator />
						<h4 className="text-sm font-medium">{t('form.fundingDetails')}</h4>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="fundingStage"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('form.fundingStage')}</FormLabel>
										<FormControl>
											<Input
												placeholder={t('form.fundingStagePlaceholder')}
												{...field}
												value={field.value || ''}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="totalFunding"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('form.totalFunding')}</FormLabel>
										<FormControl>
											<Input
												placeholder={t('form.totalFundingPlaceholder')}
												{...field}
												value={field.value || ''}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				)}

				<div className="flex justify-end gap-3 pt-4">
					<Button type="submit" disabled={isLoading}>
						{isLoading ? tActions('saving') : tActions('save')}
					</Button>
				</div>
			</form>
		</Form>
	)
}
