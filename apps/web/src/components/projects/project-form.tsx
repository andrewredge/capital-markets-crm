'use client'

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ProjectFormProps {
	defaultValues?: Partial<CreateProjectInput>
	onSubmit: (data: CreateProjectInput) => void
	isLoading?: boolean
	mode?: 'create' | 'edit'
}

export function ProjectForm({ defaultValues, onSubmit, isLoading, mode = 'create' }: ProjectFormProps) {
	const trpc = useTRPC()
	const { data: companiesData } = useQuery(
		trpc.companies.list.queryOptions({ limit: 100 }),
	)

	const form = useForm<CreateProjectInput>({
		resolver: zodResolver(createProjectSchema) as any,
		defaultValues: {
			name: '',
			ownerCompanyId: '',
			projectStatus: 'exploration',
			primaryCommodity: undefined,
			secondaryCommodities: [],
			country: '',
			stateProvince: '',
			nearestTown: '',
			description: '',
			latitude: undefined,
			longitude: undefined,
			resourceEstimate: '',
			reserveEstimate: '',
			reportingStandard: undefined,
			tenureType: undefined,
			tenureExpiry: '',
			tenureArea: '',
			capexEstimate: '',
			npv: '',
			irr: '',
			stageOfStudy: undefined,
			...defaultValues,
		} as any,
	})

	const selectedSecondary = form.watch('secondaryCommodities') || []

	const toggleSecondaryCommodity = (value: string) => {
		const current = form.getValues('secondaryCommodities') || []
		if (current.includes(value as any)) {
			form.setValue('secondaryCommodities', current.filter((v) => v !== value) as any)
		} else {
			form.setValue('secondaryCommodities', [...current, value] as any)
		}
	}

	const renderGeneralFields = () => (
		<div className="space-y-4">
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Project Name</FormLabel>
						<FormControl>
							<Input placeholder="Escondida Copper Mine" {...field} />
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
							<FormLabel>Owner Company</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select company" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{companiesData?.items.map((company) => (
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
							<FormLabel>Status</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select status" />
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
						<FormLabel>Description</FormLabel>
						<FormControl>
							<Textarea 
								placeholder="Project description, geological setting, etc." 
								className="min-h-[100px]"
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
							<FormLabel>Country</FormLabel>
							<FormControl>
								<Input placeholder="Chile" {...field} value={field.value || ''} />
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
							<FormLabel>State / Province</FormLabel>
							<FormControl>
								<Input placeholder="Antofagasta" {...field} value={field.value || ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<FormField
				control={form.control}
				name="nearestTown"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nearest Town</FormLabel>
						<FormControl>
							<Input placeholder="Antofagasta" {...field} value={field.value || ''} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="latitude"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Latitude</FormLabel>
							<FormControl>
								<Input 
									type="number" 
									step="any"
									placeholder="-24.27" 
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
							<FormLabel>Longitude</FormLabel>
							<FormControl>
								<Input 
									type="number" 
									step="any"
									placeholder="-69.07" 
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
						<FormLabel>Primary Commodity</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select commodity" />
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
				<FormLabel>Secondary Commodities</FormLabel>
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
							<SelectValue placeholder="Add secondary commodity..." />
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
							<FormLabel>Reporting Standard</FormLabel>
							<Select onValueChange={field.onChange} value={field.value || undefined}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select standard" />
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
							<FormLabel>Stage of Study</FormLabel>
							<Select onValueChange={field.onChange} value={field.value || undefined}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select stage" />
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
						<FormLabel>Resource Estimate</FormLabel>
						<FormControl>
							<Input placeholder="e.g. 2,000 Mt @ 0.5% Cu" {...field} value={field.value || ''} />
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
						<FormLabel>Reserve Estimate</FormLabel>
						<FormControl>
							<Input placeholder="e.g. 1,500 Mt @ 0.6% Cu" {...field} value={field.value || ''} />
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
						<FormLabel>Tenure Type</FormLabel>
						<Select onValueChange={field.onChange} value={field.value || undefined}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select type" />
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
							<FormLabel>Tenure Area</FormLabel>
							<FormControl>
								<Input placeholder="e.g. 500 hectares" {...field} value={field.value || ''} />
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
							<FormLabel>Tenure Expiry</FormLabel>
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
						<FormLabel>CAPEX Estimate</FormLabel>
						<FormControl>
							<Input placeholder="e.g. $1.2B" {...field} value={field.value || ''} />
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
							<FormLabel>NPV</FormLabel>
							<FormControl>
								<Input placeholder="e.g. $2.5B (8%)" {...field} value={field.value || ''} />
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
							<FormLabel>IRR</FormLabel>
							<FormControl>
								<Input placeholder="e.g. 22%" {...field} value={field.value || ''} />
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
										<FormLabel>Primary Commodity</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select commodity" />
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
										<FormLabel>Country</FormLabel>
										<FormControl>
											<Input placeholder="Chile" {...field} value={field.value || ''} />
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
							<TabsTrigger value="general">General</TabsTrigger>
							<TabsTrigger value="location">Location</TabsTrigger>
							<TabsTrigger value="geology">Geology</TabsTrigger>
							<TabsTrigger value="tenure">Tenure</TabsTrigger>
							<TabsTrigger value="financial">Financial</TabsTrigger>
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
						{isLoading ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Save Changes'}
					</Button>
				</div>
			</form>
		</Form>
	)
}
