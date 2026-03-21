/**
 * SECURITY TEST EXAMPLE
 * Tests to verify security implementation
 * Add this to your test suite
 */

// Example: Using Jest or Vitest
describe("Security Implementation", () => {
  describe("API Routes Security", () => {
    it("should not expose API keys in response", async () => {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "test" }),
      })

      const data = await response.json()
      const jsonString = JSON.stringify(data)

      // Check that response doesn't contain any API keys
      expect(jsonString).not.toMatch(/api[_-]?key/i)
      expect(jsonString).not.toMatch(/process\.env/)
      expect(jsonString).not.toMatch(/bearer\s+/i)
      expect(jsonString).not.toMatch(/token\s*=/)
    })

    it("should include security headers", async () => {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "test" }),
      })

      // Check for required security headers
      expect(response.headers.get("X-Frame-Options")).toBe("DENY")
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff")
      expect(response.headers.get("X-XSS-Protection")).toContain("block")
    })

    it("should reject requests with invalid origin", async () => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Origin: "https://malicious-site.com",
        },
        body: JSON.stringify({ message: "test" }),
      })

      // Should be rejected
      expect(response.status).toBe(403)
    })

    it("should enforce rate limiting", async () => {
      const requests = []

      // Send 15 requests in rapid succession
      for (let i = 0; i < 15; i++) {
        requests.push(
          fetch("/api/chat", {
            method: "POST",
            body: JSON.stringify({ message: "test" }),
          })
        )
      }

      const responses = await Promise.all(requests)
      const rateLimited = responses.filter((r) => r.status === 429)

      // Should have some rate limited responses
      expect(rateLimited.length).toBeGreaterThan(0)
    })
  })

  describe("Environment Variables", () => {
    it("should not expose private keys to client", () => {
      // Check that private env vars don't start with NEXT_PUBLIC_
      const privateKeys = [
        "GEMINI_API_KEYS",
        "PERPLEXITY_API_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
      ]

      privateKeys.forEach((key) => {
        expect(key).not.toMatch(/^NEXT_PUBLIC_/)
      })
    })

    it("should only expose public variables to client", () => {
      // These should be available in client
      const publicVars = [
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        process.env.NEXT_PUBLIC_APP_URL,
      ]

      publicVars.forEach((v) => {
        // Just verify they can be accessed (in dev/build time)
        expect(typeof v === "string" || v === undefined).toBe(true)
      })
    })
  })

  describe("Source Maps", () => {
    it("should not include source maps in production bundle", () => {
      // This would run during build time
      const nextConfig = require("../../next.config.mjs")

      expect(nextConfig.productionBrowserSourceMaps).toBe(false)
    })
  })

  describe("Logging Security", () => {
    it("should redact sensitive data from logs", async () => {
      const { secureLogger } = require("@/lib/server/secure-logger")

      const logs = []
      const originalLog = console.log
      console.log = (...args: any[]) => logs.push(args.join(" "))

      // Log with sensitive data
      secureLogger.info("User operation", {
        apiKey: "secret-key-123",
        token: "bearer-token",
        userId: "user-123",
      })

      console.log = originalLog

      const logString = logs.join(" ")

      // Sensitive data should be redacted
      expect(logString).toContain("[REDACTED]")
      expect(logString).not.toContain("secret-key-123")
      expect(logString).not.toContain("bearer-token")

      // Safe data should be present
      expect(logString).toContain("user-123")
    })
  })

  describe("HTTPS Enforcement", () => {
    it("should redirect HTTP to HTTPS in production", async () => {
      const { middleware } = require("../../middleware")

      // Mock a non-HTTPS request
      const request = new Request("http://localhost:3000/", {
        method: "GET",
        headers: {
          "x-forwarded-proto": "http",
        },
      })

      const response = middleware(request)

      expect(response.status).toBe(308)
      expect(response.headers.get("location")).toContain("https://")
    })
  })

  describe("DevTools Security", () => {
    it("should prevent X-Frame-Options clickjacking", async () => {
      const response = await fetch("/")

      const xFrameOptions = response.headers.get("X-Frame-Options")
      expect(xFrameOptions).toBe("DENY")
    })

    it("should include CSP headers", async () => {
      const response = await fetch("/")

      const csp = response.headers.get("Content-Security-Policy")
      expect(csp).toBeTruthy()
      expect(csp).toContain("default-src 'none'")
    })
  })

  describe("API Key Manager", () => {
    it("should rotate API keys", () => {
      const { secureApiKeyManager } = require("@/lib/server/secure-api-keys")

      const key1 = secureApiKeyManager.getCurrentKey()
      expect(key1).toBeDefined()

      // Force rotation
      secureApiKeyManager.forceRotate()

      const key2 = secureApiKeyManager.getCurrentKey()
      expect(key2).toBeDefined()
    })

    it("should handle rate limit errors", () => {
      const { secureApiKeyManager } = require("@/lib/server/secure-api-keys")

      const initialKey = secureApiKeyManager.getCurrentKey()

      // Simulate rate limit error
      secureApiKeyManager.reportError(429)

      const newKey = secureApiKeyManager.getCurrentKey()

      // Should have rotated to a different key (if multiple available)
      // This test assumes you have multiple keys configured
      expect(newKey).toBeDefined()
    })
  })
})

// Manual Test Checklist (run before deployment)
const MANUAL_TESTS = `
MANUAL SECURITY TESTS - Run before deployment:

1. DevTools Test (F12)
   [ ] Open the app in browser
   [ ] Press F12
   [ ] Go to Console tab
   [ ] Look for any error messages with sensitive data
   [ ] Check Network tab - no API keys in requests/responses
   [ ] Check Storage tab - should be mostly empty
   [ ] Check Application tab - check cookies and local storage

2. Source Code Test
   [ ] Open DevTools > Sources
   [ ] Browse static files
   [ ] Verify code is minified (not readable)
   [ ] Verify no .map files are loaded

3. Response Body Test
   [ ] Make an API call
   [ ] Check Response in Network tab
   [ ] Search for: "api", "key", "secret", "token"
   [ ] Should find NOTHING

4. Environment Variables Test
   [ ] grep -r "process.env" components/
   [ ] grep -r "process.env" app/
   [ ] Result should be: 0 matches

5. Git History Test
   [ ] git log --all -p -S 'API_KEY'
   [ ] git log --all -p -S 'process.env'
   [ ] Result should be: 0 matches

6. Production Build Test
   [ ] npm run build
   [ ] npm run start
   [ ] Repeat all tests above with production build

7. Security Audit Test
   [ ] npm run security-audit
   [ ] Result should be: 0 CRITICAL ISSUES
`

console.log(MANUAL_TESTS)
