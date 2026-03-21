# Security Cheat Sheet - دليل سريع

## ❌ افعل و ✅ لا تفعل

### 1. استخدام API Keys

```typescript
❌ WRONG - في Client Component
import { useEffect, useState } from 'react'
export function MyComponent() {
  const apiKey = process.env.GEMINI_API_KEY // خطأ شنيع!
  const response = await fetch('https://api.google.com/...', {
    headers: { Authorization: apiKey }
  })
}

✅ RIGHT - في Server Component أو API Route
import { secureApiKeyManager } from '@/lib/server/secure-api-keys'
export async function POST(req: Request) {
  const apiKey = secureApiKeyManager.getCurrentKey()
  const response = await fetch('https://api.google.com/...', {
    headers: { Authorization: apiKey }
  })
}
```

### 2. Logging

```typescript
❌ WRONG - Logging sensitive data
console.log('User token:', process.env.AUTH_TOKEN)
console.log('Request:', { apiKey: process.env.API_KEY, data: userData })

✅ RIGHT - Using secure logger
import { secureLogger } from '@/lib/server/secure-logger'
secureLogger.info('User authenticated', { userId: user.id })
secureLogger.error('Operation failed', error)
```

### 3. Creating API Routes

```typescript
❌ WRONG - No security wrapper
export async function POST(req: Request) {
  const data = await req.json()
  // Direct processing without validation
  return Response.json({ result: data })
}

✅ RIGHT - Using secure wrapper
import { secureRoute, createSecureResponse } from '@/lib/server/api-wrapper'

export const POST = secureRoute(
  async (req) => {
    const data = await req.json()
    // Processing with built-in security
    return createSecureResponse({ result: data })
  },
  { rateLimit: { maxRequests: 10, windowMs: 60000 } }
)
```

### 4. Error Handling

```typescript
❌ WRONG - Exposing error details
try {
  // something
} catch (error) {
  return Response.json({ error: error.message, stack: error.stack }, { status: 500 })
}

✅ RIGHT - Safe error response
import { createSafeErrorResponse } from '@/lib/server/security-utils'

try {
  // something
} catch (error) {
  return createSafeErrorResponse(error, 500, 'حدث خطأ ما')
}
```

### 5. Environment Variables

```
❌ WRONG - Private key exposed
PUBLIC_API_KEY=secret123

✅ RIGHT - Proper naming
NEXT_PUBLIC_APP_URL=https://app.com  # Public
GEMINI_API_KEY=secret123              # Private (Server only)
```

---

## Commands

```bash
# Check security before every deployment
npm run security-audit

# Full security check
npm run security-check

# Pre-deployment checklist
npm run pre-deploy

# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Files Location Guide

```
✅ Safe to import in Client Components:
- components/**
- lib/utils.ts
- lib/hooks/**
- public files

❌ ONLY import in Server Components/API Routes:
- lib/server/**              ← API Keys here
- app/api/**                 ← API Routes
- lib/supabase/server.ts     ← Server clients

🔒 NEVER import anywhere:
- .env.local files
- Secret configuration
```

---

## Quick Tests

### DevTools Check (F12)
```
1. Open your site
2. Press F12
3. Go to Network tab
4. Make a request
5. Check Response:
   - ❌ NO process.env values
   - ❌ NO API Keys
   - ❌ NO tokens
   - ✅ Only safe data
```

### Console Check
```
1. Open Console tab
2. Look at network requests
3. Check all logs:
   - ❌ NO sensitive info
   - ✅ Only safe messages
```

### Source Check
```
1. Open Sources tab
2. Browse static files
3. Should see:
   - ✅ Minified/compiled code
   - ❌ NO readable source maps
   - ❌ NO .map files
```

---

## Common Mistakes

| ❌ Mistake | 🔧 Fix | 📄 Reference |
|-----------|--------|-------------|
| Using `process.env` in Client | Move to Server Component | `/lib/server/` |
| Hardcoding API Keys | Use `secureApiKeyManager` | `secure-api-keys.ts` |
| Logging secrets | Use `secureLogger` | `secure-logger.ts` |
| No API validation | Use `secureRoute` wrapper | `api-wrapper.ts` |
| Exposing errors | Use `createSafeErrorResponse` | `security-utils.ts` |
| No rate limiting | Add `rateLimit` option | `api-wrapper.ts` |
| Committing .env.local | Add to .gitignore | `.gitignore` ✅ |

---

## When to Use What

```
Need to call external API?
→ Use secureApiKeyManager

Need to log something?
→ Use secureLogger

Creating API Route?
→ Use secureRoute wrapper

Getting user input?
→ Use req.json() + validation

Returning data to client?
→ Use createSecureResponse

Error occurred?
→ Use createSafeErrorResponse

Checking request validity?
→ Use validateRequestOrigin

Need to limit requests?
→ Use rateLimit in secureRoute

Need client IP?
→ Use getClientIp(req)
```

---

## Deployment Checklist

Before pushing to production:

- [ ] `npm run security-audit` passes
- [ ] `npm run build` succeeds
- [ ] No API Keys in git history
- [ ] .env.local is in .gitignore
- [ ] All API routes use secureRoute
- [ ] All external calls use secureApiKeyManager
- [ ] All logs use secureLogger
- [ ] DevTools (F12) shows no sensitive data
- [ ] SECURITY.md reviewed
- [ ] Team trained on security guidelines

---

## Emergency: API Key Leaked

```bash
1. STOP: Don't deploy
2. DELETE: Remove key from service
3. UPDATE: Add new key to .env.local
4. AUDIT: Check git history for exposure
5. ROTATE: Rotate all related keys
6. DEPLOY: Push security fix first
7. MONITOR: Watch for abuse
8. DOCUMENT: Write incident report
```

---

**Remember:** Security is Everyone's Job! 🔐

- Review code before merging
- Test with DevTools open
- Check API responses manually
- Keep dependencies updated
- Report security issues immediately
