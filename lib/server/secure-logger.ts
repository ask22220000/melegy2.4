/**
 * SECURE LOGGING UTILITY
 * Provides safe logging that removes sensitive information
 * Use this instead of console.log for any sensitive operations
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
}

// Patterns to identify sensitive information
const SENSITIVE_PATTERNS = [
  /api[_-]?key/gi,
  /secret/gi,
  /password/gi,
  /token/gi,
  /bearer\s+[a-z0-9\-_.]+/gi,
  /authorization/gi,
  /x-api-key/gi,
  /process\.env/gi,
]

// Sensitive keys to redact from objects
const SENSITIVE_KEYS = [
  "apiKey",
  "api_key",
  "secret",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "bearer",
]

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private logs: LogEntry[] = []

  /**
   * Redact sensitive information from strings
   */
  private redactString(str: string): string {
    let redacted = str

    SENSITIVE_PATTERNS.forEach((pattern) => {
      redacted = redacted.replace(pattern, "[REDACTED]")
    })

    return redacted
  }

  /**
   * Redact sensitive information from objects
   */
  private redactObject(obj: any): any {
    if (obj === null || typeof obj !== "object") {
      return obj
    }

    if (typeof obj === "string") {
      return this.redactString(obj)
    }

    const redacted: any = Array.isArray(obj) ? [] : {}

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
          redacted[key] = "[REDACTED]"
        } else if (typeof obj[key] === "string") {
          redacted[key] = this.redactString(obj[key])
        } else if (typeof obj[key] === "object") {
          redacted[key] = this.redactObject(obj[key])
        } else {
          redacted[key] = obj[key]
        }
      }
    }

    return redacted
  }

  /**
   * Format log message safely
   */
  private formatMessage(message: string, context?: any): { message: string; context?: any } {
    return {
      message: this.redactString(message),
      ...(context && { context: this.redactObject(context) }),
    }
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, context?: any) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage(message, context)
      console.debug("[DEBUG]", formatted.message, formatted.context || "")
    }

    this.addLog("debug", message, context)
  }

  /**
   * Info level logging
   */
  info(message: string, context?: any) {
    const formatted = this.formatMessage(message, context)
    console.log("[INFO]", formatted.message, formatted.context || "")
    this.addLog("info", message, context)
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: any) {
    const formatted = this.formatMessage(message, context)
    console.warn("[WARN]", formatted.message, formatted.context || "")
    this.addLog("warn", message, context)
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | any, context?: any) {
    const errorMessage =
      error instanceof Error
        ? `${message}: ${error.message}`
        : `${message}: ${JSON.stringify(error)}`

    const formatted = this.formatMessage(errorMessage, context)
    console.error("[ERROR]", formatted.message, formatted.context || "")
    this.addLog("error", errorMessage, context)
  }

  /**
   * Log API request (safe, no credentials)
   */
  logApiRequest(
    method: string,
    path: string,
    statusCode?: number,
    duration?: number,
    error?: any
  ) {
    const message = `${method} ${path}${statusCode ? ` - ${statusCode}` : ""}${duration ? ` (${duration}ms)` : ""}`
    if (error) {
      this.error(message, error)
    } else {
      this.info(message)
    }
  }

  /**
   * Get all logs (useful for debugging, remove from production response)
   */
  getLogs(): LogEntry[] {
    return this.logs
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * Add log entry
   */
  private addLog(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.redactString(message),
      ...(context && { context: this.redactObject(context) }),
    }

    this.logs.push(entry)

    // Keep only last 100 logs in memory
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100)
    }
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger()

/**
 * Helper for traditional console.log but safe
 */
export function safeLog(message: string, data?: any) {
  secureLogger.info(message, data)
}

/**
 * Helper for errors
 */
export function safeError(message: string, error: any, context?: any) {
  secureLogger.error(message, error, context)
}
