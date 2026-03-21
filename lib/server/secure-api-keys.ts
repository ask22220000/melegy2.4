/**
 * SECURE SERVER-ONLY API KEY MANAGER
 * This file should ONLY run on the server (backend)
 * DO NOT import this in client components
 */

// Rotate API keys every 8 hours
const ROTATION_INTERVAL = 8 * 60 * 60 * 1000

interface ApiKeyState {
  currentIndex: number
  lastRotation: number
  errorCount: number
  failedKeys: Set<number>
}

class SecureApiKeyManager {
  private state: ApiKeyState
  private apiKeys: string[]

  constructor() {
    // Load only on server initialization
    const keys = (process.env.GEMINI_API_KEYS || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)

    if (keys.length === 0) {
      console.error("⚠️ WARNING: GEMINI_API_KEYS environment variable is not set!")
    }

    this.apiKeys = keys

    this.state = {
      currentIndex: 0,
      lastRotation: Date.now(),
      errorCount: 0,
      failedKeys: new Set(),
    }
  }

  private rotateKey(): void {
    const startIndex = this.state.currentIndex
    let attempts = 0

    do {
      this.state.currentIndex = (this.state.currentIndex + 1) % this.apiKeys.length
      attempts++

      if (attempts >= this.apiKeys.length) {
        this.state.failedKeys.clear()
        break
      }
    } while (this.state.failedKeys.has(this.state.currentIndex))

    this.state.lastRotation = Date.now()
    this.state.errorCount = 0

    console.log(`[Server] API Key rotated to index ${this.state.currentIndex + 1}/${this.apiKeys.length}`)
  }

  /**
   * Get current API key - NEVER expose this outside server
   * @returns The current valid API key
   */
  public getCurrentKey(): string {
    const now = Date.now()
    const timeSinceLastRotation = now - this.state.lastRotation

    if (timeSinceLastRotation >= ROTATION_INTERVAL) {
      this.rotateKey()
    }

    return this.apiKeys[this.state.currentIndex]
  }

  /**
   * Report API error
   */
  public reportError(statusCode?: number): void {
    if (statusCode === 429) {
      console.error("[Server] Quota exceeded (429), rotating API key immediately")
      this.state.failedKeys.add(this.state.currentIndex)
      this.rotateKey()
      return
    }

    this.state.errorCount++

    if (this.state.errorCount >= 1) {
      console.error("[Server] Error detected, rotating to next API key")
      this.state.failedKeys.add(this.state.currentIndex)
      this.rotateKey()
    }
  }

  /**
   * Report successful API call
   */
  public reportSuccess(): void {
    if (this.state.errorCount > 0) {
      this.state.errorCount = 0
    }
  }

  /**
   * Force immediate rotation
   */
  public forceRotate(): void {
    console.log("[Server] Forcing API key rotation")
    this.rotateKey()
  }

  /**
   * Get key rotation info (for monitoring only, safe to expose)
   */
  public getKeyInfo(): { index: number; totalKeys: number; timeUntilRotation: number } {
    const now = Date.now()
    const timeSinceLastRotation = now - this.state.lastRotation
    const timeUntilRotation = ROTATION_INTERVAL - timeSinceLastRotation

    return {
      index: this.state.currentIndex + 1,
      totalKeys: this.apiKeys.length,
      timeUntilRotation: Math.max(0, timeUntilRotation),
    }
  }
}

// Export singleton instance
export const secureApiKeyManager = new SecureApiKeyManager()

/**
 * Verify that a function is running on server
 * This is a safety check
 */
export function ensureServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("This function should only run on the server!")
  }
}
