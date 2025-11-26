import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/dashboard", "/profile", "/assessment", "/leads"]
const authRoutes = ["/login", "/register", "/forgot-password"]
const roleBasedRoutes: Record<string, string[]> = {
  "/dashboard/admin": ["admin"],
  "/dashboard/contractor": ["contractor", "admin"],
  "/dashboard/homeowner": ["homeowner", "admin"],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request })

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // Protect routes that require authentication
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        const userRole = token.role as string
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon-.*|apple-icon.png).*)"],
}
