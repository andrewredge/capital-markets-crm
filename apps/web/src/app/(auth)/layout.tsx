import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Capital Markets CRM</h1>
        <p className="text-muted-foreground">Manage your investments and relationships</p>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
