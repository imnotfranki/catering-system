import type { ReactNode } from 'react'

import { LogoutButton } from '@/components/logout-button'

interface RoleShellProps {
  roleName: string
  children: ReactNode
}

export function RoleShell({ roleName, children }: RoleShellProps) {
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      <header className="border-b border-white/10 bg-[#0f1117]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              CateringSystem
            </p>
            <h1 className="mt-1 text-lg font-semibold">{roleName}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  )
}
