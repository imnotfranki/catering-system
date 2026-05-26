import type { ReactNode } from 'react'

import { LogoutButton } from '@/components/logout-button'

export default function KuchniaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      <header className="border-b border-white/10 bg-[#0f1117]/95">
        <div className="flex items-center justify-between px-5 py-4 lg:px-8">
          <h1 className="text-xl font-black uppercase tracking-[0.24em] text-[#22c55e]">
            KUCHNIA
          </h1>
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  )
}
