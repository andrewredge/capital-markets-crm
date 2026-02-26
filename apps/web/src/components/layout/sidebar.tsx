"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'Companies', href: '/companies', icon: Building2 },
  { label: 'Deals', href: '/deals', icon: Handshake },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()
  const isSuperAdmin = (session?.user as Record<string, unknown> | undefined)?.platformRole === 'super_admin'

  return (
    <div className="flex h-full flex-col border-r bg-card w-64">
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="bg-primary text-primary-foreground p-1 rounded">CM</span>
          <span>CRM</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}

        {isSuperAdmin && (
          <>
            <div className="pt-4 mt-4 border-t">
              <Link
                href="/admin/users"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith('/admin')
                    ? "bg-destructive text-destructive-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Panel
              </Link>
            </div>
          </>
        )}
      </nav>
      <div className="p-4 border-t text-xs text-muted-foreground">
        &copy; 2026 Capital Markets CRM
      </div>
    </div>
  )
}
