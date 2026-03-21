/**
 * SECURITY UTILITIES - Server-Only
 * Contains helper functions for secure API operations
 */

/**
 * Sanitize API responses to prevent leaking sensitive information
 */
export function sanitizeApiResponse(response: any): any {
  if (!response) return null

  // Remove sensitive fields from response
  const sensitive = [
    "apiKey",
    "API_KEY",
    "secret",
    "token",
    "authorization",
    "password",
    "process.env",
  ]

  const sanitized = JSON.parse(JSON.stringify(response))

  function removeSensitive(obj: any) {
    if (typeof obj !== "object" || obj === null) return

    for (const key in obj) {
      if (sensitive.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
        delete obj[key]
      } else if (typeof obj[key] === "object") {
        removeSensitive(obj[key])
      }
    }
  }

  removeSensitive(sanitized)
  return sanitized
}

/**
 * Log API calls securely (no credentials in logs)
 */
export function logSecureApiCall(
  service: string,
  method: string,
  status: number,
  duration: number
) {
  const timestamp = new Date().toISOString()
  console.log(
    `[${timestamp}] [Server] ${service} ${method} - Status: ${status} - Duration: ${duration}ms`
  )
}

/**
 * Validate request origin (prevent CSRF)
 */
export function validateRequestOrigin(
  request: Request,
  allowedOrigins: string[] = []
): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  // Default allowed origins
  const defaults = [
    process.env.NEXT_PUBLIC_APP_URL,
    "https://melegy.app",
    "https://www.melegy.app",
  ].filter(Boolean)

  const allowed = [...defaults, ...allowedOrigins]

  if (!origin && !referer) {
    // Allow same-site requests without origin header
    return true
  }

  const requestOrigin = origin || (referer ? new URL(referer).origin : null)
  const isValid = allowed.some((a) => a && requestOrigin?.includes(a))

  if (!isValid) {
    console.warn(`[Server] Invalid request origin: ${requestOrigin}`)
  }

  return isValid
}

/**
 * Create safe error response (no stack traces or sensitive info)
 */
export function createSafeErrorResponse(
  error: unknown,
  statusCode: number = 500,
  userMessage: string = "حدث خطأ في معالجة طلبك"
) {
  console.error("[Server] Error:", error)

  // Never expose error details to client in production
  const isDevelopment = process.env.NODE_ENV === "development"

  return {
    error: userMessage,
    ...(isDevelopment && { details: error instanceof Error ? error.message : String(error) }),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Rate limiting helper
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const record = requestCounts.get(identifier)

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (record.count < maxRequests) {
    record.count++
    return true
  }

  return false
}

/**
 * Verify that code runs on server only
 */
export function ensureServerEnvironment() {
  if (typeof window !== "undefined") {
    throw new Error(
      "This code should only run on the server. Check your imports and remove from client components."
    )
  }
}
