# هم‌کتاب (Book Mate): سیستم طراحی و راهنمای محتوا

> **سند ۳ از ۳** · آخرین به‌روزرسانی: ۱۸ نوامبر ۲۰۲۶
>
> سند ۱: خلاصه پروژه، پایلوت و تصمیم‌ها · سند ۲: وب‌سایت، وایرفریم‌ها، جریان امانت و نمونه اولیه

## تصمیم

- **نوامبر ۲۰۲۶:** جهت بصری **C (فیروزه‌ای)**، با فونت **Lalezar** برای نام و تیترها و **Vazirmatn** برای بقیه متن.
- همه جفت‌رنگ‌ها طبق **WCAG 2.2 AA** بررسی شده‌اند.
- **کاربرد تا امروز:**
  - پرامپت ساخت سایت یک‌صفحه‌ای (متن کامل انگلیسی در پیوست). پرامپت انگلیسی است چون برای ابزار هوش مصنوعی نوشته شده؛ همه متن قابل‌مشاهده سایت فارسی است.
  - نمونه اولیه کلیک‌پذیر ۱۸ صفحه‌ای که در ۴ نوامبر ۲۰۲۶ با همین سیستم بازطراحی شد (سند ۲).
- قواعدی که با علامت **(نمونه اولیه)** مشخص شده‌اند هنگام اعمال روی نمونه اولیه اضافه شدند و در پرامپت اصلی نیستند.

---

## ۱. حس کلی

- درباره **کتاب** است، نه آدم‌ها یا نمادهای ملی و مذهبی. تصویرها کتاب، قفسه و جلد هستند.
- آرام، قابل‌اعتماد، داوطلبانه. هیچ‌چیز نباید شبیه فروشگاه یا استارتاپ باشد.
- ساده و تخت: بدون گرادیان، بدون سایه سنگین، گوشه‌های گرد.

## ۲. زبان، جهت و نوشتار

- `<html lang="fa" dir="rtl">`. هر متن آلمانی یا انگلیسی `lang="de"` یا `lang="en"` و `dir="ltr"` می‌گیرد.
- از ویژگی‌های منطقی CSS استفاده شود (`padding-inline`، `margin-inline-start`، `text-align: start`، `inset-inline-end`) تا چیدمان در راست‌به‌چپ درست باشد.
- در متن فارسی **رقم فارسی** (۰ تا ۹) به کار می‌رود.
- نام همیشه با نیم‌فاصله (`U+200C`) نوشته می‌شود: **هم‌کتاب**. هرگز «هم کتاب».
- **واقعیت ساختگی ممنوع.** هر اطلاعاتی که نداریم به شکل جای‌نگهدار در کروشه می‌ماند: [محل برگزاری]، [تاریخ]، [ساعت]، [لینک تماس]، [ایمیل تماس].
- هر جمله‌ای که هوش مصنوعی نوشته با `<!-- AI copy: review -->` علامت می‌خورد تا بازبینی شود.
- **لحن:** فارسی طبیعی و ساده. واژه‌های فروشگاهی، استارتاپی، قیمت و «همین حالا ثبت‌نام کنید» ممنوع. به‌جای «ثبت‌نام» در سایت پایلوت: «درخواست عضویت».
- **وضعیت و خطا هرگز فقط با رنگ نشان داده نمی‌شوند.** همیشه با کلمه، و در صورت نیاز با آیکون.

### واژه‌نامه رابط کاربری

| فارسی | انگلیسی | کاربرد |
|---|---|---|
| هم‌کتاب | Book Mate | نام |
| کتاب‌ها | Books | فهرست کتاب‌ها |
| چطور کار می‌کند؟ | How it works? | صفحه توضیح |
| ثبت کتاب | Add a book | دکمه اصلی سرصفحه |
| درخواست امانت | Request to borrow | دکمه صفحه کتاب |
| امانت‌های من | My loans | امانت‌های گرفته و داده |
| کتاب‌های من | My books | کتاب‌های ثبت‌شده عضو |
| دورهمی ماهانه | Monthly meetup | تحویل و برگشت حضوری |
| صاحب کتاب / امانت‌گیرنده | Owner / Borrower | دو طرف امانت |
| موجود | Available | وضعیت |
| در امانت تا [تاریخ] | On loan until [date] | وضعیت (پرامپت: «امانت داده شده») |
| متوقف‌شده توسط صاحب کتاب | Paused by the owner | وضعیت |
| در حال بررسی | In review | وضعیت کتاب تازه |
| قبول / رد | Accept / Decline | پاسخ صاحب کتاب |
| کتاب را گرفتم | I’ve received the book | تأیید تحویل |
| برگرداندم | I’ve returned it | ثبت برگشت |
| تأیید برگشت در همان وضعیت | Confirm it’s back in the same condition | بستن امانت |
| درخواست ۲ هفته بیشتر | Ask for 2 more weeks | تمدید |
| گزارش مشکل | Report a problem | مشکل در امانت |
| قوانین هم‌کتاب | Community rules | قوانین |
| حریم خصوصی | Privacy (Datenschutz) | اطلاعیه داده‌ها |
| Impressum | Impressum | بدون ترجمه |

## ۳. رنگ‌ها

فقط همین رنگ‌ها، به شکل متغیر CSS:

```css
:root {
  --teal: #0B6B67;       /* اصلی: دکمه‌ها، پیوندها، سرصفحه */
  --teal-hover: #08524F; /* حالت hover دکمه اصلی */
  --ink: #10242A;        /* متن اصلی، بخش‌های تیره */
  --slate: #4A5E64;      /* متن فرعی */
  --white: #FFFFFF;      /* پس‌زمینه صفحه */
  --mist: #EEF6F5;       /* کارت‌ها، بخش‌های متناوب */
  --tint: #D9F0ED;       /* پس‌زمینه دکمه فرعی */
  --turquoise: #43BDB3;  /* فقط پرکردن و برجسته‌سازی */
  --saffron: #F4B63F;    /* فقط پرکردن و برجسته‌سازی */
  --border: #738B8F;     /* حاشیه فیلدها و جداکننده‌های معنادار */
  --hairline: #D7E6E4;   /* فقط خطوط تزئینی */
}
```

- فیروزه‌ای و زعفرانی **هرگز** رنگ متن روی پس‌زمینه روشن نیستند. روی آن‌ها متن `--ink` می‌آید.
- `--hairline` فقط تزئینی است؛ برای حاشیه فیلد همیشه `--border`.
- **(نمونه اولیه)** یک سایه بسیار ملایم (`rgba(16,36,42,.18)`) فقط برای پنل شناور نمونه اولیه به کار رفته که در سایت واقعی نیست. سایت واقعی سایه ندارد.

## ۴. قواعد کنتراست

| جفت (متن روی پس‌زمینه) | نسبت | نتیجه | کاربرد |
|---|---|---|---|
| ink روی white | `16.1:1` | قبول | متن اصلی |
| ink روی mist | `14.6:1` | قبول | متن روی کارت |
| ink روی tint | `13.5:1` | قبول | مرحله انجام‌شده در نوار پیشرفت (نمونه اولیه) |
| slate روی white | `6.8:1` | قبول | متن فرعی |
| slate روی mist | `6.2:1` | قبول | متن فرعی روی کارت، دکمه غیرفعال (نمونه اولیه) |
| teal روی white | `6.3:1` | قبول | پیوند |
| teal روی mist | `5.8:1` | قبول | پیوند روی کارت |
| teal روی tint | `5.3:1` | قبول | دکمه فرعی |
| white روی teal | `6.3:1` | قبول | دکمه اصلی، سرصفحه |
| white روی teal-hover | `9.0:1` | قبول | hover دکمه اصلی، منوی کشویی گوشی |
| tint روی teal-hover | `7.6:1` | قبول | برچسب فرعی در منوی گوشی (نمونه اولیه) |
| ink روی turquoise | `7.0:1` | قبول | برچسب «موجود»، شماره مراحل |
| ink روی saffron | `8.9:1` | قبول | برجسته‌سازی |
| white روی ink | `16.1:1` | قبول | بخش تیره، پانویس |
| turquoise روی ink | `7.0:1` | قبول | تیتر در بخش تیره |
| border روی white | `3.6:1` | قبول (عنصر غیرمتنی) | حاشیه فیلد |
| border روی mist | `3.3:1` | قبول (عنصر غیرمتنی) | حاشیه فیلد روی کارت |
| turquoise روی white | `2.3:1` | **رد** | هرگز به‌عنوان متن |
| ink روی teal | `2.5:1` | **رد** | خط فوکوس روی سرصفحه باید سفید باشد |

- **فوکوس:** هر پیوند، دکمه و فیلد: `outline: 3px solid var(--ink); outline-offset: 3px`.
- **(نمونه اولیه)** روی پس‌زمینه teal (سرصفحه) و ink (بخش تیره، پانویس) خط فوکوس **سفید** است، چون ink روی teal فقط `2.5:1` است و حداقل لازم برای نشانگر فوکوس `3:1` است.

## ۵. فونت‌ها

### قواعد

- **Lalezar:** فقط نام (wordmark)، `h1` و `h2`. فقط یک وزن دارد؛ همیشه `font-weight: 400` (هرگز bold، چون مرورگر آن را مصنوعی ضخیم و کثیف می‌کند). دست‌کم `28px`، `line-height: 1.5`.
- **Vazirmatn:** همه چیزهای دیگر (متن، `h3` و کوچک‌تر، منو، دکمه، فرم). وزن‌های ۴۰۰، ۵۰۰، ۶۰۰ و ۷۰۰. متن اصلی `17px` با `line-height: 1.9`؛ هرگز کمتر از `15px`.
- **خودمیزبانی:** فایل‌های woff2 در پوشه `/fonts` با `@font-face` و `font-display: swap`. از `fonts.googleapis.com` استفاده نشود تا IP بازدیدکنندگان به گوگل نرسد (مربوط به GDPR).
- **فونت جایگزین:** `Vazirmatn, Tahoma, sans-serif`.

### مقیاس متن (نمونه اولیه)

| عنصر | فونت | اندازه دسکتاپ | اندازه گوشی |
|---|---|---|---|
| نام «هم‌کتاب» | Lalezar 400 | `32px` | `28px` |
| «BOOK MATE» کنار نام | Vazirmatn 600، حروف بزرگ، فاصله حروف `.08em` | `15px` | `15px` |
| `h1` | Lalezar 400 | `44px` | `34px` |
| `h2` | Lalezar 400 | `30px` | `28px` |
| `h3` | Vazirmatn 600 | `19px` | `19px` |
| متن مقدمه (lead) | Vazirmatn 400، رنگ slate | `19px` | `19px` |
| متن اصلی | Vazirmatn 400، `line-height: 1.9` | `17px` | `17px` |
| دکمه | Vazirmatn 600 | `17px` | `17px` |
| متن کوچک، برچسب، chip | Vazirmatn 400 یا 500 | `15px` | `15px` |

### فایل‌های فونت

از بسته‌های npm با مجوز آزاد **SIL Open Font License 1.1**: `@fontsource-variable/vazirmatn` نسخه 5.3.0 و `@fontsource/lalezar` نسخه 5.3.0. در نمونه اولیه، این چهار فایل در خود بوم طراحی بارگذاری شده‌اند؛ در سایت واقعی در `/fonts` قرار می‌گیرند.

| فایل | خانواده | محدوده نویسه | حجم |
|---|---|---|---|
| `vazirmatn-arabic-wght-normal.woff2` | Vazirmatn (متغیر ۱۰۰ تا ۹۰۰) | فارسی و عربی | حدود ۴۶ کیلوبایت |
| `vazirmatn-latin-wght-normal.woff2` | Vazirmatn (متغیر ۱۰۰ تا ۹۰۰) | لاتین | حدود ۳۵ کیلوبایت |
| `lalezar-arabic-400-normal.woff2` | Lalezar 400 | فارسی و عربی | حدود ۵۲ کیلوبایت |
| `lalezar-latin-400-normal.woff2` | Lalezar 400 | لاتین | حدود ۱۷ کیلوبایت |

```css
@font-face {
  font-family: "Vazirmatn"; font-style: normal; font-weight: 100 900; font-display: swap;
  src: url(/fonts/vazirmatn-arabic-wght-normal.woff2) format("woff2");
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF,
    U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC;
}
@font-face {
  font-family: "Vazirmatn"; font-style: normal; font-weight: 100 900; font-display: swap;
  src: url(/fonts/vazirmatn-latin-wght-normal.woff2) format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304,
    U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: "Lalezar"; font-style: normal; font-weight: 400; font-display: swap;
  src: url(/fonts/lalezar-arabic-400-normal.woff2) format("woff2");
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF,
    U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC;
}
@font-face {
  font-family: "Lalezar"; font-style: normal; font-weight: 400; font-display: swap;
  src: url(/fonts/lalezar-latin-400-normal.woff2) format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304,
    U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

## ۶. چیدمان

- **حداکثر عرض محتوا:** `1100px`. **فاصله کناری:** `16px` در گوشی، `32px` در دسکتاپ.
- **موبایل‌محور:** بیشتر بازدیدکنندگان با گوشی می‌آیند. صفحه باید از عرض `320px` بدون اسکرول افقی کار کند.
- **اندازه هدف لمسی:** دست‌کم `44×44px`؛ دکمه‌ها و فیلدها `48px` ارتفاع.
- **(نمونه اولیه) نقاط شکست:**
  - تا `760px`: منوی دسکتاپ پنهان و دکمه «منو» ظاهر می‌شود؛ نام و «BOOK MATE» زیر هم.
  - تا `620px`: ستون‌های صفحه کتاب و امانت زیر هم.
  - تا `460px`: فهرست کتاب‌ها دو ستونه.
- **(نمونه اولیه) فاصله‌ها:** بین بخش‌های صفحه `48px` (گوشی `36px`)؛ داخل هر بخش `14px`؛ فاصله بالا و پایین صفحه `32/64px` (گوشی `24/48px`). کارت‌های کتاب: شبکه با حداقل `160px` و فاصله `28px` عمودی و `20px` افقی.

## ۷. کامپوننت‌ها

### از پرامپت طراحی

| کامپوننت | مشخصات |
|---|---|
| دکمه اصلی | پس‌زمینه teal، متن سفید Vazirmatn 600 و `17px`، حداقل ارتفاع `48px`، `padding-inline: 22px`، گوشه `12px`، بدون سایه. آیکون خطی اختیاری `20px` (`currentColor`) پیش از متن. hover: teal-hover |
| دکمه فرعی | پس‌زمینه tint، متن teal، همان شکل |
| پیوند متنی | teal، زیرخط‌دار، `text-underline-offset: 6px` |
| کارت | پس‌زمینه mist، گوشه `16px`، `padding: 24px`، بدون سایه و حاشیه |
| برچسب وضعیت (chip) | گوشه `8px`. «موجود»: ink روی turquoise. «امانت داده شده»: ink روی white با حاشیه `1px` به رنگ border |
| سرصفحه | پس‌زمینه teal؛ نام «هم‌کتاب» با Lalezar سفید و «Book Mate» کوچک با Vazirmatn و حروف بزرگ کنارش |
| بخش تیره | پس‌زمینه ink، متن سفید، تیتر turquoise |

### اضافه‌شده هنگام اعمال روی نمونه اولیه

| کامپوننت | مشخصات |
|---|---|
| دکمه کوچک | حداقل ارتفاع `44px`، `padding-inline: 16px`، `15px` |
| hover دکمه فرعی | متن teal-hover و حلقه داخلی `2px` به رنگ teal |
| دکمه غیرفعال | پس‌زمینه mist، متن slate، نشانگر «غیرمجاز» |
| دکمه‌ها در سرصفحه | شفاف با حلقه سفید `1px`؛ hover با پس‌زمینه teal-hover. «ثبت کتاب» و دکمه جستجو در سرصفحه به سبک فرعی (tint و teal)، چون دکمه teal روی سرصفحه teal دیده نمی‌شود |
| منوی سرصفحه | پیوندهای سفید با وزن ۵۰۰؛ صفحه فعلی و hover با زیرخط `2px`. منوی کشویی گوشی و منوی حساب: پس‌زمینه teal-hover |
| فیلد ورودی | پس‌زمینه سفید، حاشیه `1px` border، گوشه `10px`، حداقل ارتفاع `48px`، `17px`. برچسب `15px` و وزن ۵۰۰ |
| گروه گزینه‌ها (fieldset) | حاشیه `1px` border، گوشه `12px`. چک‌باکس و رادیو `22px` با رنگ teal |
| پیام خطا | پس‌زمینه سفید، حاشیه `2px` ink، گوشه `12px`، آیکون مثلث هشدار خطی و متن پررنگ؛ `role="alert"`. قرمز ندارد |
| جعبه وضعیت | پس‌زمینه سفید، حاشیه `1px` border، گوشه `16px` (برای «هنوز نمی‌توانید درخواست بدهید»، «ثبت شد» و مانند آن) |
| بخش تیره | جعبه دورهمی بعدی و پانویس: ink، متن و پیوند سفید، برچسب turquoise |
| مراحل شماره‌دار | کارت mist با گوشه `16px`؛ دایره `40px` turquoise با شماره ink (در فارسی رقم فارسی) |
| نوار پیشرفت امانت | انجام‌شده: tint با «✓»؛ مرحله فعلی: turquoise و پررنگ؛ بعدی: سفید با حاشیه و متن slate. مرحله فعلی با وزن متن هم مشخص است، نه فقط رنگ |
| برگه‌ها (tabs) | برگه فعال: زیرخط `3px` teal و متن ink پررنگ؛ بقیه slate |
| جدول | پس‌زمینه mist، گوشه `16px`، خطوط ردیف hairline، ستون برچسب slate با وزن ۵۰۰ |
| فهرست | نشانه‌های فهرست teal |
| پرسش‌های آکاردئونی | ردیف‌های حداقل `56px` با جداکننده border؛ علامت + و − به رنگ teal |
| ردیف امانت | کارت mist، گوشه `16px`، با جلد کوچک `52px` |
| جای جلد کتاب | نسبت ۲ به ۳؛ عطف `8px` در لبه آغازین؛ چهار ترکیب رنگ: turquoise با عطف teal، saffron با عطف ink، tint با عطف turquoise، teal با عطف ink و متن سفید. تا وقتی عکس واقعی جلد نیست |
| پیام کوتاه (toast) | پس‌زمینه ink، متن سفید، گوشه `12px` |
| فقط نمونه اولیه | دکمه «نمونه اولیه» زعفرانی با حاشیه خط‌چین ink؛ یادداشت‌های «پرسش باز» و «راهنمای آزمون» با حاشیه خط‌چین و برچسب زعفرانی. در سایت واقعی نیستند |

## ۸. موارد ممنوع

- گرادیان، سایه سنگین، ایموجی، عکس استوک آدم‌ها، نظرات ساختگی، آمار ساختگی، لوگوی شرکا.
- سبز و سفید و قرمز با هم (یادآور پرچم)، و تزئینات مسجد یا کاشی. تصویرها درباره کتاب‌اند.
- در سایت پایلوت: ورود، فرم ثبت‌نام، اعتبار یا امتیاز، نشان دانلود اپ، قیمت، سبد خرید، اسکریپت ردیابی یا آمارگیر.

## ۹. سایت یک‌صفحه‌ای پایلوت (مشخصات پرامپت)

- **خروجی:** یک فایل `index.html` مستقل؛ HTML معنایی، CSS در یک بلوک `<style>`، بدون فریم‌ورک، بدون جاوااسکریپت مگر واقعاً لازم.
- **اگر HTML موجود داده شود:** محتوا و ساختار حفظ و فقط این طراحی اعمال می‌شود.

| بخش | محتوا |
|---|---|
| ۱. سرصفحه | نام؛ منو: «درباره ما»، «چطور کار می‌کند؟»، «دورهمی ماهانه»، «قوانین»؛ دکمه اصلی «درخواست عضویت» با پیوند به [لینک تماس] |
| ۲. معرفی | `h1`: «کتابخانه‌ی پنهانِ برلین»؛ یک خط: «کتاب‌های خوب، به‌جای خاک خوردن در قفسه، دست‌به‌دست شوند.»؛ یادداشت کوچک که این یک پایلوت با اعضای دعوت‌شده است |
| ۳. چطور کار می‌کند؟ | سه مرحله: معرفی کتاب با تگ `#book` در گروه تلگرام؛ پیام به صاحب کتاب برای امانت؛ تبادل در دورهمی ماهانه یا با توافق |
| ۴. ما چه هستیم؟ / ما چه نیستیم؟ | دو کارت کنار هم؛ در گوشی زیر هم |
| ۵. دورهمی ماهانه‌ی مبادله‌ی کتاب | بخش تیره ink با [تاریخ]، [ساعت]، [محل برگزاری] |
| ۶. قوانین در یک نگاه | برگرداندن تا دورهمی بعدی (حدود یک ماه)؛ برگرداندن در همان وضعیت؛ کتاب قرضی را به دیگری قرض ندهید؛ اگر گم یا خراب شد، جایگزین کنید یا با صاحبش بر سر راه‌حلی منصفانه توافق کنید |
| ۷. پانویس | «پروژه‌ای داوطلبانه و غیرتجاری»؛ [ایمیل تماس]؛ پیوندهای جای‌نگهدار به Impressum و Datenschutz |

قوانین بخش ۶ همان قوانین سند پایلوت تلگرام است. اگر قوانین پایلوت تغییر کند (سند ۱، بخش ۸)، این بخش هم باید عوض شود.

## ۱۰. اعمال روی نمونه اولیه: انحراف‌ها و دلایل

| انحراف از پرامپت | دلیل |
|---|---|
| خط فوکوس سفید روی سرصفحه، بخش تیره و پانویس | ink روی teal فقط `2.5:1` است و کمتر از حداقل `3:1` |
| «ثبت کتاب» در سرصفحه به سبک فرعی | دکمه teal روی سرصفحه teal دیده نمی‌شود |
| جای جلد کتاب با رنگ‌های پالت و عطف | هنوز عکس واقعی جلد نداریم |
| کنترل‌های نمونه اولیه زعفرانی و خط‌چین | تا آزمون‌کنندگان بفهمند جزو طراحی نیستند |
| فونت‌ها در بوم طراحی بارگذاری شده‌اند، نه `/fonts` | بوم طراحی پوشه `/fonts` ندارد؛ در سایت واقعی همان فایل‌ها در `/fonts` |
| برچسب «در امانت تا [تاریخ]» به‌جای «امانت داده شده» | تاریخ یک پرسش را از اعضا کم می‌کند؛ تغییرش یک خط است |
| پانویس تیره | پرامپت فقط بخش دورهمی را تیره خواسته بود؛ پانویس تیره پایان صفحه را مشخص می‌کند. قابل برگشت |

## ۱۱. تعارض‌ها و پرسش‌های باز طراحی

- **[تعارض] حساب کاربری:** پرامپت می‌گوید ورود، ثبت‌نام و اعتبار نباشد؛ نمونه اولیه ورود، ثبت‌نام و صفحه‌های حساب دارد. این دو محصول متفاوت‌اند: یک صفحه معرفی عمومی برای پایلوت تلگرام، و یک پلتفرم عضویت برای بعد. پیشنهاد: برای پایلوت سایت یک‌صفحه‌ای پرامپت ساخته شود و نمونه اولیه برای آزمودن پلتفرم بعدی بماند.
- **[تعارض] قوانین امانت:** پرامپت «تا دورهمی بعدی» و بدون پول؛ نمونه اولیه «۱ تا ۳ ماه» و هزینه پست با امانت‌گیرنده (سند ۱، بخش ۸).
- **[باز]** بررسی نهایی نام و علامت تجاری؛ «Bookmate» از قبل وجود دارد.
- **[باز]** محتوای Impressum و اطلاعیه حریم خصوصی.
- **[باز]** کانال تماس برای درخواست عضویت ([لینک تماس]).
- **[باز]** برچسب وضعیت در امانت: «امانت داده شده» یا «در امانت تا [تاریخ]».
- **[باز]** عکس واقعی جلد کتاب‌ها: چه کسی عکس می‌گیرد و چطور بارگذاری می‌شود.
- **[باز]** آیا سایت اصلاً انگلیسی داشته باشد (نقشه سایت: در شروع فقط فارسی).

---

## پیوست: پرامپت انگلیسی برای ابزارهای هوش مصنوعی

متن کامل پرامپت، همان‌طور که در سند `website-design-prompt.md` پروژه آمده است. برای ساخت یا بازطراحی وب‌سایت به ابزار هوش مصنوعی داده می‌شود.

```text
Build (or restyle) the website for «هم‌کتاب» (Book Mate) using the design system below. If I attach existing HTML, keep its content and structure and only apply this design. Otherwise build the one-page site described at the end.

ABOUT THE PROJECT
هم‌کتاب is a volunteer-run, non-commercial book-sharing group for Persian speakers in Berlin, currently in an invite-only pilot. Members lend books from their own shelves to each other and swap them at a monthly in-person meetup (دورهمی). Nothing is sold. Never use shop, startup, pricing or "sign up now" language.

OUTPUT
- One self-contained index.html: semantic HTML, CSS in a <style> block, no frameworks, no JavaScript unless something truly needs it.
- Mobile first: most visitors are on phones. It must work from 320px wide with no horizontal scrolling.

LANGUAGE AND DIRECTION
- <html lang="fa" dir="rtl">. Any German or English passage gets lang="de" (or "en") and dir="ltr".
- Use logical CSS properties (padding-inline, margin-inline-start, text-align: start, inset-inline-end) so the layout is correct in RTL.
- Use Persian digits (۰–۹) in Persian text.
- Write the name with a zero-width non-joiner: هم‌کتاب (U+200C). Never «هم کتاب».
- Don't invent facts. Missing details stay as bracketed placeholders, e.g. [محل برگزاری], [تاریخ], [لینک تماس], [ایمیل تماس].

FONTS
- Lalezar: wordmark, h1 and h2 only. It has a single weight, so always use font-weight: 400 (never bold: browsers fake-bold it and it smears). At least 28px, line-height 1.5.
- Vazirmatn: everything else (body, h3 and smaller, nav, buttons, forms). Weights 400/500/600/700. Body 17px, line-height 1.9, never below 15px.
- Self-host both fonts (woff2 files in /fonts with @font-face and font-display: swap) instead of linking fonts.googleapis.com, so visitors' IP addresses are not sent to Google. Fallback stack: Vazirmatn, Tahoma, sans-serif.

COLOURS — use only these, as CSS custom properties
:root {
  --teal: #0B6B67;       /* primary: buttons, links, header */
  --teal-hover: #08524F;
  --ink: #10242A;        /* body text, dark sections */
  --slate: #4A5E64;      /* secondary text */
  --white: #FFFFFF;      /* page background */
  --mist: #EEF6F5;       /* cards, alternate sections */
  --tint: #D9F0ED;       /* secondary button fill */
  --turquoise: #43BDB3;  /* fills and highlights only */
  --saffron: #F4B63F;    /* highlight fills only */
  --border: #738B8F;     /* input borders, meaningful dividers */
  --hairline: #D7E6E4;   /* decorative lines only */
}

CONTRAST RULES (checked against WCAG 2.2 AA; keep these pairings)
- Body text: ink on white 16.1:1, ink on mist 14.6:1. Secondary text: slate on white 6.8:1, on mist 6.2:1.
- Links: teal on white 6.3:1, on mist 5.8:1.
- Buttons: white on teal 6.3:1 (hover 9.0:1); teal on tint 5.3:1.
- Turquoise and saffron are NEVER text on light backgrounds (turquoise on white is 2.3:1, a fail). Put ink text on them (7.0:1 and 8.9:1).
- Dark sections: ink background, white text (16.1:1), turquoise headings (7.0:1).
- Input borders use --border (3.6:1 on white, 3.3:1 on mist). --hairline is decoration only.
- Every link, button and input gets a visible focus style: outline: 3px solid var(--ink); outline-offset: 3px.
- Never show status or errors by colour alone; always use words, plus an icon if helpful.

COMPONENTS
- Primary button: teal background, white Vazirmatn 600, 17px, min-height 48px, padding-inline 22px, border-radius 12px, no shadow. Optional 20px stroke icon (currentColor) before the label. Hover: --teal-hover.
- Secondary button: --tint background, teal text, same shape.
- Text link: teal, underlined, text-underline-offset 6px.
- Card: --mist background, border-radius 16px, padding 24px, no shadow, no border.
- Status chips (border-radius 8px): «موجود» = ink on turquoise; «امانت داده شده» = ink on white with a 1px --border.
- Header: teal background, wordmark «هم‌کتاب» in Lalezar (white) with a small "Book Mate" in Vazirmatn capitals beside it.
- Touch targets at least 44×44px. Content max-width 1100px; side padding 16px on phones, 32px on desktop.

AVOID
- Gradients, heavy shadows, emoji, stock photos of people, invented testimonials, statistics or partner logos.
- Green + white + red together (reads as a national flag) and mosque or tile ornament. Imagery is about books.
- Login, sign-up forms, credits or points, app-download badges, prices, carts, tracking or analytics scripts.

ONE-PAGE SITE (only if I don't give you existing HTML)
1. Header: wordmark; nav «درباره ما»، «چطور کار می‌کند؟»، «دورهمی ماهانه»، «قوانین»; primary button «درخواست عضویت» linking to [لینک تماس].
2. Hero: h1 «کتابخانه‌ی پنهانِ برلین»; one line: «کتاب‌های خوب، به‌جای خاک خوردن در قفسه، دست‌به‌دست شوند.»; a small note that this is a pilot (پایلوت) with invited members.
3. «چطور کار می‌کند؟»: three steps — introduce a book with the #book tag in the Telegram group; message the owner to borrow it; exchange it at the monthly meetup or by arrangement.
4. «ما چه هستیم؟» and «ما چه نیستیم؟»: two cards side by side, stacked on mobile.
5. «دورهمی ماهانه‌ی مبادله‌ی کتاب»: dark ink section with [تاریخ]، [ساعت]، [محل برگزاری].
6. «قوانین در یک نگاه»: return by the next meetup (about one month); return in the same condition; don't lend a borrowed book onward; if lost or damaged, replace it or agree on a fair solution with the owner.
7. Footer: «پروژه‌ای داوطلبانه و غیرتجاری»; [ایمیل تماس]; placeholder links to Impressum and Datenschutz pages.

Write all visible copy in natural Persian. Mark every sentence you wrote yourself with an HTML comment <!-- AI copy: review --> so I can check it.
```
