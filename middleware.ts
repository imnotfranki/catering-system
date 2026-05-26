import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

import { getRoleHome, getUserRole } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return res
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value)
          res.cookies.set(name, value, options)
        })
      },
    },
  })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  if (!session && pathname !== '/auth/login') {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.search = ''

    return NextResponse.redirect(redirectUrl)
  }

  if (session && (pathname === '/' || pathname === '/auth/login')) {
    const role = await getUserRole(supabase)
    const redirectUrl = req.nextUrl.clone()

    if (!role) {
      await supabase.auth.signOut()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.search = ''

      return NextResponse.redirect(redirectUrl)
    }

    redirectUrl.pathname = getRoleHome(role)
    redirectUrl.search = ''

    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/placowka/:path*',
    '/kuchnia/:path*',
    '/kierowca/:path*',
    '/auth/:path*',
  ],
}
