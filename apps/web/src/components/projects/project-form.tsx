'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	createProjectSchema,
	type CreateProjectInput,
	PROJECT_STATUS_OPTIONS,
	COMMODITY_OPTIONS,
	REPORTING_STANDARD_OPTIONS,
	STAGE_OF_STUDY_OPTIONS,
	TENURE_TYPE_OPTIONS,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface ProjectFormProps {
	defaultValues?: Partial<CreateProjectInput>
	onSubmit: (data: CreateProjectInput) => void
	isLoading?: boolean
	mode?: 'create' | 'edit'
}

export function ProjectForm({
	defaultValues,
	onSubmit,
	isLoading,
	mode = 'create',
}: ProjectFormProps) {
	const t = useTranslations('projects')
	const tActions = useTranslations('actions')
	const trpc = useTRPC()
	const form = useForm<CreateProjectInput>({
		resolver: zodResolver(createProjectSchema) as any,
		defaultValues: {
			name: '',
			ownerCompanyId: '',
			projectStatus: 'active',
			primaryCommodity: 'copper',
			secondaryCommodities: [],
			description: '',
			country: '',
			stateProvince: '',
			...defaultValues,
		} as any,
	})

	const { data: companies } = useQuery(
		trpc.companies.list.queryOptions({ limit: 100 }),
	)

	const selectedSecondary = form.watch('secondaryCommodities') || []

	const toggleSecondaryCommodity = (val: string) => {
		const current = form.getValues('secondaryCommodities') || []
		if (current.includes(val as any)) {
			form.setValue(
				'secondaryCommodities',
				current.filter((c) => c !== val),
			)
		} else {
			form.setValue('secondaryCommodities', [...current, val as any])
		}
	}

	const renderGeneralFields = () => (
		<div className="space-y-4">
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
					name="ownerCompanyId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.owner')}</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder={t('form.selectOwner')} />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{companies?.items.map((company) => (
										<SelectItem key={company.id} value={company.id}>
											{company.name}
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
					name="projectStatus"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.status')}</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder={t('form.selectStatus')} />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{PROJECT_STATUS_OPTIONS.map((option) => (
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
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('form.description')}</FormLabel>
						<FormControl>
							<Textarea
								placeholder={t('form.descriptionPlaceholder')}
								className="h-32 resize-none"
								{...field}
								value={field.value || ''}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	)

	const renderLocationFields = () => (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="country"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.country')}</FormLabel>
							<FormControl>
								<Input placeholder={t('form.countryPlaceholder')} {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="stateProvince"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.region')}</FormLabel>
							<FormControl>
								<Input placeholder={t('form.regionPlaceholder')} {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="latitude"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.latitude')}</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="any"
									placeholder={t('form.latitudePlaceholder')}
									{...field}
									value={field.value ?? ''}
									onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="longitude"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.longitude')}</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="any"
									placeholder={t('form.longitudePlaceholder')}
									{...field}
									value={field.value ?? ''}
									onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	)

	const renderGeologyFields = () => (
		<div className="space-y-4">
			<FormField
				control={form.control}
				name="primaryCommodity"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('form.primaryCommodity')}</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder={t('form.selectCommodity')} />    
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{COMMODITY_OPTIONS.map((option) => (
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
			<FormItem>
				<FormLabel>{t('form.secondaryCommodities')}</FormLabel>
				<div className="flex flex-wrap gap-2 mb-2">
					{selectedSecondary.map((val) => {
						const option = COMMODITY_OPTIONS.find((o) => o.value === val)
						return (
							<Badge key={val} variant="secondary" className="gap-1">
								{option?.label || val}
								<X
									className="h-3 w-3 cursor-pointer"
									onClick={() => toggleSecondaryCommodity(val)}     
								/>
							</Badge>
						)
					})}
				</div>
				<Select onValueChange={toggleSecondaryCommodity}>
					<FormControl>
						<SelectTrigger>
							<SelectValue placeholder={t('form.addSecondary')} />
						</SelectTrigger>
					</FormControl>
					<SelectContent>
						{COMMODITY_OPTIONS.map((option) => (
							<SelectItem
								key={option.value}
								value={option.value}
								disabled={selectedSecondary.includes(option.value as any) || form.watch('primaryCommodity') === option.value}
							>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</FormItem>
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="reportingStandard"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.reportingStandard')}</FormLabel>
							<Select onValueChange={field.onChange} value={field.value || undefined}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder={t('form.selectStandard')} />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{REPORTING_STANDARD_OPTIONS.map((option) => (     
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
					name="stageOfStudy"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.stageOfStudy')}</FormLabel>
							<Select onValueChange={field.onChange} value={field.value || undefined}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder={t('form.selectStageOfStudy')} />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{STAGE_OF_STUDY_OPTIONS.map((option) => (
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
				name="resourceEstimate"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('form.resourceEstimate')}</FormLabel>
						<FormControl>
							<Input placeholder={t('form.resourceEstimatePlaceholder')} {...field} value={field.value || ''} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="reserveEstimate"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('form.reserveEstimate')}</FormLabel>
						<FormControl>
							<Input placeholder={t('form.reserveEstimatePlaceholder')} {...field} value={field.value || ''} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	)

	const renderTenureFields = () => (
		<div className="space-y-4">
			<FormField
				control={form.control}
				name="tenureType"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('form.tenureType')}</FormLabel>
						<Select onValueChange={field.onChange} value={field.value || undefined}>  
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder={t('form.selectTenureType')} />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{TENURE_TYPE_OPTIONS.map((option) => (
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
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="tenureArea"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.tenureArea')}</FormLabel>
							<FormControl>
								<Input placeholder={t('form.tenureAreaPlaceholder')} {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="tenureExpiry"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.tenureExpiry')}</FormLabel>
							<FormControl>
								<Input type="date" {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	)

	const renderFinancialFields = () => (
		<div className="space-y-4">
			<FormField
				control={form.control}
				name="capexEstimate"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('form.capexEstimate')}</FormLabel>
						<FormControl>
							<Input placeholder={t('form.capexEstimatePlaceholder')} {...field} value={field.value || ''} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="npv"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.npv')}</FormLabel>
							<FormControl>
								<Input placeholder={t('form.npvPlaceholder')} {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="irr"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('form.irr')}</FormLabel>
							<FormControl>
								<Input placeholder={t('form.irrPlaceholder')} {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	)

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				{mode === 'create' ? (
					<div className="space-y-4">
						{renderGeneralFields()}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="primaryCommodity"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('form.primaryCommodity')}</FormLabel>  
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t('form.selectCommodity')} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{COMMODITY_OPTIONS.map((option) => (
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
								name="country"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('form.country')}</FormLabel>
										<FormControl>
											<Input placeholder={t('form.countryPlaceholder')} {...field} value={field.value || ''} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				) : (
					<Tabs defaultValue="general" className="w-full">
						<TabsList className="grid w-full grid-cols-5">
							<TabsTrigger value="general">{t('tabs.general')}</TabsTrigger>
							<TabsTrigger value="location">{t('tabs.location')}</TabsTrigger>
							<TabsTrigger value="geology">{t('tabs.geology')}</TabsTrigger>
							<TabsTrigger value="tenure">{t('tabs.tenure')}</TabsTrigger>
							<TabsTrigger value="financial">{t('tabs.financial')}</TabsTrigger>
						</TabsList>
						<TabsContent value="general" className="pt-4">{renderGeneralFields()}</TabsContent>
						<TabsContent value="location" className="pt-4">{renderLocationFields()}</TabsContent>
						<TabsContent value="geology" className="pt-4">{renderGeologyFields()}</TabsContent>
						<TabsContent value="tenure" className="pt-4">{renderTenureFields()}</TabsContent>
						<TabsContent value="financial" className="pt-4">{renderFinancialFields()}</TabsContent>
					</Tabs>
				)}

				<div className="flex justify-end gap-3 pt-4 border-t">
					<Button type="submit" disabled={isLoading}>
						{isLoading ? tActions('saving') : mode === 'create' ? t('createProject') : tActions('save')}
					</Button>
				</div>
			</form>
		</Form>
	)
}
