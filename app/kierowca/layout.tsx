import type { ReactNode } from 'react'

import { RoleShell } from '@/components/role-shell'

export default function KierowcaLayout({ children }: { children: ReactNode }) {
  return <RoleShell roleName="Kierowca">{children}</RoleShell>
}
