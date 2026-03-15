# Feature Gap Analysis: TAC vs Inanc Tekstil

**Date:** 2026-03-14
**Purpose:** Map TAC functionality to inanctekstil.store requirements with theme and plugin recommendations
**Reference:** [TAC Functionality Deep Dive](tac/functionality-deep-dive.md)

---

## Theme Decision: Stay with Astra Free

### Why Keep Astra
- Already installed, documented, and configured
- 50KB frontend — fastest WooCommerce theme
- Full WooCommerce integration (header builder, footer builder, responsive grids)
- 1M+ installs, 4.9/5 rating — proven ecosystem
- Supports Google Fonts (Playfair Display + Inter)
- RTL-ready for Turkish
- Switching themes = migration risk with zero benefit

### Astra Free Covers
- Responsive header/footer builder
- WooCommerce shop/product layouts
- Custom color palette and typography
- Breadcrumbs
- Off-canvas mobile menu (hamburger)
- Product image gallery with zoom (WooCommerce native)
- Product tabs (WooCommerce native)
- Mini cart in header
- Sticky header option

### When to Consider Astra Pro
- Only after MVP launch + first 100 orders
- If advanced header elements are needed (mega menu, account dropdown)
- Not needed for initial launch

---

## Required Plugins (All Free)

| Plugin | Purpose | Matches TAC Feature | WP.org Slug |
|--------|---------|---------------------|-------------|
| FiboSearch (AJAX Search for WooCommerce) | Live search with product thumbnails/suggestions | TAC search bar | ajax-search-for-woocommerce |
| YITH WooCommerce Wishlist | Heart icon on products, favorites page | TAC wishlist/favorites | yith-woocommerce-wishlist |
| Smart Slider 3 | Hero carousel on homepage (2-3 slides) | TAC 7-10 slide hero | smart-slider-3 |
| Join.chat | WhatsApp floating button, bottom-right | TAC Jetlink chat widget | flavor for WhatsApp |
| ShortPixel Image Optimizer | WebP conversion, compression | TAC CDN-optimized WebP | shortpixel-image-optimiser |

**Total additional cost: 0 TL**

### Already Planned (from MVP Launch Plan)
| Plugin | Purpose | Status |
|--------|---------|--------|
| WP Mail SMTP | Email delivery for orders | Phase 4 |
| Complianz | KVKK/cookie compliance | Phase 4 |
| Site Kit by Google | Analytics, Search Console | Phase 4 |
| Wordfence | Security, brute-force protection | Phase 4 |
| Redis Object Cache | Performance caching | Already active |

---

## Feature-by-Feature Gap Analysis

### HEADER & NAVIGATION

| # | Feature | TAC | Inanc Current | Action | Priority |
|---|---------|-----|---------------|--------|----------|
| 1 | Announcement/promo bar | 3 rotating messages | None | Astra header builder: add top bar with promo text | High |
| 2 | Logo in header | Left-aligned, 84x72px | Brand kit ready, not uploaded | Upload SVG logo to Astra header | High |
| 3 | Search bar (prominent) | 528px, live suggestions | None | Install FiboSearch, place in header center | High |
| 4 | Account icon | Login/register link | WooCommerce native | Enable in Astra header builder | Medium |
| 5 | Wishlist icon with badge | Heart + count badge | None | Install YITH Wishlist, add icon to header | Medium |
| 6 | Cart icon with badge | Item count badge | WooCommerce basic | Astra header builder: enable cart icon + badge | High |
| 7 | Navigation menu | Mega menu, 7 categories | Basic 5-item menu | Restructure: Tul | Fon | Blackout | Saten | Hakkimizda | Iletisim | High |
| 8 | Sticky header | Yes, position: sticky | Astra supports | Enable in Astra settings | Medium |
| 9 | Mobile hamburger menu | Drawer navigation | Astra supports | Enable off-canvas menu in Astra | High |

### HOMEPAGE

| # | Feature | TAC | Inanc Current | Action | Priority |
|---|---------|-----|---------------|--------|----------|
| 10 | Hero carousel | 7-10 slides, 520px | None (empty page) | Smart Slider 3: create 2-3 slides | High |
| 11 | Category cards | 6 cards with images + CTA | None | Build with WooCommerce blocks or Astra shortcodes: 4 cards (Tul, Fon, Blackout, Saten) | High |
| 12 | Best sellers section | Product carousel | None | WooCommerce shortcode: [products limit="8" best_selling="true"] | Medium |
| 13 | Trust badges section | Taksit, kargo, iade | None | Custom section: 30 Yil Tecrube, Kendi Atolye, Olcuye Ozel, Ucretsiz Kargo | High |
| 14 | About teaser | N/A (TAC is corporate) | None | Short family story + "Hikayemizi Okuyun" CTA | Medium |
| 15 | Newsletter signup | Email + discount incentive | None | Add signup form with HOSGELDIN coupon | Low (post-launch) |
| 16 | Registration CTA | Large hero with %10 code | None | Consider after launch — welcome coupon via WooCommerce | Low |

### LISTING / SHOP PAGE

| # | Feature | TAC | Inanc Current | Action | Priority |
|---|---------|-----|---------------|--------|----------|
| 17 | Breadcrumbs | Anasayfa > Category | Astra supports | Enable in Astra WooCommerce settings | High |
| 18 | Product count | "Perde (14)" | WooCommerce native | Enable result count in Astra | Medium |
| 19 | Product filters | 6 types (type, size, color, quality, brand, price) | None | WooCommerce layered nav widgets: Category + Price | High |
| 20 | Sort dropdown | Multiple options | WooCommerce native | Enable sorting dropdown | High |
| 21 | Product grid | 3 col desktop, 2 col mobile | Astra default | Configure: 3 products/row desktop, 2 mobile | High |
| 22 | Product card: image | Lifestyle room photos | No products yet | Photograph fabrics and room installations | Critical |
| 23 | Product card: title | Consistent naming convention | No products yet | Format: "[Kumas] [Tip] Perde - [Renk] (Ozel Dikim)" | High |
| 24 | Product card: price | "3.315,00 TL" | WooCommerce native | Display metre fiyati format | High |
| 25 | Product card: rating | Stars + count | WooCommerce native | Enable reviews in WooCommerce settings | Medium |
| 26 | Product card: installment badge | "Pesin Fiyatina 3 Taksit" green text | None | Add after PayTR integration | Medium |
| 27 | Product card: wishlist button | Heart icon on hover | None | YITH Wishlist handles this | Medium |
| 28 | Load more button | "Devamini Gor" (not pagination) | WooCommerce pagination | Keep pagination — only ~20 products | Low |
| 29 | SEO content below grid | Expandable rich text | None | Add category descriptions in WooCommerce category editor | Medium |

### PRODUCT DETAIL PAGE (PDP)

| # | Feature | TAC | Inanc Current | Action | Priority |
|---|---------|-----|---------------|--------|----------|
| 30 | Image gallery | 1-5 images, thumbnails, zoom, lightbox | WooCommerce native | Upload multiple photos per product, enable zoom | High |
| 31 | Product title | H1 with name + size | WooCommerce native | Follow naming convention | High |
| 32 | Price display | Burgundy, prominent | WooCommerce native | Style with brand navy #1B2A4A | High |
| 33 | Color swatches | 64x64px visual thumbnails | N/A (each fabric is unique product) | Not needed — each kumas is a separate product | Skip |
| 34 | Size buttons | Clickable pre-defined sizes | N/A — custom sizing | CURTAIN CALCULATOR replaces this (competitive advantage) | N/A |
| 35 | Quantity selector | +/- counter | WooCommerce native | Already available | Done |
| 36 | "Sepete Ekle" button | Primary burgundy CTA | WooCommerce native | Style with brand navy #1B2A4A | High |
| 37 | Wishlist heart | Top-right of product info | None | YITH Wishlist | Medium |
| 38 | Accordion: product details | Code, material, content | WooCommerce tabs | Customize: Urun Ozellikleri, Bakim Bilgileri | High |
| 39 | Accordion: installments | Bank grid | None | Add after PayTR — "Taksit Secenekleri" tab | Medium |
| 40 | Accordion: delivery & returns | 2-day ship, 14-day return | None | Add "Kargo ve Iade" tab with content from docs/ecommerce/shipping-delivery.md | High |
| 41 | Price alert bell | Notify on price drops | None | Skip — overkill for small catalog | Skip |
| 42 | Social sharing | Share button | None | Low priority — skip for MVP | Skip |
| 43 | **CURTAIN CALCULATOR** | **Does not exist on TAC** | **v2.0.0 deployed** | **Prominent placement — this is our killer feature** | **Done** |

### CART & CHECKOUT

| # | Feature | TAC | Inanc Current | Action | Priority |
|---|---------|-----|---------------|--------|----------|
| 44 | Mini cart badge | Count in header | WooCommerce basic | Astra header: enable cart icon with count | High |
| 45 | Cart page | Product list, quantities, totals | WooCommerce native | Use WooCommerce cart blocks for modern layout | High |
| 46 | Coupon field | Campaign codes | WooCommerce native | Create HOSGELDIN coupon in WooCommerce | Medium |
| 47 | Checkout | Multi-step or single page | WooCommerce native | Use WooCommerce checkout blocks | High |
| 48 | Payment integration | Visa, Mastercard, Troy, bank transfer | PayTR (not yet active) | MVP Phase 3 — PayTR integration | High |
| 49 | Installment display | Bank grid in PDP + checkout | None | PayTR provides this after integration | High |
| 50 | Guest checkout | Available | WooCommerce setting | Enable in WooCommerce settings | High |

### ACCOUNT & LOYALTY

| # | Feature | TAC | Inanc Current | Action | Priority |
|---|---------|-----|---------------|--------|----------|
| 51 | Login/Register | Unified page with privacy consent | WooCommerce native | Customize WooCommerce my-account page | Medium |
| 52 | Order history | "Siparislerim" | WooCommerce native | Already available | Done |
| 53 | Address management | "Adreslerim" | WooCommerce native | Already available | Done |
| 54 | Wishlist page | "Favori Listem" | None | YITH Wishlist creates this page | Medium |
| 55 | Coupon codes | "Kupon Kodlarim" | None | Skip for MVP | Skip |
| 56 | Reviews | "Degerlendirmelerim" | WooCommerce native | Enable reviews | Medium |
| 57 | Stock notifications | "Stok Bildirimlerim" | None | Skip — custom-made products, no stock issues | Skip |
| 58 | Price alerts | "Fiyat Alarmi" | None | Skip — overkill for small catalog | Skip |
| 59 | Loyalty points (Chip-Para) | 300 TL rewards | None | Skip — too complex for MVP | Skip |

### TRUST & CONVERSION

| # | Feature | TAC | Inanc Current | Action | Priority |
|---|---------|-----|---------------|--------|----------|
| 60 | Installment badges on products | "Pesin Fiyatina 3 Taksit" | None | Add after PayTR integration | Medium |
| 61 | Free shipping threshold | "1000 TL Uzeri Bedava" | Planned (MVP Phase 1) | Configure in WooCommerce shipping | High |
| 62 | Welcome discount code | HOSGELDIN10 | None | Create WooCommerce coupon | Medium |
| 63 | WhatsApp chat | Jetlink (TAC) | None | Install Join.chat with WhatsApp number | High |
| 64 | Payment icons in footer | Visa, Mastercard, Troy | None | Add payment logos to Astra footer | High |
| 65 | Social links in footer | FB, Instagram, YouTube | None | Add Instagram link to Astra footer | Medium |
| 66 | SSL badge | Global Sign | Let's Encrypt (active) | Already secured — display lock icon if desired | Done |

### FOOTER

| # | Feature | TAC | Inanc Current | Action | Priority |
|---|---------|-----|---------------|--------|----------|
| 67 | Multi-column layout | 4 columns | "Powered by Astra" only | Build with Astra footer builder: 4 columns | High |
| 68 | Quick links column | Navigation links | None | Col 1: Ana Sayfa, Urunler, Hakkimizda, Iletisim | High |
| 69 | Customer service column | FAQ, shipping, returns, payment | None | Col 2: Kargo, Iade, Taksit (after PayTR) | High |
| 70 | Legal links column | KVKK, cookies, terms | None | Col 3: Gizlilik, Mesafeli Satis, Cerez, On Bilgilendirme | High |
| 71 | Contact info column | Address, phone, email | None | Col 4: Address, phone, WhatsApp, hours | High |
| 72 | Copyright + payment icons | Bottom bar | "Powered by Astra" | Customize bottom bar with copyright + Visa/MC/Troy | High |

### MOBILE

| # | Feature | TAC | Inanc Current | Action | Priority |
|---|---------|-----|---------------|--------|----------|
| 73 | Responsive grid | 3->2 col breakpoint | Astra default | Configure in Astra: 2 col mobile | High |
| 74 | Sticky header | position: sticky | Astra supports | Enable | High |
| 75 | Hamburger menu | Drawer navigation | Astra supports | Enable off-canvas | High |
| 76 | Touch targets | 48px minimum | Astra respects | Verify after build | High |
| 77 | Filter drawer | 80% width slide-out | WooCommerce native | Test with layered nav | Medium |
| 78 | Floating WhatsApp | Bottom-right, 60px | None | Join.chat handles this | High |

---

## Features Inanc Tekstil Has That TAC Doesn't

| Feature | Inanc Advantage |
|---------|----------------|
| Custom curtain calculator | TAC only sells fixed-size ready-made. We calculate exact pricing for custom measurements. |
| Custom sizing (ozel dikim) | Any window size supported, not limited to pre-defined dimensions. |
| Local/personal service | WhatsApp direct contact, family business trust, physical store in Iskenderun. |
| Fabric consultation | Kartela system — customers can visit store to see/touch fabrics. |

---

## Recommended Site Architecture

```
HEADER
+------------------------------------------------------------------+
| [Promo bar: "Olcunuze Ozel Dikim Perde - 1000 TL Uzeri Bedava"] |
+------------------------------------------------------------------+
| [Logo]    [====== FiboSearch ======]    [Account] [Heart] [Cart] |
+------------------------------------------------------------------+
| Ana Sayfa | Tul | Fon | Blackout | Saten | Hakkimizda | Iletisim|
+------------------------------------------------------------------+

HOMEPAGE
+------------------------------------------------------------------+
| [Hero Carousel: 2-3 slides]                                      |
|   1. "30 Yildir Olcunuze Ozel Dikim" + CTA                     |
|   2. "Her Pencereye Ozel" + calculator visual                    |
|   3. "Kendi Atolyemizde Dikiyoruz" + workshop photo             |
+------------------------------------------------------------------+
| [Category Cards: 4 grid]                                          |
|   [Tul Perde]  [Fon Perde]  [Blackout]  [Saten]                |
+------------------------------------------------------------------+
| [Featured Products: 4-8 grid]                                     |
|   "One Cikan Urunler"                                            |
+------------------------------------------------------------------+
| [Trust Badges: 4 icons]                                           |
|   30 Yil | Kendi Atolye | Olcuye Ozel | Ucretsiz Kargo         |
+------------------------------------------------------------------+
| [About Teaser: family story + CTA]                               |
+------------------------------------------------------------------+

SHOP PAGE
+------------------------------------------------------------------+
| Breadcrumb: Anasayfa > Tul Perdeler                              |
+------------------------------------------------------------------+
| [Filters]  | [Sort: v]                                          |
| Category   | +------------------------------------------+        |
| Price      | | [Img] | [Img] | [Img] |                  |        |
|            | | Name  | Name  | Name  |                  |        |
|            | | Price | Price | Price |                  |        |
|            | | Stars | Stars | Stars |                  |        |
|            | +------------------------------------------+        |
+------------------------------------------------------------------+
| [SEO content: expandable text about curtain types]               |
+------------------------------------------------------------------+

PRODUCT PAGE
+------------------------------------------------------------------+
| Breadcrumb: Anasayfa > Tul Perdeler > Lecino Tul Perde          |
+------------------------------------------------------------------+
| [Image Gallery]  | Lecino Tul Perde - Ekru (Ozel Dikim)         |
| [thumb][thumb]   | 175,00 TL / metre                KDV dahil   |
|                  |                                                |
|                  | === PERDE HESAP MAKINESI ===                   |
|                  | Pencere Eni: [___] cm                         |
|                  | Pile Orani: [1:2 v]                           |
|                  |                                                |
|                  | Kumas: 3.50 m      612,50 TL                 |
|                  | Dikim:             175,00 TL                  |
|                  | TOPLAM:            787,50 TL                  |
|                  |                                                |
|                  | [====== SEPETE EKLE ======]    [Heart]        |
+------------------------------------------------------------------+
| [Urun Detaylari] [Bakim Bilgileri] [Kargo & Iade]               |
+------------------------------------------------------------------+

FOOTER
+------------------------------------------------------------------+
| [Logo + desc]    | Hizli Linkler | Musteri Hizmetleri | Iletisim|
| Instagram link   | Ana Sayfa     | Iade Politikasi    | Adres   |
|                  | Urunler       | KVKK               | Telefon |
|                  | Hakkimizda    | Mesafeli Satis     | WhatsApp|
|                  | Iletisim      | Cerez Politikasi   | Saatler |
+------------------------------------------------------------------+
| (c) 2026 Inanc Tekstil    [Visa] [Mastercard] [Troy]            |
+------------------------------------------------------------------+

FLOATING: [WhatsApp button bottom-right]
```

---

## Implementation Priority

### Phase A: Core E-Commerce UX (do first)
1. Astra header: logo + search (FiboSearch) + account/wishlist/cart icons
2. Astra header: announcement promo bar
3. Astra footer: 4-column layout + payment icons + copyright
4. Shop page: product grid (3 col), filters, sort, breadcrumbs
5. Product page: gallery zoom, accordion tabs (details, care, shipping)
6. Mobile: sticky header, hamburger menu, 2-col grid, WhatsApp button

### Phase B: Homepage & Content (do second)
7. Hero carousel: 2-3 slides with Smart Slider 3
8. Category cards: 4 cards linking to product categories
9. Trust badges: 4 icons with text
10. Featured products: shortcode grid
11. About teaser section

### Phase C: Conversion & Polish (do third)
12. Welcome coupon: HOSGELDIN (WooCommerce coupon)
13. SEO content on category pages
14. Star ratings/reviews enabled
15. Installment badges (after PayTR active)
16. Newsletter signup

---

## What NOT to Copy from TAC

| TAC Feature | Skip Because |
|-------------|-------------|
| Mega menu | Only 4 categories — simple dropdown is cleaner |
| Brand switcher (TAC/Linens) | Single brand |
| Licensed products (Disney, sports) | Not applicable |
| Loyalty points (Chip-Para) | Too complex for MVP, tiny customer base initially |
| Price drop notifications | Overkill for ~20 products |
| Stock notifications | Custom-made products have no stock — irrelevant |
| 10-slide hero carousel | Not enough content — 2-3 slides max |
| Next.js/React SSR | WooCommerce is correct for this scale |
| Load more button | Pagination fine for ~20 products |
| Campaign landing pages | Only needed when running multi-campaign promotions |
| Behavioral tracking (Revotas) | Google Analytics sufficient for MVP |
| Custom search autocomplete | FiboSearch covers this adequately |
