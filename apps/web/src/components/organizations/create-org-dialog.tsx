"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { CreateOrgForm } from './create-org-form'

interface CreateOrgDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateOrgDialog({ open, onOpenChange }: CreateOrgDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Organization</DialogTitle>
                    <DialogDescription>
                        Create a new organization to manage your capital markets activity.
                    </DialogDescription>
                </DialogHeader>
                <CreateOrgForm onSuccess={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    )
}
