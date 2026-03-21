import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Force HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https"
  ) {
    const secureUrl = request.nextUrl.clone()
    secureUrl.protocol = "https"
    return NextResponse.redirect(secureUrl, {
      status: 308,
      headers: response.headers,
    })
  }

  // Security Headers - Applied to all responses
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  )
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  )
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  )
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none")

  // Prevent browser caching for sensitive operations
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    )
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
  }

  // Prevent access to sensitive files
  if (
    request.nextUrl.pathname.includes("/.env") ||
    request.nextUrl.pathname.includes("/admin") ||
    request.nextUrl.pathname.includes("/config")
  ) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths except:
    "/((?!_next/static|_next/image|favicon.ico|public|sitemap.xml|robots.txt).*)",
  ],
}
