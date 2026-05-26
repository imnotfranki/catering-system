import type { ReactNode } from 'react'

import { RoleShell } from '@/components/role-shell'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleShell roleName="Administrator">{children}</RoleShell>
}
