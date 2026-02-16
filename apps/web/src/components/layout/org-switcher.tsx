"use client"

import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { organization, useSession, useListOrganizations } from '@/lib/auth-client'

export function OrgSwitcher() {
    const router = useRouter()
    const { data: session } = useSession()
    const { data: organizations, isPending } = useListOrganizations()
    
    const activeOrg = organizations?.find(
        (org: any) => org.id === session?.session.activeOrganizationId
    )

    const handleSwitch = async (organizationId: string) => {
        await organization.setActive({
            organizationId,
        })
        router.refresh()
    }

    if (isPending) {
        return <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 px-2 hover:bg-accent"
                >
                    <div className="flex flex-col items-start text-left">
                        <span className="text-xs text-muted-foreground font-normal">Organization</span>
                        <span className="text-sm font-semibold truncate max-w-[150px]">
                            {activeOrg?.name || 'Select Organization'}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations?.map((org: any) => (
                    <DropdownMenuItem
                        key={org.id}
                        onClick={() => handleSwitch(org.id)}
                        className="flex items-center justify-between"
                    >
                        {org.name}
                        {org.id === activeOrg?.id && (
                            <Check className="h-4 w-4" />
                        )}
                    </DropdownMenuItem>
                ))}
                {organizations?.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No organizations found
                    </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create Organization</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
