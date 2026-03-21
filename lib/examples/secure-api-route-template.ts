/**
 * EXAMPLE: Secure API Route Template
 * Copy this template for creating new API routes
 * Location: app/api/example/route.ts
 */

import { NextRequest, NextResponse } from "next/server"
import { secureRoute, createSecureResponse, getClientIp } from "@/lib/server/api-wrapper"
import { secureLogger } from "@/lib/server/secure-logger"
import { secureApiKeyManager } from "@/lib/server/secure-api-keys"

/**
 * POST /api/example
 * Example of a secure API route
 */
export const POST = secureRoute(
  async (req: NextRequest) => {
    const clientIp = getClientIp(req)
    const startTime = Date.now()

    try {
      // 1. Parse and validate request body
      const body = await req.json()
      const { message } = body as { message?: string }

      if (!message) {
        return createSecureResponse(
          {
            error: "Message is required",
          },
          400
        )
      }

      // 2. Log the request (safe - no sensitive data)
      secureLogger.info("Processing example request", {
        clientIp,
        messageLength: message.length,
      })

      // 3. Call external service with API key
      // API Key is protected - never exposed to client
      const apiKey = secureApiKeyManager.getCurrentKey()

      const externalResponse = await fetch("https://api.example.com/process", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message }),
      })

      // 4. Handle external service errors
      if (!externalResponse.ok) {
        if (externalResponse.status === 429) {
          secureApiKeyManager.reportError(429)
          secureLogger.warn("Rate limit exceeded, rotating API key")
        }

        throw new Error(`External API returned ${externalResponse.status}`)
      }

      const result = await externalResponse.json()
      secureApiKeyManager.reportSuccess()

      // 5. Sanitize response before sending to client
      // Remove any sensitive fields that might have been in the response
      const safeResult = {
        success: true,
        data: {
          processed: result.processed || result.text || result.data,
          // Only expose what's necessary
        },
        // Never expose: apiKey, internal_id, raw_response, etc.
      }

      // 6. Log successful response (safe)
      const duration = Date.now() - startTime
      secureLogger.info("Request processed successfully", {
        duration,
        clientIp,
      })

      // 7. Return safe response with security headers
      return createSecureResponse(safeResult, 200)
    } catch (error) {
      // 8. Handle errors safely - never expose sensitive details
      const duration = Date.now() - startTime

      secureLogger.error("Request failed", error, {
        clientIp,
        duration,
      })

      // Return safe error response (user-friendly message only)
      return createSecureResponse(
        {
          error: "حدث خطأ في معالجة طلبك",
          // In development, you might return: error: error.message
          // In production, never expose error details
        },
        500
      )
    }
  },
  {
    // Security options
    requireAuth: false, // Set to true if you need authentication
    rateLimit: {
      maxRequests: 10, // 10 requests
      windowMs: 60000, // per minute
    },
    allowedMethods: ["POST"],
    logRequest: true,
  }
)

/**
 * GET /api/example (optional)
 * Example of a GET endpoint
 */
export const GET = secureRoute(
  async (_req: NextRequest) => {
    // For GET endpoints, you typically just return data
    // No sensitive processing needed

    return createSecureResponse({
      message: "This is a safe public endpoint",
      timestamp: new Date().toISOString(),
    })
  },
  {
    allowedMethods: ["GET"],
    rateLimit: {
      maxRequests: 30,
      windowMs: 60000,
    },
  }
)

/**
 * IMPORTANT SECURITY NOTES:
 *
 * 1. NEVER expose API keys, tokens, or secrets in responses
 * 2. ALWAYS validate and sanitize user input
 * 3. ALWAYS use secureRoute wrapper for all endpoints
 * 4. ALWAYS catch errors and return safe messages
 * 5. ALWAYS log requests (without sensitive data)
 * 6. NEVER log request/response bodies that contain secrets
 * 7. Use secureApiKeyManager for external API calls
 * 8. Use secureLogger for logging
 * 9. Set rate limits based on endpoint needs
 * 10. Test your endpoint with DevTools open to ensure no data leaks
 */
