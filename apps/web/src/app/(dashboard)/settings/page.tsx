import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GitBranch, Upload } from 'lucide-react'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/settings/pipelines">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="h-5 w-5 text-primary" />
                <CardTitle>Pipelines</CardTitle>
              </div>
              <CardDescription>
                Manage your deal pipelines, stages, and sales processes.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/settings/import">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-5 w-5 text-primary" />
                <CardTitle>Import Contacts</CardTitle>
              </div>
              <CardDescription>
                Bulk import contacts from CSV or Excel files with column mapping.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
