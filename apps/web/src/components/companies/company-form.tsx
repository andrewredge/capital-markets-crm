'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	createCompanySchema,
	type CreateCompanyInput,
	ENTITY_TYPE_OPTIONS,
	INVESTOR_TYPES,
} from '@crm/shared'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface CompanyFormProps {
	defaultValues?: Partial<CreateCompanyInput>
	onSubmit: (data: CreateCompanyInput) => void
	isLoading?: boolean
}

export function CompanyForm({ defaultValues, onSubmit, isLoading }: CompanyFormProps) {
	const form = useForm<CreateCompanyInput>({
		resolver: zodResolver(createCompanySchema) as any,
		defaultValues: {
			name: '',
			entityType: 'startup',
			website: '',
			industry: '',
			headquarters: '',
			foundedYear: undefined,
			employeeCountRange: '',
			investorType: '',
			aum: '',
			investmentStageFocus: [],
			tickerSymbol: '',
			exchange: '',
			marketCap: '',
			fundingStage: '',
			totalFunding: '',
			...defaultValues,
		} as any,
	})

	const entityType = form.watch('entityType')

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Company Name</FormLabel>
								<FormControl>
									<Input placeholder="Acme Corp" {...field} />
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
								<FormLabel>Entity Type</FormLabel>
								<Select
									onValueChange={(value) => {
										field.onChange(value)
										// Optional: Clear specific fields when type changes
									}}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
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
						name="website"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Website</FormLabel>
								<FormControl>
									<Input placeholder="https://acme.com" {...field} value={field.value || ''} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="industry"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Industry</FormLabel>
								<FormControl>
									<Input placeholder="Software / FinTech" {...field} value={field.value || ''} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="grid grid-cols-3 gap-4">
					<FormField
						control={form.control}
						name="headquarters"
						render={({ field }) => (
							<FormItem className="col-span-1">
								<FormLabel>HQ</FormLabel>
								<FormControl>
									<Input placeholder="New York, NY" {...field} value={field.value || ''} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="foundedYear"
						render={({ field }) => (
							<FormItem className="col-span-1">
								<FormLabel>Founded Year</FormLabel>
								<FormControl>
									<Input
										type="number"
										placeholder="2020"
										{...field}
										value={field.value || ''}
										onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="employeeCountRange"
						render={({ field }) => (
							<FormItem className="col-span-1">
								<FormLabel>Employees</FormLabel>
								<FormControl>
									<Input placeholder="11-50" {...field} value={field.value || ''} />
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
						<h4 className="text-sm font-medium">Investor Details</h4>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="investorType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Investor Type</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
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
										<FormLabel>AUM</FormLabel>
										<FormControl>
											<Input placeholder="$500M" {...field} value={field.value || ''} />
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
						<h4 className="text-sm font-medium">Market Details</h4>
						<div className="grid grid-cols-3 gap-4">
							<FormField
								control={form.control}
								name="tickerSymbol"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Ticker</FormLabel>
										<FormControl>
											<Input placeholder="AAPL" {...field} value={field.value || ''} />
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
										<FormLabel>Exchange</FormLabel>
										<FormControl>
											<Input placeholder="NASDAQ" {...field} value={field.value || ''} />
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
										<FormLabel>Market Cap</FormLabel>
										<FormControl>
											<Input placeholder="$3T" {...field} value={field.value || ''} />
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
						<h4 className="text-sm font-medium">Funding Details</h4>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="fundingStage"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Funding Stage</FormLabel>
										<FormControl>
											<Input placeholder="Series B" {...field} value={field.value || ''} />
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
										<FormLabel>Total Funding</FormLabel>
										<FormControl>
											<Input placeholder="$25M" {...field} value={field.value || ''} />
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
						{isLoading ? 'Saving...' : 'Save Company'}
					</Button>
				</div>
			</form>
		</Form>
	)
}
