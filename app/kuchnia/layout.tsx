import type { ReactNode } from 'react'

import { RoleShell } from '@/components/role-shell'

export default function KuchniaLayout({ children }: { children: ReactNode }) {
  return <RoleShell roleName="Kuchnia">{children}</RoleShell>
}
