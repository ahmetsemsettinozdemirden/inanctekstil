# TAC (tac.com.tr) Functionality Deep Dive

**Date:** 2026-03-14
**Purpose:** Comprehensive e-commerce functionality audit to inform inanctekstil.store feature parity
**Complements:** [analysis.md](analysis.md) (UX/design benchmark)

---

## 1. Header & Navigation

### Top Announcement Bar
- 3 rotating promotional messages (4.5s interval):
  1. "Ilk Alisverise Ozel %10 Indirim Kodu: HOSGELDIN10"
  2. "1000 TL ve Uzeri Alisverise Kargo Bedava"
  3. "3.500 TL ve Uzeri Ilk Alisveriste 300 TL Chip-Para Kazanma Firsati"
- Quick links left: Siparis Takibi, Kampanyalar, Magazalar
- Brand switcher right: TAC | Linens
- Background: #f5f5f5

### Logo & Search
- TAC logo: 84x72px, left-aligned
- Search bar: 528x40px, rounded (16px border-radius)
- Placeholder: "Evinizi guzellestirecek urunleri kesfedin"
- Focus state: border changes to brand red (#BF0D3E)
- Search results URL: `/tum-urunler?searchValue={query}`
- Mobile: full-width, hides on scroll down, reappears on scroll up

### Primary Navigation
- Campaign link highlighted in red: "2. URUNE %50 AZ ODE"
- Categories: YATAK ODASI, PERDE, ANINDA PERDE (emphasized), BEBEK & COCUK, BANYO, DEKORASYON, LISANSLI MARKALAR
- Mega menu with subcategories on hover
- Mobile: hamburger menu with drawer navigation

### User Actions (Right)
- Account icon -> /auth (login/register)
- Wishlist icon with badge counter -> /favori-listem
- Cart icon with item count badge
- All icons: 48px minimum touch target

---

## 2. Homepage Sections (Top to Bottom)

### Hero Carousel
- 7-10 rotating campaign slides
- 520px height, full width
- Left/right arrow navigation
- Shimmer loading placeholder
- Campaign themes: seasonal promos, collection launches, discount codes

### Category Cards ("Sizin Icin Sectigimiz Kategoriler")
- 6 category cards in responsive grid (max-width 1440px)
- Categories: Nevresim Takimlari, Perde, Battaniye, Havlu & Bornoz, Yastik, Yorgan
- Card specs: 192px images, 8px rounded borders, #f5f5f5 background
- CTA on each: "Alisverise Basla"
- 0.3s ease hover transition

### Best Sellers ("Cok Satan Urunler")
- Product carousel with horizontal scroll
- Standard product cards with prices, ratings, badges

### Featured Collections
- TAC Reborn Koleksiyonu
- TAC Secser Koleksiyonu
- Large banner format with lifestyle imagery

### Aninda Perde Banner
- Dedicated promotional banner for ready-made curtains
- Links to /aninda-perde special category

### Registration CTA
- Large hero section (656x520px)
- "Uye Ol, Ilk Alisverise Ozel %10 Indirim Kodu: HOSGELDIN10"
- Email input + "Uye Ol" button (dark red #C3110C)
- Font size: 40px for discount code

---

## 3. Category/Listing Page

### Layout
- Breadcrumbs: "Anasayfa > Perde"
- Page title with product count: "Perde (14)"
- Max-width: 1440px with responsive padding

### Filter Sidebar (Left)
- 6 filter types:
  - Urun Tipi (Product Type)
  - Ebat (Size)
  - Kalite (Quality)
  - Renk (Color)
  - Marka (Brand)
  - Fiyat (Price range)
- Material-UI select components: 16px font, 40-47px height, 16px border-radius
- Mobile: drawer component (80% width mobile, 500px tablet)

### Sort
- "Sirala" dropdown, right-aligned, 164px min-width

### Product Cards
- Responsive grid:
  - Desktop 1440px+: 3 columns (33.33%)
  - Tablet 1170-1439px: 3 columns
  - Mobile 768-1169px: 2 columns (50%)
  - Small mobile: 2 columns
- Card contents:
  - Product image: 100% aspect ratio, 16px border-radius
  - Title: single-line clamped (-webkit-line-clamp: 1)
  - Price: "3.315,00 TL" format (16px, weight-500)
  - Discount badge: top-left overlay
  - Installment text: "Pesin Fiyatina 3 Taksit" (green #417823)
  - Rating: stars + "5.0" + review count
  - Hover-visible buttons:
    - Add to cart: 45px circle, white bg, bottom-right
    - Wishlist: 45px circle, bottom-right
  - Card padding: 14.4px internal, 16px bottom margin

### Load More
- "Devamini Gor" button at bottom (not traditional pagination)
- 30 products per initial load

### SEO Content
- Rich text block below product grid
- Collapsible with "Devamini oku" button
- Gradient overlay: linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,1))

---

## 4. Product Detail Page (PDP)

### Image Gallery
- Multiple images (1-5 depending on product)
- Main display: up to 1500x1500px
- Thumbnails: 400x400px horizontal strip below
- Previous/next arrows
- Lightbox with full-screen capability
- Promotional badge overlay on main image

### Product Information
- H1: Product name with size
- Price: 22px, weight 400, burgundy #BF0D3E
- Installment badge: "Pesin Fiyatina 3 Taksit"
- Product code displayed

### Variant Selectors
- Color: inline thumbnails (64x64px, bordered) with label "Renk:"
- Size: clickable buttons (not dropdown), pre-selected current size, label "Ebat:"

### Actions
- Quantity: +/- counter with "adet" label, default 1
- "Sepete Ekle" (Add to Cart): primary burgundy button
- Wishlist: heart icon, top right
- Price notification: bell icon for price drops
- Share: social sharing button

### Accordion Tabs
- Tab 1 — "Urun Detaylari": product code, content details, material (%100 Poliester)
- Tab 2 — "Taksit Secenekleri": installment grid by bank
- Tab 3 — "Teslimat ve Iade": 2 business day shipping, 14-day returns, original packaging required

### Breadcrumbs
- Campaign-linked: "Anasayfa > Secili Hazir Perdelerde 3 Al 2 Ode!" > Product

---

## 5. Cart & Checkout

### Mini Cart
- Badge counter on cart icon in header
- Circular add-to-cart buttons (45px) on product cards

### Cart Page
- Not publicly accessible without items (returns 404 on /sepetim, /sepet, /alisveris-sepeti)
- Campaign references throughout: "Sepette" (in cart) discount indicators

### Checkout
- Not publicly accessible (requires items in cart)
- Payment methods: Visa, Mastercard, Troy
- 128-bit SSL encryption (Global Sign)

---

## 6. Search Functionality

### Search Bar
- Location: prominent in header, 528x40px desktop
- Placeholder: "Evinizi guzellestirecek urunleri kesfedin"
- Component: custom "search-box-component" v1

### Search Results Page
- URL: `/tum-urunler?searchValue={query}`
- Header: "Arama Sonuc '{query}'" with count
- Breadcrumb: "Anasayfa > Arama Sonuc '{query}'"
- Same filter sidebar as category pages
- Same product card layout as category pages
- No "did you mean" suggestions or related searches visible

---

## 7. Account System

### Login Page (/auth)
- Email field (required)
- Password field with visibility toggle
- "Beni hatirla" (Remember me) checkbox
- "Sifremi unuttum" (Forgot password) link
- "Giris Yap" button: #BF0D3E, rounded 82px, uppercase, 16px weight-500

### Registration
- Email field
- Privacy notice checkbox: "Aydinlatma Metnini okudum ve kabul ediyorum"
- Marketing consent checkbox with WhatsApp option
- "Kaydol" button

### Account Dashboard (/hesabim)
- Hesap Bilgilerim (Account Information)
- Adreslerim (My Addresses)
- Siparislerim (My Orders)
- Kupon Kodlarim (My Coupon Codes)
- Degerlendirmelerim (My Reviews)
- Stok Bildirimlerim (Stock Notifications)
- Favori Listem (My Favorites)
- Fiyat Alarmi (Price Alerts)
- Sifre Degistir (Change Password)
- Cikis Yap (Logout)

---

## 8. Promotions & Campaign System

### Campaign Types
1. Percentage discounts: "2. URUNE %50 AZ ODE" (50% off 2nd item)
2. Welcome discount: "HOSGELDIN10" (10% off first purchase)
3. Free shipping: 1000 TL+ orders
4. Buy X Get Y: "3 AL 2 ODE" (buy 3 pay 2)
5. Cart discounts: "Tekli Alimda Sepette %25 Az Ode"
6. Loyalty rewards: 300 TL Chip-Para on 3500+ TL first purchase

### Campaign Presentation
- Scrolling announcement bar with rotation
- Full-width clickable banners on homepage
- Dedicated landing pages (e.g., /secili-hazir-perdelerde-3-al-2-ode)
- Badge indicators on eligible products
- Multiple promotional messages stacked per product card

### Campaign Landing Pages
- Hero with campaign title
- Filter/sort options
- 30 items initial load with "Devamini Gor"
- Multiple promo badges per product

---

## 9. Payment & Installments

### Payment Methods
- Credit cards: Visa, Mastercard, Troy
- Bank transfer: 5 business day deadline

### Installment Plans
- "Pesin Fiyatina 3 Taksit" (3 installments at cash price)
- Up to 9 monthly installments available
- 10% finance charge for 4+ months

### Supported Banks
- Garanti Bankasi
- Is Bankasi (Maximum)
- Akbank (Axess)
- Finansbank (Card Finans)
- HSBC (Advantage)
- Yapi Kredi (World)

### Bank Transfer
- Payee: Zorluteks Tekstil Tic. ve San. A.S.
- IBAN: TR24 0013 4000 0000 0012 5000 77
- Branch: Denizbank Avrupa Kurulusu
- Note: "Online Siparis Bedeli" + order number

### Security
- 128-bit SSL encryption (Global Sign)

---

## 10. Aninda Perde (Instant Curtains) — Special Category

- URL: /aninda-perde
- Custom hero banner emphasizing customization
- "Pile secimi, olculer ve astar tipi gibi detaylari kisisellestirerek..."
- Two prominent CTAs: "Tul Perde" and "Fon Perde"
- Subcategories: Tul ve Fon Perdeler, Guneslik ve Karartmalar
- Measurement guides for 3 scenarios:
  - Kalorifer Ustu Perde Olcusu
  - Cam Hizasinda Perde Olcusu
  - Yere Kadar Uzanan Perde Olcusu
- FAQ integration
- Newsletter signup

---

## 11. Footer Structure

### Column 1 — KURUMSAL (Corporate)
- TAC'a Dair (About)
- Kataloglar (Catalogs)
- Kalite Belgeleri (Quality Certificates)
- Gelecek icin Bugun (Sustainability initiative)
- Surdurulebilirlik (Sustainability)
- Bayilerimiz (Dealers/Stores)

### Column 2 — MUSTERI HIZMETLERI (Customer Service)
- Musteri Hizmetleri Manifestosu
- Iletisim (Contact)
- Sik Sorulanlar (FAQ)
- Islem Rehberi (How-To Guide)
- Kargo (Shipping)
- Iade ve Garanti (Returns & Warranty)
- Odeme ve Taksit (Payment & Installment)

### Column 3 — SITE HAKKINDA (About Site)
- Kampanyalar
- Kullanim Kosullari (Terms)
- Cerez Politikasi (Cookie Policy)
- Guvenlik (Security)
- Site Haritasi (Sitemap)
- Tac Etbis Kod

### Newsletter Signup
- Email input, rounded
- Required checkboxes: privacy notice, marketing consent, WhatsApp opt-in
- "Kaydol" (Subscribe) button

### Bottom Bar
- Payment icons: Visa, MasterCard, Troy
- Social: Facebook, Instagram, YouTube
- Legal: KVKK, Aydinlatma Metni, Cookie Settings
- Copyright: 2026 TAC
- Technology partner: Inveon

### Contact
- Phone: 0850 202 01 08
- Email: info@tac.com.tr, havaletac@zorlu.com
- Address: Levent 199, Buyukdere Caddesi No:199, 34394 Sisli/Istanbul
- Contact form: Name, Surname, Email, Phone, Subject, Message (200 char limit)

---

## 12. Responsive Design

### Breakpoints
| Breakpoint | Width | Grid |
|------------|-------|------|
| Small mobile | < 600px | 2 columns |
| Tablet | 600-768px | 2-3 columns |
| Desktop | 768-1170px | 3 columns |
| Large desktop | 1170-1440px | 3-6 columns |
| XL desktop | 1440-1920px | 6 columns |

### Mobile Patterns
- Sticky header (position: sticky, top: 0)
- Hamburger menu with drawer navigation
- Search hides on scroll down, reappears on scroll up
- Filter sidebar becomes drawer (80% width)
- 48px minimum touch targets on all interactive elements
- Floating action button: 60px diameter, bottom-right (100px from bottom)
- Product grid: 3 col -> 2 col on mobile
- Typography scales: headings 24px -> 20px on tablets
- Padding: 16px mobile -> 24px tablet/desktop
- Footer collapses to single column

### Performance
- CDN: img-tac.mncdn.com (MediaNova Turkish CDN)
- WebP image delivery
- Shimmer loading placeholders
- Lazy loading on images

---

## 13. UX Micro-Interactions

### Hover States
- Product cards: rgba(0, 0, 0, 0.04) overlay
- Add-to-cart/wishlist buttons: hidden by default, visible on hover
- Navigation accent bar: 4px height, transparent -> #BF0D3E (0.25s ease)
- Links: text-decoration-color rgba(191, 13, 62, 0.4) -> solid

### Transitions
- Standard: 150ms cubic-bezier(0.4, 0, 0.2, 1)
- Link underlines: 0.25s ease
- Expandable content height: 1.3s
- Select icon rotation: 0.4s cubic-bezier(0.4, 0, 0.2, 1)

### Form States
- Default: border 1px solid #EAEAEA
- Focus: border-color #BF0D3E, border-width 2px
- Error: border-color #DD3545

---

## 14. Design Tokens

| Token | Value |
|-------|-------|
| Primary Color | #BF0D3E (burgundy) |
| Primary Hover | rgb(133, 9, 43) |
| Background | #F5F5F5 |
| Text Primary | #000000 / rgba(0,0,0,0.87) |
| Success | #417823 (installment text) |
| Error | #DD3545 |
| Border | #EAEAEA |
| Border Radius (inputs) | 16px |
| Border Radius (buttons) | 2px / 80px (rounded) |
| Font Family | League Spartan |
| Font Weights | 100-900 |

---

## 15. Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + Material-UI (custom, not WooCommerce) |
| Platform | Inveon e-commerce SaaS |
| CDN | MediaNova (mncdn.com) |
| Analytics | Google Tag Manager (GTM-PS9FBN) |
| Behavioral | Revotas (Customer ID: 1490) |
| Chat | Jetlink Web Chat |
| SSL | Global Sign 128-bit |
| Font | League Spartan (Google Fonts) |
| Company | Zorluteks Tekstil Tic. ve San. A.S. |
