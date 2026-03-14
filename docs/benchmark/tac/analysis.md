# TAC (tac.com.tr) E-Commerce Benchmark Analysis

**Date:** 2026-03-14
**Subject:** Competitive analysis of TAC's curtain e-commerce experience
**Purpose:** Identify best practices, UX patterns, and features to inform Inanc Tekstil's e-commerce strategy

---

## 1. Company Overview

- **Brand:** TAC (part of Zorluteks Tekstil Ticaret ve Sanayi A.S.)
- **Sister brand:** Linens (linens.com.tr) -- brand switcher in header
- **Product range:** Home textiles (bedding, curtains, towels, bathrobes, decoration)
- **Tech stack:** Next.js / React (SSR), CDN via mncdn.com, Inveon e-commerce platform
- **Live chat:** Jetlink widget
- **Payment:** Credit card with installment options ("Pesin Fiyatina 3 Taksit")

---

## 2. Homepage Analysis (tac.com.tr)

### Header Structure

| Element | Detail |
|---|---|
| Top bar (left) | Siparis Takibi, Kampanyalar, Magazalar |
| Top bar (center) | Promo banner: "Ilk Alisverise Ozel %10 Indirim Kodu: HOSGELDIN10" |
| Top bar (right) | Brand switcher: Tac \| Linens |
| Logo | Center-aligned |
| Search bar | Prominent, placeholder: "Evinizi guzellestirecek urunleri kesfedin" |
| Navigation | 2. URUNE %50 AZ ODE, YATAK ODASI, PERDE, ANINDA PERDE, BEBEK & COCUK, BANYO, DEKORASYON, LISANSLI MARKALAR |
| User actions | Account, Favorites (heart), Cart (with count badge) |

### Key Observations

1. **Strong promotional messaging** -- First-purchase discount code prominently displayed at all times
2. **"ANINDA PERDE" as a separate nav item** -- They differentiate "instant/ready" curtains from the main curtain category, suggesting they recognize customer urgency as a key purchase driver
3. **Campaign-first navigation** -- "2. URUNE %50 AZ ODE" (Buy 2nd at 50% off) is the first nav item, prioritizing deals
4. **Search bar with aspirational copy** -- Not just "Search" but "Discover products to beautify your home"

### Homepage Content Sections (top to bottom)

1. **Hero carousel** -- 10 rotating campaign banners (auto-play)
2. **"Sizin Icin Sectigimiz Kategoriler"** (Categories We Picked For You) -- 6 category cards: Nevresim Takimlari, Perde, Battaniye, Havlu & Bornoz, Yastik, Yorgan. Each with image + "Alisverise Basla" CTA
3. **"Cok Satan Urunler"** (Best Sellers) -- Product carousel
4. **"En Sevilen Koleksiyonlar"** (Most Loved Collections) -- Collection showcases
5. **"Aninda Perde"** banner -- Dedicated promotional banner for ready-made curtains
6. **Member signup CTA** -- "Uye Ol, Ilk Alisverise Ozel %10 Indirim" with email input
7. **Footer** -- E-Bulten, Kurumsal, Musteri Hizmetleri, Site Hakkinda, Populer Kategoriler, Social links, Payment logos

### Takeaways for Inanc Tekstil

- Curtains ("Perde") is one of only 6 featured categories on the homepage -- it's clearly a high-value category for TAC
- The "Aninda Perde" concept (ready-made curtains with fast delivery) has its own dedicated navigation and homepage banner -- this validates Inanc Tekstil's "havuz" (ready stock) product concept
- Strong use of social proof ("Cok Satan", "En Sevilen") to guide purchasing decisions
- First-purchase discount is a proven conversion tactic for new visitors

---

## 3. Category/Listing Page Analysis (tac.com.tr/perde)

### Page Structure

| Element | Detail |
|---|---|
| Breadcrumb | Anasayfa > Perde |
| Page title (H1) | "Perde" with product count "(14)" |
| Filters (left sidebar) | Urun Tipi, Ebat, Kalite, Renk, Marka, Fiyat |
| Sort | Dropdown (default sort) |
| Product grid | Card layout |

### Product Cards

Each product card contains:
- **Product image** (lifestyle/room photo, not just fabric swatch)
- **Promotional badge** -- "Pesin Fiyatina 3 Taksit" (3 installments at cash price)
- **Product name** -- Descriptive format: "Tac [Model] Hazir [Type] Perde [Color] [Width]x[Height] cm"
- **Price** -- Single price displayed (e.g., "3.315,00 TL")
- **Star ratings** -- Customer review stars
- **Favorite button** -- Heart icon for wishlist

### Product Naming Convention

TAC uses a consistent naming pattern:
```
[Brand] [Model Name] Hazir [Tul/Fon/Karartma] Perde [Color] [Width]x[Height] cm
```

Examples:
- Tac Sturdy Hazir Tul Perde Ekru 250x260 cm
- Tac Bright Hazir Fon Perde Koyu Gri 140x265 cm
- Tac Karartma Hazir Fon Perde Deve Tuyu 250x265 cm

### Filter Categories

| Filter | Purpose |
|---|---|
| Urun Tipi | Product type (Tul, Fon, Karartma, etc.) |
| Ebat | Size/dimensions |
| Kalite | Quality tier |
| Renk | Color |
| Marka | Brand |
| Fiyat | Price range |

### SEO Content

- Rich text block at the bottom of the listing page
- Content covers: perde modelleri, tul & fon perdeler, stor & karartma perdeler
- Internal links to subcategories
- "Devamini oku" (Read more) expandable text -- keeps page clean while providing SEO value

### Product Range & Pricing

- **Total products in category:** 14 (relatively small, focused catalog)
- **Price range:** 1,312.50 TL - 3,315.00 TL
- **Product types:** Tul perde, Fon perde, Karartma perde
- **All products are "Hazir" (ready-made)** with fixed dimensions

### Takeaways for Inanc Tekstil

- TAC sells only **ready-made (hazir) curtains** with fixed sizes -- Inanc Tekstil's **custom-cut (ozel dikim)** offering is a key differentiator
- Small, curated product catalog (14 items) rather than overwhelming selection
- Consistent product naming helps customers understand exactly what they're buying
- Lifestyle/room photos rather than just fabric swatches -- this sells the "look" not just the material
- SEO content at bottom of listing page is a good practice to adopt
- Filter system by type, size, color, and price is the minimum expected for curtain shopping

---

## 4. Product Detail Page Analysis

### 4a. Tul Perde Detail (Sturdy Hazir Tul Perde Ekru 250x260 cm)

**URL:** tac.com.tr/tac-sturdy-hazir-tul-perde-ekru-250x260-cm-p-1336

| Element | Detail |
|---|---|
| Breadcrumb | Anasayfa > Secili Hazir Perdelerde 3 Al 2 Ode! |
| H1 | Tac Sturdy Hazir Tul Perde Ekru 250x260 cm |
| Price | 3.315,00 TL |
| Installment badge | Pesin Fiyatina 3 Taksit |
| Product images | 5 images (gallery with thumbnails) |
| Color selector | "Renk: Ekru" with color swatch thumbnail |
| Size selector | "Ebat: 250X260" with buttons: 250X260, 300X260 |
| Quantity | +/- counter with "adet" label, default 1 |
| CTA | "Sepete Ekle" (Add to Cart) + Favorite button |
| Share/Notification | Price notification bell + Share button |

**Product Details (accordion):**
- Urun Kodu: 1000048795
- Urun Icerigi: Kanun Pilelidir
- Malzeme: %100 Poliester

**Additional Tabs:**
- Taksit Secenekleri (Installment Options)
- Teslimat ve Iade (Delivery and Returns)

### 4b. Fon/Karartma Perde Detail (Karartma Hazir Fon Perde Deve Tuyu 250x265 cm)

**URL:** tac.com.tr/tac-karartma-hazir-fon-perde-deve-tuyu-250x265-cm-p-1350

| Element | Detail |
|---|---|
| Breadcrumb | Anasayfa > Secili Hazir Perdelerde 3 Al 2 Ode! |
| H1 | Tac Karartma Hazir Fon Perde Deve Tuyu 250X265 cm |
| Price | 2.722,50 TL |
| Installment badge | Pesin Fiyatina 3 Taksit |
| Product images | 1 image (fewer than tul perde) |
| Color selector | "Renk: Bej" with 2 color swatch options |
| Size selector | "Ebat: 250X265" with single button |
| Quantity | +/- counter with "adet" label |
| CTA | "Sepete Ekle" + Favorite button |

**Product Details (accordion):**
- Urun Kodu: 1000018544
- Urun Icerigi: Ekstraforludur
- Malzeme: %100 Poliester
- Yikama & Bakim Bilgileri: Agartici kullanmayiniz

### Common PDP (Product Detail Page) Patterns

1. **Image gallery** -- Multiple product photos with thumbnail navigation; gallery supports zoom
2. **Color swatches** -- Visual color selection (not dropdown)
3. **Size as buttons** -- Clickable size buttons (not dropdown), pre-selected current size
4. **Accordion details** -- Product info, installment options, and delivery/returns in collapsible sections
5. **Prominent CTA** -- "Sepete Ekle" is the primary action
6. **Price notification** -- Bell icon to get notified of price drops (useful for out-of-stock or price-sensitive customers)
7. **Campaign breadcrumb** -- Breadcrumb links to campaign page rather than standard category (drives campaign awareness)

### Product Information Provided

| Info | Tul Perde | Fon/Karartma Perde |
|---|---|---|
| Urun Kodu (SKU) | Yes | Yes |
| Malzeme (Material) | %100 Poliester | %100 Poliester |
| Urun Icerigi (Content) | Kanun Pilelidir | Ekstraforludur |
| Yikama & Bakim (Care) | Not shown | Yes |
| Available Sizes | 2 options | 1 option |
| Available Colors | 1 | 2 |

### Takeaways for Inanc Tekstil

- **Simple, clean PDP layout** -- TAC keeps it minimal: images, price, color, size, add to cart
- **No calculator needed** -- Since TAC sells fixed-size ready-made curtains, no measurement calculator is needed. Inanc Tekstil's custom calculator is a competitive advantage for custom orders
- **Color selection via visual swatches** is more intuitive than dropdowns
- **Size buttons** clearly show available options at a glance
- **Accordion pattern** for additional details keeps the page clean
- **Installment info as a separate tab** is important for Turkish market (taksit is a key purchase driver)
- **Care instructions** (yikama bilgileri) should be included for all fabric products
- **Limited product information** -- TAC provides very minimal specs. Inanc Tekstil could differentiate by providing richer product details (fabric weight, light filtration %, exact material composition, etc.)

---

## 5. UX/UI Design Patterns

### Visual Design

- **Clean, minimal aesthetic** -- White background, generous whitespace
- **Professional product photography** -- Room/lifestyle shots showing curtains installed
- **Consistent typography** -- Clear hierarchy with heading sizes
- **Brand colors** used sparingly (logo, CTAs)

### Navigation & Information Architecture

- **Mega-menu navigation** with clear category hierarchy
- **Breadcrumbs** on all inner pages
- **Search** prominently placed in header
- **Sticky header** for easy navigation

### Trust & Conversion Elements

| Element | Purpose |
|---|---|
| "Pesin Fiyatina 3 Taksit" badge | Reduces price anxiety |
| Star ratings on product cards | Social proof |
| First purchase discount (HOSGELDIN10) | New customer acquisition |
| "3 Al 2 Ode" campaign | Increases average order value |
| Favorite/wishlist | Engagement, return visits |
| Price notification bell | Re-engagement for price-sensitive visitors |
| Jetlink live chat | Instant support |
| Cookie consent (KVKK) | Legal compliance, builds trust |

### Footer Structure

| Section | Links |
|---|---|
| KURUMSAL | Hakkimizda, Kataloglar, Kalite Belgeleri, Surdurulebilirlik, Bayilerimiz |
| MUSTERI HIZMETLERI | Musteri Hizmetleri Manifestosu, Iletisim, SSS, Islem Rehberi, Kargo, Iade ve Garanti, Odeme ve Taksit |
| SITE HAKKINDA | Kampanyalar, Kullanim Kosullari, Cerez Politikasi, Guvenlik, Site Haritasi, Etbis Kod |
| POPULER KATEGORILER | Nevresim Takimi, Perde, Pike, Yatak Ortusu, Yorgan, Yastik, Havlu, Bornoz, Battaniye |

### Legal/Compliance Pages

TAC has dedicated pages for:
- Kullanim Kosullari ve Uyelik Sozlesmesi
- Kisisel Verilerin Korunmasi
- Aydinlatma Metni
- KVKK Basvuru Formu
- Cerez Politikasi
- Iade ve Garanti
- Guvenlik

---

## 6. Key Differentiators: TAC vs Inanc Tekstil

| Aspect | TAC | Inanc Tekstil |
|---|---|---|
| **Product type** | Ready-made (hazir) curtains only, fixed sizes | Custom-cut (ozel dikim) + ready-made (havuz) |
| **Sizing** | Pre-defined sizes (e.g., 250x260, 300x260) | Customer specifies exact measurements |
| **Calculator** | Not needed (fixed sizes) | Curtain calculator for custom pricing |
| **Price range** | 1,312 - 3,315 TL | Varies by fabric meter + sewing |
| **Catalog size** | Small, curated (14 curtain products) | Growing (fabric-based, many combinations) |
| **Brand** | National brand (Zorluteks/Zorlu Group) | Local/regional brand (Iskenderun) |
| **Platform** | Custom Next.js (Inveon) | WooCommerce |
| **Scale** | Enterprise | Small business |

---

## 7. Recommendations for Inanc Tekstil

### High Priority (Adopt from TAC)

1. **Lifestyle product photography** -- Show curtains installed in rooms, not just fabric swatches. This is the single most impactful UX improvement for curtain sales.

2. **Consistent product naming convention** -- Adopt a clear pattern:
   ```
   [Fabric Model] [Type] Perde - [Color] (Ozel Dikim / Hazir)
   ```

3. **Installment information** -- Display "Pesin Fiyatina X Taksit" prominently on product cards and detail pages (once PayTR is active)

4. **Color swatches on PDP** -- Use visual color thumbnails instead of text dropdowns

5. **SEO content on category pages** -- Add rich text describing curtain types, fabrics, and buying guides at the bottom of listing pages

6. **Care instructions** -- Include washing/care info for each product

7. **Footer with trust links** -- Ensure all legal pages (KVKK, iade politikasi, kullanim kosullari) are linked in footer

### Medium Priority (Differentiation Opportunities)

8. **Emphasize custom-cut advantage** -- TAC only offers fixed sizes. Inanc Tekstil should prominently market "Olcunuze Ozel Dikim" as a key value proposition that TAC cannot match

9. **Richer product specifications** -- TAC provides minimal specs. Include fabric weight (gr/m2), light filtration percentage, exact composition, recommended room types

10. **Curtain calculator as hero feature** -- The calculator is something TAC doesn't have. Make it prominent and easy to use on every custom curtain product page

11. **"Aninda Perde" equivalent** -- Create a dedicated section/category for ready-made (havuz) products with fast shipping, similar to TAC's "Aninda Perde"

12. **First purchase discount** -- Implement a welcome coupon (e.g., HOSGELDIN) for new customers

### Lower Priority (Nice to Have)

13. **Wishlist/favorites** functionality
14. **Price drop notifications**
15. **Live chat widget** for instant support
16. **Star ratings / reviews** on products
17. **Campaign banners** on homepage for seasonal promotions
18. **Email newsletter signup** with incentive

---

## 8. Technical Observations

- TAC uses **Next.js with SSR** (React hydration errors visible in console -- Minified React error #418, #423)
- CDN: **mncdn.com** (MediaNova CDN, Turkish CDN provider)
- E-commerce platform: **Inveon** (Turkish e-commerce SaaS)
- Analytics: Google Analytics (tracking ID not found in current session, possibly consent-gated)
- Chat: **Jetlink** (Turkish live chat platform)
- Cookie consent: Custom KVKK-compliant banner with manage/reject/accept options
- Multiple React hydration errors suggest SSR/client mismatch issues -- their tech isn't perfect

---

## 9. Summary

TAC represents a **polished, enterprise-level e-commerce experience** for home textiles including curtains. Their strengths are in brand trust, clean UX, and professional photography. However, they only sell **ready-made curtains in fixed sizes**, which is a significant limitation.

Inanc Tekstil's **custom-cut curtain offering with an interactive calculator** is a genuine competitive advantage. The key takeaway is not to copy TAC, but to match their **baseline UX quality** (clean design, good photography, clear product information, trust signals) while **doubling down on the custom-cut differentiator** that TAC cannot offer.

The most impactful improvements for Inanc Tekstil, inspired by this benchmark:
1. Professional lifestyle photography
2. Clear, consistent product naming
3. Prominent installment/payment information
4. Rich product specifications
5. SEO-optimized category pages
6. Strong "custom-cut" messaging as the core value proposition
