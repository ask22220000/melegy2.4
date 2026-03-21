/**
 * SECURE API ROUTE WRAPPER
 * Provides unified security for all API routes
 * Use this in every route handler
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  validateRequestOrigin,
  createSafeErrorResponse,
  checkRateLimit,
  logSecureApiCall,
} from "./security-utils"

interface SecureRouteOptions {
  requireAuth?: boolean
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
  allowedMethods?: string[]
  logRequest?: boolean
}

/**
 * Wrapper for secure API routes with built-in security features
 * Usage:
 *   export const POST = secureRoute(async (req) => { ... }, { requireAuth: true })
 */
export function secureRoute(
  handler: (req: NextRequest) => Promise<NextResponse | Response>,
  options: SecureRouteOptions = {}
) {
  return async (req: NextRequest) => {
    try {
      // Validate request origin
      if (!validateRequestOrigin(req)) {
        return new NextResponse(
          JSON.stringify(
            createSafeErrorResponse(
              new Error("Invalid request origin"),
              403,
              "طلب غير مصرح"
            )
          ),
          { status: 403, headers: { "Content-Type": "application/json" } }
        )
      }

      // Check rate limiting
      if (options.rateLimit) {
        const ip = req.headers.get("x-forwarded-for") || "unknown"
        if (!checkRateLimit(ip, options.rateLimit.maxRequests, options.rateLimit.windowMs)) {
          return new NextResponse(
            JSON.stringify(
              createSafeErrorResponse(
                new Error("Too many requests"),
                429,
                "عدد الطلبات كثير جداً، حاول لاحقاً"
              )
            ),
            { status: 429, headers: { "Content-Type": "application/json" } }
          )
        }
      }

      // Validate method if specified
      if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
        return new NextResponse(
          JSON.stringify(
            createSafeErrorResponse(
              new Error(`Method ${req.method} not allowed`),
              405,
              "طريقة الطلب غير مدعومة"
            )
          ),
          { status: 405, headers: { "Content-Type": "application/json" } }
        )
      }

      // Log request
      if (options.logRequest !== false) {
        console.log(`[Server] ${req.method} ${req.nextUrl.pathname}`)
      }

      // Add security headers to response
      const response = await handler(req)

      response.headers.set("X-Content-Type-Options", "nosniff")
      response.headers.set("X-Frame-Options", "DENY")
      response.headers.set("X-XSS-Protection", "1; mode=block")
      response.headers.set("Strict-Transport-Security", "max-age=31536000")

      return response
    } catch (error) {
      console.error("[Server] API Error:", error)

      return new NextResponse(
        JSON.stringify(
          createSafeErrorResponse(
            error,
            500,
            "حدث خطأ في معالجة الطلب"
          )
        ),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
          },
        }
      )
    }
  }
}

/**
 * Create safe JSON response with security headers
 */
export function createSecureResponse(
  data: any,
  status: number = 200,
  headers?: Record<string, string>
) {
  const response = new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...headers,
    },
  })

  return response
}

/**
 * Extract IP address from request
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  return forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "unknown"
}
