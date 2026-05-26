import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

import { getRoleHome, getUserRole } from '@/lib/auth'

const protectedRoutes = {
  admin: '/admin',
  placowka: '/placowka',
  kuchnia: '/kuchnia',
  kierowca: '/kierowca',
} as const

function getProtectedRoute(pathname: string) {
  return Object.entries(protectedRoutes).find(([, route]) => {
    return pathname === route || pathname.startsWith(`${route}/`)
  })
}

function redirectIfDifferent(req: NextRequest, pathname: string) {
  if (req.nextUrl.pathname === pathname) {
    return NextResponse.next()
  }

  const redirectUrl = req.nextUrl.clone()
  redirectUrl.pathname = pathname
  redirectUrl.search = ''

  return NextResponse.redirect(redirectUrl)
}

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
  const protectedRoute = getProtectedRoute(pathname)

  if (pathname === '/auth/login') {
    if (!session) {
      return res
    }

    const role = await getUserRole(supabase)

    if (!role) {
      return res
    }

    return redirectIfDifferent(req, getRoleHome(role))
  }

  if (pathname === '/') {
    if (!session) {
      return redirectIfDifferent(req, '/auth/login')
    }

    const role = await getUserRole(supabase)

    if (!role) {
      return redirectIfDifferent(req, '/auth/login')
    }

    return redirectIfDifferent(req, getRoleHome(role))
  }

  if (protectedRoute) {
    if (!session) {
      return redirectIfDifferent(req, '/auth/login')
    }

    const [routeRole] = protectedRoute
    const role = await getUserRole(supabase)

    if (!role) {
      return res
    }

    if (role === routeRole) {
      return res
    }

    return redirectIfDifferent(req, getRoleHome(role))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
