import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const panels: Record<string, string> = {
  admin: '/admin',
  placowka: '/placowka',
  kuchnia: '/kuchnia',
  kierowca: '/kierowca',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (pathname.startsWith('/auth')) {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('rola')
        .eq('id', user.id)
        .single()

      if (profile?.rola) {
        const target = panels[profile.rola]

        if (target && pathname !== target) {
          return NextResponse.redirect(new URL(target, request.url))
        }
      }
    }

    return response
  }

  const protectedPaths = ['/admin', '/placowka', '/kuchnia', '/kierowca']
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtected) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rola')
      .eq('id', user.id)
      .single()

    if (!profile) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const requiredPath = panels[profile.rola]

    if (requiredPath && !pathname.startsWith(requiredPath)) {
      return NextResponse.redirect(new URL(requiredPath, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*).*)'],
}
