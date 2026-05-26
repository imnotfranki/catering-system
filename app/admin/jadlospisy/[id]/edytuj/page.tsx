import Link from 'next/link'
import { notFound } from 'next/navigation'

import { MenuEntryForm } from '@/components/menu-entry-form'
import { createSupabaseServerClient } from '@/lib/supabase-server'

import { updateMenuEntry } from '../../actions'

interface EditMenuEntryPageProps {
  params: {
    id: string
  }
  searchParams?: {
    error?: string
  }
}

export default async function EditMenuEntryPage({
  params,
  searchParams,
}: EditMenuEntryPageProps) {
  const supabase = createSupabaseServerClient()
  const { data: entry } = await supabase
    .from('jadlospisy')
    .select('id, data, posilek, opis, skladniki')
    .eq('id', params.id)
    .single()

  if (!entry) {
    notFound()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/jadlospisy" className="text-sm text-[#22c55e]">
          Wróć do jadłospisów
        </Link>
        <h2 className="mt-3 text-3xl font-semibold">Edytuj wpis jadłospisu</h2>
      </div>

      {searchParams?.error ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Nie udało się zapisać wpisu
        </p>
      ) : null}

      <MenuEntryForm
        action={updateMenuEntry}
        entry={{
          id: entry.id,
          data: entry.data,
          posilek: entry.posilek,
          opis: entry.opis ?? '',
          skladniki: Array.isArray(entry.skladniki) ? entry.skladniki : [],
        }}
      />
    </div>
  )
}
