import type { ReactNode } from 'react'

import { RoleShell } from '@/components/role-shell'

export default function PlacowkaLayout({ children }: { children: ReactNode }) {
  return <RoleShell roleName="Placówka">{children}</RoleShell>
}
