# دليل الأمان - Security Guidelines

## مستويات الأمان المطبقة

### 1. Security Headers (تم تطبيقها)
- ✅ X-Frame-Options: DENY - منع Clickjacking
- ✅ X-Content-Type-Options: nosniff - منع MIME sniffing
- ✅ Strict-Transport-Security - فرض HTTPS
- ✅ Content-Security-Policy - منع XSS
- ✅ Referrer-Policy - حماية الخصوصية

### 2. HTTPS Enforcement (تم تطبيقها)
- ✅ جميع الطلبات تحول تلقائياً لـ HTTPS
- ✅ Middleware يفرض HTTPS في Production

### 3. API Key Protection (تم تطبيقها)
- ✅ API Keys محفوظة في Server-only ملفات
- ✅ استخدام `/lib/server/secure-api-keys.ts` فقط من الـ Backend
- ✅ تدوير API Keys تلقائياً كل 8 ساعات
- ✅ لا تستخدم `process.env` من Client Components

### 4. Source Maps Disabled (تم تطبيقها)
- ✅ productionBrowserSourceMaps: false
- ✅ لا يمكن للمهاجمين قراءة الكود الأصلي من DevTools

### 5. Environment Variables (تم تطبيقها)
- ✅ Private keys بدون `NEXT_PUBLIC_` prefix
- ✅ Public variables فقط تبقى مرئية للـ Client
- ✅ `.env.example` يوضح الهيكل الصحيح

## قائمة المراجعة للمطورين

### عند إضافة متغيرات بيئية جديدة:
```
❌ DONT:
const apiKey = process.env.API_KEY // في Client Component

✅ DO:
// في Server Component أو API Route
import { secureApiKeyManager } from "@/lib/server/secure-api-keys"
const key = secureApiKeyManager.getCurrentKey()
```

### عند إنشاء API Route جديد:
```
✅ استخدم Secure Wrapper:
import { secureRoute, createSecureResponse } from "@/lib/server/api-wrapper"

export const POST = secureRoute(async (req) => {
  // Your handler here
  return createSecureResponse({ data: result })
}, { 
  rateLimit: { maxRequests: 10, windowMs: 60000 }
})
```

### عند معالجة Errors:
```
✅ استخدم Safe Error Response:
import { createSafeErrorResponse } from "@/lib/server/security-utils"

const error = createSafeErrorResponse(
  err,
  500,
  "حدث خطأ في معالجة الطلب"
)
// لا تفضح تفاصيل الخطأ للـ Client
```

## اختبار الأمان

### 1. فتح DevTools (F12) والتحقق من:
- ❓ لا توجد أي API Keys في Network tab
- ❓ الـ Console فارغ من Logs الحساسة
- ❓ HTML نظيف بدون معلومات في attributes
- ❓ Storage محذوف

### 2. فحص Network Requests:
- ❓ جميع الطلبات تذهب لـ /api/ endpoints
- ❓ لا توجد Direct calls لـ Third-party APIs
- ❓ جميع الـ Responses محررة من البيانات الحساسة

### 3. Source Maps Check:
- ❓ لا توجد .map files في Production
- ❓ Minified code فقط

## في حالة اكتشاف ثغرة أمنية

1. ⏸️ توقف النشر فوراً
2. 🔍 حدد الملف المتأثر
3. 🔐 غير API Keys إذا لزم الأمر
4. ✅ أضف اختبار يمنع تكرار المشكلة
5. 📋 وثق التغييرات بالتفاصيل

## الملفات الأمنية الرئيسية

- `/middleware.ts` - Security middleware
- `/lib/server/secure-api-keys.ts` - إدارة API Keys بأمان
- `/lib/server/security-utils.ts` - Utilities أمنية
- `/lib/server/api-wrapper.ts` - Wrapper آمن للـ API Routes
- `/next.config.mjs` - Security headers قوية
- `.env.example` - قالب المتغيرات البيئية

## المراجع الإضافية

- [OWASP Security Guidelines](https://owasp.org/)
- [Next.js Security Best Practices](https://nextjs.org/docs/basic-features/security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
