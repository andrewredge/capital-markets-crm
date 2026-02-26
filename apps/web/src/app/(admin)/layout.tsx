import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex h-screen sticky top-0">
        <div className="flex h-full flex-col border-r bg-card w-64">
          <div className="flex h-16 items-center px-6 border-b">
            <Link href="/admin/users" className="flex items-center gap-2 font-bold text-xl">
              <span className="bg-destructive text-destructive-foreground p-1 rounded text-sm">SA</span>
              <span>Admin Panel</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Users
            </Link>
            <Link
              href="/admin/invitations"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Invitations
            </Link>
            <div className="pt-4 border-t mt-4">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Back to CRM
              </Link>
            </div>
          </nav>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
