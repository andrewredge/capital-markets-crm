"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOrganizationSchema, type CreateOrganizationInput } from '@crm/shared'
import { organization } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface CreateOrgFormProps {
    onSuccess?: () => void
}

export function CreateOrgForm({ onSuccess }: CreateOrgFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

    const form = useForm<CreateOrganizationInput>({
        resolver: zodResolver(createOrganizationSchema),
        defaultValues: {
            name: '',
            slug: '',
        },
    })

    const { watch, setValue } = form
    const name = watch('name')

    useEffect(() => {
        if (name && !slugManuallyEdited) {
            const generated = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            setValue('slug', generated, { shouldValidate: true })
        }
    }, [name, slugManuallyEdited, setValue])

    async function onSubmit(values: CreateOrganizationInput) {
        setIsPending(true)
        setError(null)

        const result = await organization.create({
            name: values.name,
            slug: values.slug,
        })

        if (result.error) {
            setError(result.error.message || 'Failed to create organization')
            setIsPending(false)
        } else {
            // Set as active org
            await organization.setActive({
                organizationId: result.data.id,
            })
            
            router.refresh()
            onSuccess?.()
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Acme Corp" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="acme-corp" 
                                    {...field} 
                                    onChange={(e) => {
                                        setSlugManuallyEdited(true)
                                        field.onChange(e)
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Organization'}
                </Button>
            </form>
        </Form>
    )
}
