'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createSupabaseAdminClient } from '@/lib/supabase-admin'

const placowkaTypes = ['zlobek', 'przedszkole', 'szkola', 'osp', 'dorosli']

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function getType(formData: FormData) {
  const typ = getText(formData, 'typ')

  if (!placowkaTypes.includes(typ)) {
    throw new Error('Nieprawidlowy typ placowki')
  }

  return typ
}

export async function createPlacowka(formData: FormData) {
  const supabase = createSupabaseAdminClient()
  const nazwa = getText(formData, 'nazwa')
  const typ = getType(formData)
  const adres = getText(formData, 'adres')
  const email = getText(formData, 'email')
  const password = getText(formData, 'password')

  if (!nazwa || !email || !password) {
    redirect('/admin/placowki/nowa?error=missing')
  }

  const { data: userData, error: userError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (userError || !userData.user) {
    const message = userError?.message.toLowerCase() ?? ''
    const errorCode =
      message.includes('already') || message.includes('registered')
        ? 'email_exists'
        : 'create_account'

    redirect(`/admin/placowki/nowa?error=${errorCode}`)
  }

  const { data: placowka, error: placowkaError } = await supabase
    .from('placowki')
    .insert({ nazwa, typ, adres })
    .select('id')
    .single()

  if (placowkaError || !placowka) {
    await supabase.auth.admin.deleteUser(userData.user.id)
    redirect('/admin/placowki/nowa?error=create_account')
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userData.user.id,
    rola: 'placowka',
    placowka_id: placowka.id,
  })

  if (profileError) {
    await supabase.from('placowki').delete().eq('id', placowka.id)
    await supabase.auth.admin.deleteUser(userData.user.id)
    redirect('/admin/placowki/nowa?error=create_account')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/placowki')
  redirect('/admin/placowki?success=created')
}

export async function togglePlacowka(formData: FormData) {
  const supabase = createSupabaseAdminClient()
  const id = getText(formData, 'id')
  const aktywna = getText(formData, 'aktywna') === 'true'

  await supabase.from('placowki').update({ aktywna: !aktywna }).eq('id', id)

  revalidatePath('/admin')
  revalidatePath('/admin/placowki')
}

export async function deletePlacowka(formData: FormData) {
  const supabase = createSupabaseAdminClient()
  const id = getText(formData, 'id')

  await supabase.from('placowki').delete().eq('id', id)

  revalidatePath('/admin')
  revalidatePath('/admin/placowki')
}

export async function updatePlacowka(formData: FormData) {
  const supabase = createSupabaseAdminClient()
  const id = getText(formData, 'id')
  const nazwa = getText(formData, 'nazwa')
  const typ = getType(formData)
  const adres = getText(formData, 'adres')

  await supabase.from('placowki').update({ nazwa, typ, adres }).eq('id', id)

  revalidatePath('/admin')
  revalidatePath('/admin/placowki')
  revalidatePath(`/admin/placowki/${id}/edytuj`)
  redirect('/admin/placowki?success=updated')
}

export async function resetPlacowkaPassword(formData: FormData) {
  const supabase = createSupabaseAdminClient()
  const placowkaId = getText(formData, 'placowka_id')
  const userId = getText(formData, 'user_id')
  const password = getText(formData, 'password')

  if (userId && password) {
    await supabase.auth.admin.updateUserById(userId, { password })
  }

  revalidatePath(`/admin/placowki/${placowkaId}/edytuj`)
  redirect(`/admin/placowki/${placowkaId}/edytuj?success=password`)
}
