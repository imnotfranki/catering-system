'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function MenuUpload() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function upload() {
    if (!file) {
      setError('Wybierz plik .docx')
      return
    }

    setIsLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData()
    formData.append('plik', file)

    try {
      const response = await fetch('/api/jadlospisy/parsuj', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Błąd parsowania pliku')
        return
      }

      setMessage(`Dodano ${data.wpisano} pozycji do jadłospisu`)
      setFile(null)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#1a1f2e] p-6">
      <h3 className="text-xl font-semibold">Import z pliku Word</h3>
      <div className="mt-5 rounded-lg border border-dashed border-white/20 bg-[#0f1117] p-6">
        <input
          type="file"
          accept=".docx"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-[#22c55e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
        />
        {file ? <p className="mt-3 text-sm text-slate-300">{file.name}</p> : null}
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void upload()}
        disabled={isLoading}
        className="mt-5 rounded-md bg-[#22c55e] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70"
      >
        {isLoading ? 'Parsowanie...' : 'Wgraj i parsuj'}
      </button>
    </section>
  )
}
