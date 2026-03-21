#!/usr/bin/env node

/**
 * SECURITY AUDIT SCRIPT
 * Run this to check for security issues in the codebase
 * Usage: node scripts/security-audit.js
 */

const fs = require("fs")
const path = require("path")

const ISSUES = []
const WARNINGS = []

// Patterns to search for
const DANGEROUS_PATTERNS = [
  {
    pattern: /process\.env\.(?!NEXT_PUBLIC_)/g,
    message: "❌ CRITICAL: process.env used outside lib/server/",
    locations: ["components/", "app/", "lib/"],
  },
  {
    pattern: /API_KEY|SECRET_KEY|PRIVATE_KEY/g,
    message: "⚠️ WARNING: Hardcoded API key found",
    locations: [""],
  },
  {
    pattern: /console\.log.*process\.env/g,
    message: "❌ CRITICAL: process.env exposed in console",
    locations: [""],
  },
  {
    pattern: /export.*process\.env/g,
    message: "❌ CRITICAL: process.env exported from module",
    locations: [""],
  },
]

/**
 * Scan directory for dangerous patterns
 */
function scanDirectory(dir, relativePath = "") {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (
        entry.name.startsWith(".") ||
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "dist"
      ) {
        continue
      }

      const fullPath = path.join(dir, entry.name)
      const relPath = path.join(relativePath, entry.name)

      if (entry.isDirectory()) {
        scanDirectory(fullPath, relPath)
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        scanFile(fullPath, relPath)
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error.message)
  }
}

/**
 * Scan individual file
 */
function scanFile(filePath, relPath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    const lines = content.split("\n")

    DANGEROUS_PATTERNS.forEach(({ pattern, message, locations }) => {
      // Check if we should scan this location
      const shouldCheck =
        locations.length === 0 || locations.some((loc) => relPath.includes(loc))

      if (!shouldCheck) return

      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          // Don't flag if inside a comment or string
          if (!line.trim().startsWith("//") && !line.includes(`"${line.trim()}"`)) {
            const severity = message.includes("CRITICAL") ? "CRITICAL" : "WARNING"

            if (severity === "CRITICAL") {
              ISSUES.push({
                severity,
                file: relPath,
                line: index + 1,
                message,
                code: line.trim().substring(0, 80),
              })
            } else {
              WARNINGS.push({
                severity,
                file: relPath,
                line: index + 1,
                message,
                code: line.trim().substring(0, 80),
              })
            }
          }
        }
      })
    })
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message)
  }
}

/**
 * Check for required security files
 */
function checkSecurityFiles() {
  const requiredFiles = [
    "middleware.ts",
    "lib/server/secure-api-keys.ts",
    "lib/server/security-utils.ts",
    "lib/server/api-wrapper.ts",
    ".env.example",
  ]

  requiredFiles.forEach((file) => {
    if (!fs.existsSync(file)) {
      ISSUES.push({
        severity: "HIGH",
        file,
        message: "⚠️ Missing security file",
      })
    }
  })
}

/**
 * Print results
 */
function printResults() {
  console.log("\n" + "=".repeat(60))
  console.log("SECURITY AUDIT REPORT")
  console.log("=".repeat(60) + "\n")

  if (ISSUES.length > 0) {
    console.log(`❌ CRITICAL ISSUES FOUND: ${ISSUES.length}\n`)
    ISSUES.forEach((issue) => {
      console.log(`  ${issue.message}`)
      console.log(`  📁 ${issue.file}:${issue.line}`)
      if (issue.code) {
        console.log(`  📝 ${issue.code}`)
      }
      console.log("")
    })
  }

  if (WARNINGS.length > 0) {
    console.log(`⚠️ WARNINGS: ${WARNINGS.length}\n`)
    WARNINGS.forEach((warn) => {
      console.log(`  ${warn.message}`)
      console.log(`  📁 ${warn.file}:${warn.line}`)
      if (warn.code) {
        console.log(`  📝 ${warn.code}`)
      }
      console.log("")
    })
  }

  if (ISSUES.length === 0 && WARNINGS.length === 0) {
    console.log("✅ No security issues found!\n")
  }

  console.log("=".repeat(60) + "\n")
  console.log("RECOMMENDATIONS:")
  console.log("1. Review all flagged files immediately")
  console.log("2. Move sensitive code to lib/server/")
  console.log("3. Use secure utilities from lib/server/")
  console.log("4. Test with 'npm run build' before deploying")
  console.log("5. Check SECURITY.md for guidelines\n")

  process.exit(ISSUES.length > 0 ? 1 : 0)
}

// Run audit
console.log("\n🔍 Starting security audit...\n")
checkSecurityFiles()
scanDirectory(".", "")
printResults()
