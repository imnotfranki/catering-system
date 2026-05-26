import type { ReactNode } from 'react'

import { LogoutButton } from '@/components/logout-button'

export default function KierowcaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f1117]/95">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-lg font-black tracking-[0.24em] text-[#22c55e]">
            KIEROWCA
          </h1>
          <LogoutButton />
        </div>
      </header>
      <main className="px-4 py-6">{children}</main>
    </div>
  )
}
