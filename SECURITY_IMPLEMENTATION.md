# نظام الأمان الشامل - Security Implementation Guide

## ملخص التحسينات الأمنية

هذا المشروع تم تأمينه بشكل عالي جداً بحيث عند فتح F12 (DevTools) لن تظهر أي معلومات حساسة أو أكواد.

### ✅ ما تم تطبيقه:

#### 1. **Security Headers (رؤوس الأمان)**
- X-Frame-Options: DENY - منع Clickjacking attacks
- X-Content-Type-Options: nosniff - منع MIME type sniffing
- Strict-Transport-Security - فرض HTTPS دائماً
- Content-Security-Policy - منع XSS attacks
- Referrer-Policy - حماية خصوصية الـ URL
- Permissions-Policy - تعطيل الميزات الخطرة

#### 2. **HTTPS Enforcement**
- Middleware يفرض HTTPS على جميع الطلبات
- Auto-redirect من HTTP إلى HTTPS

#### 3. **API Key Protection**
- `/lib/server/secure-api-keys.ts` - إدارة آمنة للـ API Keys
- تدوير API Keys تلقائياً كل 8 ساعات
- API Keys موجودة فقط على الـ Server
- Client لا يستطيع الوصول لـ Private Keys

#### 4. **Environment Variables**
- فصل كامل بين Public و Private variables
- NEXT_PUBLIC_* فقط تظهر للـ Client
- Private keys في Server فقط
- `.env.example` يوضح الهيكل الصحيح

#### 5. **Source Maps Disabled**
- productionBrowserSourceMaps: false
- لا يمكن قراءة الكود الأصلي من DevTools

#### 6. **Safe API Routes**
- `/lib/server/api-wrapper.ts` - Wrapper آمن لكل API Route
- Request validation و origin checking
- Rate limiting مدمج
- Response sanitization

#### 7. **Secure Logging**
- `/lib/server/secure-logger.ts` - Logger آمن
- تحرير البيانات الحساسة من الـ Logs
- No sensitive data in console output

#### 8. **Security Audit**
- `scripts/security-audit.js` - Script فحص الأمان
- يكتشف الأكواد الخطرة تلقائياً
- يجب تشغيله قبل كل نشر

---

## كيفية استخدام النظام الأمني

### إنشاء API Route جديد بأمان:

```typescript
// ✅ الطريقة الصحيحة
import { secureRoute, createSecureResponse } from "@/lib/server/api-wrapper"
import { secureLogger } from "@/lib/server/secure-logger"

export const POST = secureRoute(
  async (req) => {
    try {
      const data = await req.json()
      secureLogger.info("Processing request", { userId: "..." })

      // معالجة الطلب بأمان
      const result = await someOperation(data)

      return createSecureResponse({ success: true, data: result })
    } catch (error) {
      secureLogger.error("Operation failed", error)
      throw error // سيتم التعامل معه من الـ wrapper
    }
  },
  {
    rateLimit: { maxRequests: 10, windowMs: 60000 },
    requireAuth: true,
  }
)
```

### استخدام Secure API Keys:

```typescript
// ✅ الطريقة الصحيحة - Server only
// في lib/server/my-service.ts
import { secureApiKeyManager } from "@/lib/server/secure-api-keys"

export async function callExternalAPI(data: any) {
  const apiKey = secureApiKeyManager.getCurrentKey()
  // استخدم API Key بأمان
}

// ❌ الطريقة الخاطئة
// في components/MyComponent.tsx
const apiKey = process.env.API_KEY // لا! هذا سيظهر في DevTools
```

### استخدام Secure Logging:

```typescript
import { secureLogger } from "@/lib/server/secure-logger"

// ✅ نعم - يتم تحرير الـ sensitive data تلقائياً
secureLogger.info("User logged in", { userId: "123", token: "abc-def-ghi" })
// Output: "User logged in" { userId: "123", token: "[REDACTED]" }

// ❌ لا - لا تستخدم console.log للبيانات الحساسة
console.log("Token:", process.env.API_KEY) // خطير جداً!
```

---

## الأوامر الأمنية

### فحص الأمان قبل النشر:

```bash
# فحص الأمان فقط
npm run security-audit

# فحص + بناء المشروع
npm run security-check

# فحص شامل قبل النشر (lint + audit + build)
npm run pre-deploy
```

---

## اختبار الأمان

### 1. اختبار DevTools:

```
1. افتح المشروع في المتصفح
2. اضغط F12 لفتح DevTools
3. اذهب إلى Console و Network tabs
4. تحقق من:
   - ✅ لا توجد أي API Keys
   - ✅ لا توجد أي process.env values
   - ✅ جميع الـ requests تذهب لـ /api/ endpoints
   - ✅ لا توجد .map files في Network
   - ✅ HTML نظيف بدون معلومات حساسة
```

### 2. اختبار الـ Network Requests:

```
1. افتح DevTools > Network tab
2. قم بعملية تحتاج API call
3. تحقق من:
   - ✅ Request URL آمن (لا يحتوي على keys)
   - ✅ Response نظيف (لا يحتوي على sensitive data)
   - ✅ Headers صحيحة (X-Frame-Options, CSP, etc.)
```

### 3. بحث يدوي عن المشاكل:

```bash
# ابحث عن process.env في الملفات الخطرة
grep -r "process.env" components/
grep -r "process.env" app/

# يجب أن تكون النتيجة فارغة (0 matches)
```

---

## الملفات الأمنية الرئيسية

| الملف | الغرض |
|------|-------|
| `middleware.ts` | فرض HTTPS و Security Headers |
| `lib/server/secure-api-keys.ts` | إدارة API Keys بأمان |
| `lib/server/security-utils.ts` | Utility functions أمنية |
| `lib/server/api-wrapper.ts` | Wrapper آمن للـ API Routes |
| `lib/server/secure-logger.ts` | Logging آمن بدون sensitive data |
| `next.config.mjs` | إعدادات الأمان العامة |
| `.env.example` | قالب المتغيرات البيئية |
| `SECURITY.md` | دليل الأمان المفصل |
| `scripts/security-audit.js` | Script فحص الأمان |

---

## قائمة المراجعة قبل النشر

- [ ] تشغيل `npm run security-audit` بدون أخطاء
- [ ] تشغيل `npm run build` بنجاح
- [ ] اختبار DevTools (F12) - لا توجد معلومات حساسة
- [ ] اختبار Network requests - جميع الـ responses نظيفة
- [ ] التأكد من أن `.env.local` غير موجود في git
- [ ] التأكد من أن API Keys تم تحديثها إذا تسربت
- [ ] مراجعة جميع الـ console.logs - لا توجد sensitive data
- [ ] اختبار الـ HTTPS enforcement - كل الـ requests تحول لـ HTTPS

---

## الإجراءات في حالة الطوارئ

### إذا اكتشفت leak في API Key:

1. **فوراً:**
   - توقف النشر
   - احذف الـ API Key المسرب من الخدمة الخارجية

2. **بعد 5 دقائق:**
   - أضف API Key جديد
   - حدّث `.env.local`
   - أعد نشر المشروع

3. **توثيق:**
   - اكتب تقرير عن ما حدث
   - وثق الخطوات المتخذة
   - أضف اختبار يمنع تكرار المشكلة

---

## الدعم والمساعدة

للمزيد من المعلومات:
- اقرأ `SECURITY.md` للتفاصيل الكاملة
- راجع `scripts/security-audit.js` لفهم الفحوصات
- تحقق من `lib/server/` لأمثلة الاستخدام

---

**آخر تحديث:** 2024  
**حالة الأمان:** ✅ محمي بشكل عالي جداً
