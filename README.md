# FF3A Android

اپ پخش صوت ساده برای اندروید، ساخته شده با Capacitor.

## تنظیم عنوان دوره

عنوان هر دوره را در `course.json` تغییر بدهید:

```json
{
  "title": "First Friends 3",
  "audioPath": "assets"
}
```

## ساختار فایل‌های صوتی

فایل‌ها داخل فولدرهای جلسه در `assets` قرار می‌گیرند:

```text
assets/
  1/
    01 1.mp3
    02 2.mp3
    taught.md
    homework.md
  2/
    05 5.mp3
    taught.md
    homework.md
```

فایل `assets/library.json` به صورت خودکار ساخته می‌شود و فقط لیست فایل‌های صوتی هر جلسه را نگه می‌دارد.

بعد فهرست را بسازید:

```powershell
npm run generate-library
```

## دیدن در مرورگر

برای تست سریع UI:

```powershell
npm run serve
```

بعد باز کنید:

```text
http://localhost:8000
```

## آماده کردن Android

هر بار که فایل صوتی، CSS، HTML یا JS تغییر کرد:

```powershell
npm run cap:sync
```

برای باز کردن پروژه در Android Studio:

```powershell
npm run cap:open
```

در Android Studio می‌توانید APK یا AAB بسازید.
