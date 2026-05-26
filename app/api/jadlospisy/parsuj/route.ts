import mammoth from 'mammoth'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { TypPosilku } from '@/types'

type ParsedMeal = {
  typ: TypPosilku
  opis: string
  skladniki: { nazwa: string; gramatura_na_porcje: number }[]
}

type ParsedDay = {
  data: string
  posilki: ParsedMeal[]
}

type ParsedMenu = {
  dni: ParsedDay[]
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('plik')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith('.docx')) {
    return NextResponse.json(
      { error: 'Dozwolone są tylko pliki .docx' },
      { status: 400 },
    )
  }

  if (!process.env.XAI_API_KEY) {
    return NextResponse.json(
      { error: 'Brak konfiguracji XAI_API_KEY' },
      { status: 500 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { value: textFromWord } = await mammoth.extractRawText({ buffer })
  const client = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  })

  const response = await client.chat.completions.create({
    model: 'grok-3-mini',
    messages: [
      {
        role: 'user',
        content: `Przeanalizuj poniższy jadłospis i zwróć dane w formacie JSON.
Jadłospis może obejmować jeden lub więcej dni.

Dla każdego dnia zwróć obiekt z:
- data: string w formacie YYYY-MM-DD (jeśli brak roku przyjmij bieżący rok)
- posilki: array obiektów:
  - typ: "sniadanie" | "obiad" | "podwieczorek"
  - opis: string (pełna nazwa dania)
  - skladniki: array obiektów { nazwa: string, gramatura_na_porcje: number }
    (jeśli brak gramatur w tekście, zwróć pustą tablicę)

Zwróć TYLKO czysty JSON, bez markdown, bez komentarzy, bez backticks.
Format: { "dni": [ { "data": "...", "posilki": [...] } ] }

Jadłospis:
${textFromWord}`,
      },
    ],
    max_tokens: 4000,
  })

  const content = response.choices[0]?.message.content

  if (!content) {
    return NextResponse.json(
      { error: 'Błąd parsowania jadłospisu przez AI' },
      { status: 500 },
    )
  }

  let parsed: ParsedMenu

  try {
    parsed = JSON.parse(content) as ParsedMenu
  } catch {
    return NextResponse.json(
      { error: 'Błąd parsowania jadłospisu przez AI' },
      { status: 500 },
    )
  }

  const rows = parsed.dni.flatMap((day) =>
    day.posilki.map((meal) => ({
      data: day.data,
      posilek: meal.typ,
      opis: meal.opis,
      skladniki: meal.skladniki ?? [],
    })),
  )

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'Nie znaleziono pozycji jadłospisu' },
      { status: 400 },
    )
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('jadlospisy')
    .upsert(rows, { onConflict: 'data,posilek' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    sukces: true,
    wpisano: rows.length,
    podglad: rows.slice(0, 3),
  })
}
