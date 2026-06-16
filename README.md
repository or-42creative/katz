# כץ ✂️ — מקצר לינקים פנים-ארגוני

אפליקציה פשוטה לקיצור לינקים עם מעקב כניסות, בנויה ב-Next.js + Auth.js (כניסה עם Google) + Prisma + PostgreSQL, ומיועדת לפריסה ב-Vercel.

**יכולות:**
- ✂️ קיצור לינק ארוך לכתובת קצרה (`katz.wtf/abc1234`)
- 🎯 בניית קידוד קמפיין (פרמטרי UTM) — לא חובה
- 🔗 כתובת מותאמת אישית — לא חובה
- 📊 מעקב בסיסי: כמות כניסות, מקור (referer), מדינה, סוג מכשיר
- 🔐 כניסה עם Google (אפשר להגביל לדומיין הארגוני)
- 📤 שיתוף לינקים בלחיצה
- 👤 ניהול משתמשים לאדמין (`or@42creative.co.il`)

---

## הרצה מקומית (Local)

```bash
npm install
cp .env.example .env      # ומלאו את הערכים (ראו למטה)
npm run db:push           # יוצר את הטבלאות במסד הנתונים
npm run dev               # http://localhost:3000
```

---

## משתני סביבה (Environment Variables)

| משתנה | תיאור |
|---|---|
| `DATABASE_URL` | מחרוזת חיבור ל-PostgreSQL (השתמשו ב-Pooled URL ב-Vercel/Neon) |
| `AUTH_SECRET` | מחרוזת אקראית. צרו עם `npx auth secret` |
| `AUTH_TRUST_HOST` | `true` (חובה ב-Vercel) |
| `AUTH_GOOGLE_ID` | Client ID מ-Google Cloud |
| `AUTH_GOOGLE_SECRET` | Client Secret מ-Google Cloud |
| `ALLOWED_EMAIL_DOMAIN` | הגבלת כניסה לדומיין (לדוגמה `42creative.co.il`). השאירו ריק כדי לאפשר לכל אחד |
| `SUPER_ADMIN_EMAIL` | המייל שתמיד יהיה אדמין (ברירת מחדל: `or@42creative.co.il`) |

---

## הקמה ב-Vercel — שלב אחר שלב

### 1. מסד נתונים (PostgreSQL)
ב-Vercel: **Storage → Create Database → Postgres** (או [Neon](https://neon.tech)).
העתיקו את ה-`DATABASE_URL` (הגרסה ה-pooled).

### 2. Google OAuth
1. היכנסו ל-[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. **Create Credentials → OAuth client ID → Web application**.
3. תחת **Authorized redirect URIs** הוסיפו:
   ```
   https://<הדומיין-שלכם>.vercel.app/api/auth/callback/google
   ```
   (ולפיתוח מקומי: `http://localhost:3000/api/auth/callback/google`)
4. העתיקו את ה-Client ID וה-Client Secret.

### 3. פריסה
1. ב-Vercel: **Add New → Project**, וייבאו את הריפו `or-42creative/katz`.
2. הוסיפו את כל משתני הסביבה (מהטבלה למעלה) תחת **Settings → Environment Variables**.
3. **Deploy**.
4. אחרי הפריסה הראשונה, הריצו פעם אחת כדי ליצור את הטבלאות:
   ```bash
   # מקומית, עם ה-DATABASE_URL של הפרודקשן ב-.env
   npm run db:push
   ```
   (או הוסיפו את הצעד הזה ל-build pipeline).

### 4. דומיין מותאם
האפליקציה רצה על **https://katz.wtf**. ב-Vercel: **Settings → Domains** — הוסיפו `katz.wtf`,
והגדירו ב-DNS אצל רשם הדומיין את הרשומות ש-Vercel מציג (A record לאפקס / CNAME ל-www).

> ⚠️ אחרי שמוסיפים דומיין, עדכנו את ה-redirect URI ב-Google:
> `https://katz.wtf/api/auth/callback/google`
> וכדאי גם להגדיר ב-Vercel את משתנה הסביבה `NEXT_PUBLIC_SITE_URL=https://katz.wtf`.

---

## איך זה עובד

- כל לינק מקבל `slug` קצר (7 תווים) או כתובת מותאמת אישית.
- כניסה ל-`/<slug>` רושמת כניסה (referer, מדינה, מכשיר) ומפנה ליעד.
- נתוני המדינה/עיר מגיעים מ-headers של Vercel (`x-vercel-ip-country`) — עובדים רק בפרודקשן.
- האדמין (`SUPER_ADMIN_EMAIL`) רואה את כל המשתמשים ויכול למנות/להוריד מנהלים ולמחוק משתמשים.

## סטאק

Next.js 15 (App Router) · Auth.js v5 · Prisma 6 · PostgreSQL · Tailwind CSS v4
