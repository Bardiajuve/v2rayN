# سه‌گام (3GAAM) — Showroom

وب‌سایت فروش عمده کفش «گروه تولیدی کفش سه‌گام». سایت استاتیک (HTML/CSS/ES modules)، فارسی و راست‌به‌چپ، بدون Build و بدون CDN (GSAP، Lenis و فونت‌ها محلی هستند).

## اجرا

```bash
cd 3gaam-site
python3 -m http.server 8000      # سپس http://localhost:8000
```

> باید از طریق یک وب‌سرور اجرا شود (نه `file://`) چون داده‌ها با `fetch` خوانده می‌شود. روی هر هاست استاتیک (Nginx، Netlify، GitHub Pages …) مستقیم قابل انتشار است.

## صفحات (مسیرها با hash)

| مسیر | محتوا |
|---|---|
| `#/` | ورود: عکس‌های شناور سه‌بعدی + پارالکس ماوس/ژیروسکوپ |
| `#/p/<slug>/<رنگ>` | صحنه محصول (کل صفحه). اسکرول، کشیدن، ← →، سوایپ |
| `#/wall` | دیوار همه مدل‌ها (قفسه / شبکه + فیلتر). کلیک = زوم به صحنه محصول |
| `#/about` `#/contact` `#/shipping` | درباره، تماس (نقشه گوگل/نشان)، ارسال و خرید |
| `#/inquiry` + کشوی «لیست استعلام» | لیست استعلام → ارسال در واتساپ (`wa.me/989126779887`) |

هیچ قیمتی در سایت نمایش داده نمی‌شود. فروش کارتنی (۱۲ جفت) با حداقل ۲ کارتن.

## افزودن محصول / عکس

همه‌چیز در **`data/products.json`** است. یک محصول جدید = یک ردیف در `products`:

```json
{
  "slug": "samba-og",              // آدرس یکتا
  "name": "Samba OG",              // نام لاتین (متن بزرگ پشت کفش نیز از display می‌آید)
  "display": "SAMBA",
  "fa": "سمبا او جی",
  "category": "اسپرت روزمره",
  "tag": "جدید",                    // اختیاری
  "sole": "pu",                    // pu | eva | airbolling | pvc
  "gender": "men",                 // men (۴۰–۴۴) | women (۳۶–۴۰) | unisex (۳۶–۴۴)
  "description": "…",
  "colors": [
    { "id": "black", "name": "مشکی", "hex": "#15171a", "source": "samba-black.png" }
  ],
  "features": [                    // نکته‌های شناور روی کفش (اختیاری) — x,y نقطه روی عکس، lx,ly جای برچسب (۰ تا ۱)
    { "k": "sole", "x": .5, "y": .9, "lx": .2, "ly": 1.1, "t": "زیره PU", "d": "سبک و ضدلغزش" }
  ]
}
```

۱. عکس را (حتی با پس‌زمینه) در پوشه `photos-src/` بگذارید و نام فایل را در `source` بنویسید.
۲. اسکریپت را اجرا کنید:

```bash
pip install rembg onnxruntime pillow numpy scipy
python3 tools/process_photos.py --src photos-src
```

اسکریپت پس‌زمینه را حذف می‌کند، برش می‌زند، `assets/products/<slug>/<رنگ>.webp` و `-sm.webp` می‌سازد، رنگ غالب را استخراج می‌کند و `theme` (رنگ دنیای صحنه) را در `products.json` می‌نویسد. گزینه‌های هر رنگ: `"keep":"largest"`، `"alphaCut":150`، `"crop":[x0,y0,x1,y1]`، `"world":"#hex"` (رنگ صحنه دستی). اگر PNG شفاف دارید، همان را بدهید؛ حذف پس‌زمینه رد می‌شود.

`--only <slug>` فقط یک محصول، `--force` بازسازی، `--theme-only` فقط محاسبه دوباره رنگ‌ها.

## ساختار

```
index.html · css/main.css · data/products.json
js/main.js (router) entry.js scene.js wall.js drawer.js pages.js chrome.js bg.js state.js
js/vendor (gsap, Flip, Lenis) · assets/{fonts,products,lifestyle,logo,og} · tools/process_photos.py
```

## نکات

- `prefers-reduced-motion` رعایت می‌شود (بدون شناوری و با انتقال فوری). بدون WebGL کار می‌کند (فقط CSS/DOM).
- نشانی نقشه‌ها از متن آدرس ساخته می‌شود؛ برای دقت بیشتر، لینک پین دقیق را در `js/pages.js` (`initMaps`) جایگزین کنید.
- فونت‌ها: Estedad (تیتر)، Vazirmatn (متن)، Archivo (نام مدل‌ها) — همگی OFL.
- نام‌های مدل نمونه‌اند و از روی عکس‌های ارسالی گذاشته شده‌اند؛ عکس‌های اصلی (۱۳۷ مگابایت) در ریپو نیست.
